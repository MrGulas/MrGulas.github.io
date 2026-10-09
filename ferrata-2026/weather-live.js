/* Via Ferrata Atlas: fresh forecast filtering.
   Live Open-Meteo model data is separate from route-access status. */
(function(){
"use strict";
const db=window.FERRATA_DB;
const button=document.getElementById("fetchLiveForecast");
const dateField=document.getElementById("liveForecastDate");
const status=document.getElementById("liveForecastStatus");
if(!db?.routes||!button||!dateField||!status)return;
const DATE_KEY="ferrataWOW_weather_date_v1";
const CACHE_KEY="ferrataWOW_live_weather_v2";
const CACHE_MAX_AGE=3*60*60*1000;
const forecast={active:false,metrics:[],date:null,updatedAt:null};
window.FERRATA_LIVE=forecast;
const cardList=[...document.querySelectorAll("#cards>.card")];
const sourceLink='https://www.alpenverein.de/bergwetter/alpen/';
const initialCardTexts=new Map([...document.querySelectorAll("#cards>.card")].map(card=>[Number(card.dataset.orig),{text:card.querySelector(".mm")?.textContent||"",title:card.querySelector(".mm")?.title||""}]));
const sum=values=>values.reduce((a,b)=>a+(Number.isFinite(b)?b:0),0);
const previousDate=day=>{const date=new Date(day+"T12:00:00Z");date.setUTCDate(date.getUTCDate()-1);return date.toISOString().slice(0,10)};

function aggregate(data,day){
 const h=data?.hourly, t=h?.time;
 if(!Array.isArray(t)||!Array.isArray(h.precipitation)||h.precipitation.length!==t.length)throw Error("Нет почасовых осадков");
 const inHours=(hour,from,to)=>hour>=from&&hour<=to;
 const now=t.map((v,i)=>i).filter(i=>t[i]?.slice(0,10)===day&&inHours(Number(t[i].slice(11,13)),8,20));
 const climbing=now.filter(i=>inHours(Number(t[i].slice(11,13)),10,16));
 const yesterday=t.map((v,i)=>i).filter(i=>t[i]?.slice(0,10)===previousDate(day)&&inHours(Number(t[i].slice(11,13)),0,23));
 if(now.length<10)throw Error("Недостаточно данных на выбранную дату");
 const vals=keys=>keys.map(i=>h.precipitation[i]).filter(v=>typeof v==="number"&&Number.isFinite(v));
 const dayVals=vals(now);
 if(dayVals.length<10)throw Error("Прогноз осадков отсутствует");
 const byIdx=(key,indices)=>indices.map(i=>h[key]?.[i]).filter(v=>typeof v==="number"&&Number.isFinite(v));
 const probability=byIdx("precipitation_probability",climbing);
 const temperature=byIdx("temperature_2m",now);
 const gusts=byIdx("wind_gusts_10m",now);
 const snow=byIdx("snowfall",now);
 return {mm:Math.round(sum(dayVals)*10)/10,climbMm:Math.round(sum(vals(climbing))*10)/10,
   prevMm:Math.round(sum(vals(yesterday))*10)/10,
   maxPop:probability.length?Math.max(...probability):null,
   minTemp:temperature.length?Math.min(...temperature):null,
   maxGust:gusts.length?Math.max(...gusts):null,
   snowCm:snow.length?Math.round(sum(snow)*10)/10:null};
}
function groups(){
 const map=new Map();
 db.routes.forEach((r,index)=>{
  if(!Number.isFinite(Number(r.lat))||!Number.isFinite(Number(r.lon)))return;
  const key=Number(r.lat).toFixed(4)+","+Number(r.lon).toFixed(4);
  if(!map.has(key))map.set(key,{lat:r.lat,lon:r.lon,indices:[]});
  map.get(key).indices.push(index);
 });
 return [...map.values()];
}
async function query(chunk,day){
 const p=new URLSearchParams({
   latitude:chunk.map(c=>c.lat).join(","),
   longitude:chunk.map(c=>c.lon).join(","),
   hourly:"precipitation,precipitation_probability,temperature_2m,cloud_cover,snowfall,wind_gusts_10m",
   timezone:"Europe/Vienna",
   start_date:previousDate(day),end_date:day
 });
 const url="https://api.open-meteo.com/v1/forecast?"+p.toString();
 const ctrl=new AbortController();
 const timeout=setTimeout(()=>ctrl.abort(),22000);
 try {
  const response=await fetch(url,{cache:"no-store",signal:ctrl.signal});
  if(!response.ok)throw Error("Open-Meteo HTTP "+response.status);
  const payload=await response.json();
  if(payload.error)throw Error(payload.reason||"Ошибка погодного API");
  const entries=Array.isArray(payload)?payload:[payload];
  if(entries.length!==chunk.length)throw Error("Неполный ответ Open-Meteo");
  return entries.map((entry,i)=>({indices:chunk[i].indices,result:aggregate(entry,day)}));
 }finally{clearTimeout(timeout)}
}
function formatDate(day){const parts=day.split("-");return parts[2]+"."+parts[1]+"."+parts[0]}
function readCache(){try{return JSON.parse(localStorage.getItem(CACHE_KEY)||"null")}catch(e){return null}}
function saveDate(day){try{localStorage.setItem(DATE_KEY,day)}catch(e){}}
function saveCache(){try{localStorage.setItem(CACHE_KEY,JSON.stringify({date:forecast.date,updatedAt:forecast.updatedAt,metrics:forecast.metrics}))}catch(e){}}
function restoreCards(){
 cardList.forEach(card=>{
   const index=Number(card.dataset.orig);
   const badge=card.querySelector(".mm");
   if(!badge)return;
   badge.textContent=initialCardTexts.get(index)?.text||"";
   badge.title=initialCardTexts.get(index)?.title||"";
 });
}
function updateCards(){
 cardList.forEach(card=>{
   const index=Number(card.dataset.orig);
   const el=card.querySelector(".mm");if(!el)return;
   const metric=forecast.metrics[index];
   if(!metric){el.textContent="🌧 Нет свежих данных";el.title="Для этой ферраты почасовой прогноз недоступен; она не считается сухой автоматически.";return}
   el.textContent="🌦 "+metric.mm.toFixed(1)+" мм · 08–20";
   el.title="Open-Meteo "+formatDate(forecast.date)+": 08:00–20:00 "+metric.mm.toFixed(1)+" мм, 10:00–17:00 "+metric.climbMm.toFixed(1)+" мм; предыдущие сутки "+metric.prevMm.toFixed(1)+" мм. Это модель, а не измерение состояния скалы.";
 });
}
function showForecastStatus(fromCache){
 const label=document.getElementById("rainLimitLabel");
 if(label)label.textContent="Новый прогноз · осадки 08–20, не более";
 const filterNote=document.getElementById("rainFilterNote");
 if(filterNote)filterNote.textContent="Фильтр учитывает модельные осадки 08:00–20:00 по району, не мокроту стены и не закрытия. Карточки без свежих данных не считаются сухими.";
 const moment=new Date(forecast.updatedAt).toLocaleString("ru-RU",{dateStyle:"short",timeStyle:"short"});
 const count=forecast.metrics.filter(Boolean).length;
 status.innerHTML="<strong>Прогноз Open-Meteo на "+formatDate(forecast.date)+(fromCache?" восстановлен":" загружен")+" · обновлён "+moment+"</strong> · "+count+" из "+db.routes.length+" маршрутов. Фильтр и сортировка используют эти данные. <a href='"+sourceLink+"' target='_blank' rel='noopener noreferrer'>Сверить с DAV / GeoSphere ↗</a>";
 document.getElementById("liveForecastPanel")?.classList.add("isFresh");
 window.FERRATA_REDRAW?.();
}
function restoreSaved(){
 let savedDate="";try{savedDate=localStorage.getItem(DATE_KEY)||""}catch(e){}
 if(/^\d{4}-\d\d-\d\d$/.test(savedDate))dateField.value=savedDate;
 const cached=readCache();
 if(!cached||cached.date!==dateField.value||!Array.isArray(cached.metrics)||!cached.updatedAt)return false;
 forecast.active=true;forecast.date=cached.date;forecast.updatedAt=cached.updatedAt;forecast.metrics=cached.metrics;
 updateCards();showForecastStatus(true);return Date.now()-new Date(cached.updatedAt).getTime()<CACHE_MAX_AGE;
}
let loading=false;
async function refresh(){
 if(loading)return;
 const day=dateField.value;
 if(!/^\d{4}-\d\d-\d\d$/.test(day)){status.textContent="Выбери дату прогноза.";return}
 saveDate(day);
 loading=true;button.disabled=true;button.textContent="⏳ Загружаю прогнозы…";
 status.textContent="Получаем модель для всех горных районов. Старые числа пока не меняются.";
 const available=groups(),metrics=Array(db.routes.length).fill(null);let successes=0,failures=0;
 try{
  for(let i=0;i<available.length;i+=9){
    const batch=available.slice(i,i+9);
    try{const response=await query(batch,day);for(const item of response){for(const index of item.indices){metrics[index]=item.result;successes++}}}
    catch(error){failures+=batch.length;console.warn("Open-Meteo regional batch unavailable:",error)}
  }
  if(!successes){forecast.active=false;restoreCards();document.getElementById("liveForecastPanel")?.classList.remove("isFresh");const label=document.getElementById("rainLimitLabel");if(label)label.textContent="Осадки 10.10 · архивный снимок 08.10";window.FERRATA_REDRAW?.();status.textContent="Не удалось получить прогноз. Прежние оценки — исторические, не используйте их как подтверждение сухой скалы.";return}
  forecast.active=true;forecast.date=day;forecast.updatedAt=new Date().toISOString();
  forecast.metrics=metrics;saveCache();updateCards();showForecastStatus(false);
  if(failures)status.insertAdjacentText("beforeend"," Часть районов не ответила; маршруты без прогноза исключены из погодного фильтра.");
 }finally{loading=false;button.disabled=false;button.textContent="↻ Обновить снова"}
}
button.addEventListener("click",refresh);
dateField.addEventListener("change",()=>{saveDate(dateField.value);forecast.active=false;restoreCards();document.getElementById("liveForecastPanel")?.classList.remove("isFresh");status.textContent="Дата изменена — загружаю прогноз для нового дня…";window.FERRATA_REDRAW?.();refresh()});
const cacheIsFresh=restoreSaved();
if(!cacheIsFresh)refresh();
})();
