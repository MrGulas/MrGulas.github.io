(function(){
"use strict";
const db=window.FERRATA_DB, $=id=>document.getElementById(id);
if(!db?.routes)return;
const KEY="ferrataWOW_compare_v2";
const getIds=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"[]").filter(x=>Number.isInteger(x)&&x>=0&&x<db.routes.length).slice(0,5)}catch(e){return []}};
const setIds=ids=>{localStorage.setItem(KEY,JSON.stringify(ids));window.dispatchEvent(new Event("atlas:changed"))};
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const statusLabels={green:"🟢 Реалистично",yellow:"🟡 При условиях",orange:"🟠 С ограничениями",red:"🔴 Не рекомендуется",closed:"⛔ Исключено"};
const countryLabels={AT:"🇦🇹 Австрия",DE:"🇩🇪 Германия",SK:"🇸🇰 Словакия",SI:"🇸🇮 Словения"};
const minutes=r=>r.climbMin==null||r.climbMax==null?"Нет точных данных":r.climbMin+"–"+r.climbMax+" мин*";
const drive=r=>r.driveHours==null?"Нужно уточнить":"≈ "+r.driveHours.toFixed(1)+" ч из Праги";
const photoSearch=(name,kind)=>"https://www.google.com/search?tbm=isch&q="+encodeURIComponent(name+" Fotos "+(kind==="lake"?"See Österreich":kind==="hike"||kind==="view"?"Wanderung Panorama":"Klettersteig"));
const hrLink=r=>"./route.html?route="+encodeURIComponent(r.slug);
const source=r=>r.topo||photoSearch(r.name);
function photoCell(r){
 const segments=r.components||[];
 const img=segments.find(p=>p.photo?.src)?.photo||r.photos?.[0];
 if(img?.src)return '<a href="'+esc(img.source||source(r))+'" rel="noreferrer noopener" target="_blank" class="comparePhoto"><img loading="lazy" src="'+esc(img.src)+'" alt="'+esc(img.alt||r.name)+'" onerror="this.closest(&quot;a&quot;).classList.add(&quot;photoBroken&quot;)"><span>Источник фотографии ↗</span></a>';
 return '<div class="comparePhoto comparisonNoPhoto">🏔<small>Фотография не подтверждена</small></div>';
}
const cells=(r,fn)=>r.map(x=>'<td>'+fn(x)+'</td>').join("");
const row=(name,rs,func)=>'<tr><th scope="row">'+name+'</th>'+cells(rs,func)+'</tr>';
const section=(name,count)=>'<tr class="matrixSection"><th colspan="'+(count+1)+'">'+name+'</th></tr>';
function components(r){
 if(r.components?.length)return '<div class="compareParts">'+r.components.map(c=>'<a target="_blank" rel="noopener noreferrer" href="'+photoSearch(c.name,c.kind)+'">'+(c.kind==="lake"?"💧":c.kind==="ferrata"?"🧗":"🥾")+' '+esc(c.name)+' ↗</a>').join("")+'</div>';
 return '<a class="matrixTextLink" target="_blank" rel="noopener noreferrer" href="'+photoSearch(r.name)+'">Фотографии именно этой линии ↗</a>';
}
function textOrTopo(r,key){return r.guide?.[key]?'<span class="matrixProse">'+esc(r.guide[key])+'</span>':'<span class="matrixMuted">Подробности подхода и спуска — в оригинальном топо. Не указаны без проверки.</span>'}

/* Mobile: compare any two of the five routes vertically, section by section,
   without requiring a 1200px-wide spreadsheet to be swiped on a 390px phone. */
const PAIR_KEY="ferrataAtlas_mobileComparePair_v1";
function getPair(routes){
 const ids=routes.map(r=>r.id);
 let saved=[];try{saved=JSON.parse(localStorage.getItem(PAIR_KEY)||"[]")}catch(e){}
 if(!Array.isArray(saved))saved=[];
 const first=ids.includes(saved[0])?saved[0]:ids[0];
 const second=saved.length>1&&saved[1]===null?null:(ids.includes(saved[1])&&saved[1]!==first?saved[1]:(ids.find(x=>x!==first)||null));
 return [first,second];
}
function setPair(pair){try{localStorage.setItem(PAIR_KEY,JSON.stringify(pair))}catch(e){}}
function mobileSelect(label,slot,value,routes){
 return '<label class="mobileSelectField"><span>'+label+'</span><select data-mobile-slot="'+slot+'" aria-label="'+label+'">'+
 (slot===1?'<option value="">Только один маршрут</option>':"")+
 routes.map(r=>'<option value="'+r.id+'" '+(r.id===value?"selected":"")+'>'+esc(r.name)+'</option>').join("")+'</select></label>';
}
function mobileLongText(label,html,plain){
 const val=plain.trim();if(val.length<185)return html;
 return '<div class="mobileExcerpt">'+esc(val.slice(0,120))+'…</div><details class="mobileMore"><summary>Раскрыть полностью ↓</summary><div>'+html+'</div></details>';
}
function renderMobile(routes){
 const target=$("compareMobile");if(!target)return;
 if(!routes.length){target.innerHTML="";return}
 const pair=getPair(routes);setPair(pair);
 const shown=pair.map(id=>routes.find(r=>r.id===id)).filter(Boolean);
 const matrix=$("compareMatrix").querySelector("table");
 if(!matrix)return;
 let out='<div class="mobileCompareIntro"><span class="atlasEyebrow">Сравнение на телефоне</span><h2>Два маршрута — все детали</h2><p>Выбери любые две из '+routes.length+' добавленных феррат. Сравнивай по показателям, раскрывай длинные описания и меняй маршруты одним нажатием.</p></div>';
 out+='<div class="mobileCompareSelectors">'+mobileSelect("Маршрут № 1",0,pair[0],routes)+mobileSelect("Маршрут № 2",1,pair[1],routes)+'</div>';
 out+='<div class="mobileCompareHeroes'+(shown.length===1?" oneColumn":"")+'">'+shown.map((r,i)=>'<div class="mobileCompareHero"><div class="mobileHeroPhoto">'+photoCell(r)+'</div><span class="mobileRouteIndex">'+(i+1).toString().padStart(2,"0")+'</span><a href="'+hrLink(r)+'" class="mobileHeroTitle">'+esc(r.name)+'</a><div class="mobileHeroMeta">✨ '+r.wow+'/10 · '+esc(r.grade)+'</div><button type="button" class="mobileRemove" data-mobile-remove-id="'+(r.id-1)+'" aria-label="Убрать маршрут из сравнения">✕ Убрать</button></div>').join("")+'</div>';
 const indexById=id=>routes.findIndex(r=>r.id===id);
 const body=matrix.tBodies[0];
 if(!body){target.innerHTML=out;return}
 let group=null,metrics=[];
 function flush(){
  if(!group)return;
  out+='<details class="mobileCompareGroup" open><summary><strong>'+esc(group)+'</strong><span aria-hidden="true">⌄</span></summary><div class="mobileCompareMetrics">'+metrics.join("")+'</div></details>';
  metrics=[];
 }
 for(const tr of body.rows){
  if(tr.classList.contains("matrixSection")){
   flush();group=tr.textContent.trim();continue;
  }
  const th=tr.querySelector('th[scope="row"]');if(!th)continue;
  const title=th.textContent.trim(),cols=[...tr.querySelectorAll("td")];
  const values=shown.map((r,i)=>{
   const pos=indexById(r.id),cell=cols[pos];if(!cell)return '<div class="mobileValue">—</div>';
   let inner=cell.innerHTML.replace(/id="cmpWX-(\d+)"/g,'id="cmpMobileWX-$1"');
   if(title==="Почему сюда"||title==="Подход и логистика"||title==="Хайк после ферраты"||title==="Риски и ограничения")
     inner=mobileLongText(title,inner,cell.textContent||"");
   return '<div class="mobileValue"><span class="mobileValueLabel">Маршрут '+(i+1)+'</span>'+inner+'</div>';
  });
  metrics.push('<article class="mobileCompareMetric"><h3>'+esc(title)+'</h3><div class="mobileValueGrid'+(shown.length===1?" oneColumn":"")+'">'+values.join("")+'</div></article>');
 }
 flush();
 out+='<p class="mobileCompareDisclaimer">* Продолжительность ориентировочная. Прогноз Open-Meteo — модель по координатам района, а не подтверждение безопасности ферраты.</p>';
 target.innerHTML=out;
 target.querySelectorAll("[data-mobile-remove-id]").forEach(btn=>btn.addEventListener("click",()=>{const id=Number(btn.dataset.mobileRemoveId);setIds(getIds().filter(x=>x!==id));display()}));
 target.querySelectorAll("[data-mobile-slot]").forEach(select=>select.addEventListener("change",()=>{
   const sel=Number(select.dataset.mobileSlot),next=[...pair];
   next[sel]=select.value?Number(select.value):null;
   if(next[0]===next[1] && next[1]!=null){
      if(sel===1){next[0]=routes.find(r=>r.id!==next[1])?.id||next[0]}
      else {next[1]=routes.find(r=>r.id!==next[0])?.id||null}
   }
   if(next[0]==null){next[0]=routes[0].id;next[1]=null}
   setPair(next);
   renderMobile(routes);refreshWeather();
 }));
}
/* Desktop: show explicit arrows and allow click-and-drag column navigation.
   Normal vertical mouse-wheel must keep scrolling the document. */
const scrollElement=document.querySelector(".compareScroll");
function refreshScrollNav(){
 if(!scrollElement)return;
 const max=Math.max(0,scrollElement.scrollWidth-scrollElement.clientWidth);
 const left=$("compareScrollLeft"),right=$("compareScrollRight"),bar=$("compareScrollProgressBar");
 if(left)left.disabled=scrollElement.scrollLeft<=2;
 if(right)right.disabled=scrollElement.scrollLeft>=max-2;
 if(bar){const pct=scrollElement.scrollWidth?Math.min(100,scrollElement.clientWidth/scrollElement.scrollWidth*100):100;bar.style.width=pct+"%";bar.style.marginLeft=(scrollElement.scrollWidth?scrollElement.scrollLeft/scrollElement.scrollWidth*100:0)+"%"}
}
["compareScrollLeft","compareScrollRight"].forEach((id,i)=>$(id)?.addEventListener("click",()=>{
 const direction=i===0?-1:1;
 scrollElement?.scrollBy({left:direction*Math.max(240,scrollElement.clientWidth*.75),behavior:"smooth"});
}));
if(scrollElement){
 scrollElement.addEventListener("scroll",refreshScrollNav,{passive:true});
 scrollElement.addEventListener("keydown",event=>{
  if(event.target!==scrollElement)return;
  if(event.key==="ArrowRight"||event.key==="ArrowLeft"){
    event.preventDefault();scrollElement.scrollBy({left:(event.key==="ArrowRight"?1:-1)*290,behavior:"smooth"});
  }
 });
 scrollElement.addEventListener("wheel",event=>{
  // Shift-wheel is an intentional horizontal-navigation gesture. Ordinary
  // wheel events must bubble to the document for natural vertical scrolling.
  if(!event.shiftKey||Math.abs(event.deltaY)<Math.abs(event.deltaX))return;
  const max=scrollElement.scrollWidth-scrollElement.clientWidth;
  const next=scrollElement.scrollLeft+event.deltaY;
  if((event.deltaY<0&&scrollElement.scrollLeft>0)||(event.deltaY>0&&scrollElement.scrollLeft<max)){
   event.preventDefault();
   scrollElement.scrollLeft=Math.max(0,Math.min(max,next));
  }
 },{passive:false});
 let drag=null;
 scrollElement.addEventListener("pointerdown",event=>{
  if(event.pointerType!=="mouse"||event.button!==0||scrollElement.scrollWidth<=scrollElement.clientWidth+1)return;
  if(event.target.closest("a,button,input,select,textarea,summary"))return;
  drag={id:event.pointerId,start:event.clientX,scroll:scrollElement.scrollLeft,moved:false};
  try{scrollElement.setPointerCapture(event.pointerId)}catch(e){}
 });
 scrollElement.addEventListener("pointermove",event=>{
  if(!drag||drag.id!==event.pointerId)return;
  const delta=drag.start-event.clientX;
  if(Math.abs(delta)>5){
   drag.moved=true;
   scrollElement.classList.add("dragging");
   scrollElement.scrollLeft=drag.scroll+delta;
  }
 });
 function endDrag(){drag=null;scrollElement.classList.remove("dragging")}
 scrollElement.addEventListener("pointerup",endDrag);
 scrollElement.addEventListener("pointercancel",endDrag);
 window.addEventListener("resize",refreshScrollNav,{passive:true});
}

function display(){
 const ids=getIds(),routes=ids.map(id=>db.routes[id]);
 $("compareEmpty").hidden=!!routes.length;$("compareContent").hidden=!routes.length;
 $("compareCount").textContent=routes.length?routes.length+" из 5 маршрутов":"0 маршрутов";
 if(!routes.length)return;
 const n=routes.length;
 let out='<table class="compareMatrix"><thead><tr><th scope="col" class="matrixCorner">Критерий</th>'+routes.map(r=>'<th scope="col" class="compareRouteHeading">'+photoCell(r)+'<div class="atlasEyebrow">'+esc(countryLabels[r.country]||r.country)+'</div><a class="matrixRouteTitle" href="'+hrLink(r)+'">'+esc(r.name)+'</a><div class="matrixHeadActions"><a href="'+hrLink(r)+'">Полная страница ↗</a><button type="button" data-remove-id="'+(r.id-1)+'" aria-label="Убрать из сравнения: '+esc(r.name)+'">✕ Убрать</button></div></th>').join("")+'</tr></thead><tbody>';
 out+=section("01 / Маршрут и впечатления",n);
 out+=row("✨ WOW / 10",routes,r=>'<strong class="matrixValue good">'+r.wow.toFixed(1)+'/10</strong>');
 out+=row("Пригодность 10 октября",routes,r=>'<span class="matrixStatus">'+statusLabels[r.status]+'</span>');
 out+=row("Район",routes,r=>esc(r.region));
 out+=row("Страна",routes,r=>esc(countryLabels[r.country]||r.country));
 out+=row("Что входит в маршрут",routes,components);
 out+=row("Почему сюда",routes,r=>'<span class="matrixProse">'+esc(r.guide?.why||r.desc)+'</span>');
 out+=row("💧 Озеро",routes,r=>r.components?.some(c=>c.kind==="lake")||r.hasLake?'<span class="matrixYes">✓ Да / рядом</span>':'<span class="matrixMuted">Не основной акцент</span>');
 out+=section("02 / Техника, доступ и время",n);
 out+=row("🧗 Сложность",routes,r=>'<strong class="matrixValue">'+esc(r.grade)+'</strong>');
 out+=row("⏱ Лазание (ориентир)",routes,r=>minutes(r));
 out+=row("Длина троса",routes,r=>r.lengthM?'<b>'+r.lengthM+' м</b>':'<span class="matrixMuted">Нет подтверждённых данных</span>');
 out+=row("🚗 Дорога из Праги",routes,drive);
 out+=row("Составной маршрут",routes,r=>r.components?.length>1||r.combo?"Да, несколько точек":"Одна линия / район");
 out+=row("Высокогорный фактор",routes,r=>r.highAlpine?'⚠️ Возможно обледенение на высоте':'Проверить местные условия');
 out+=row("Подход и логистика",routes,r=>textOrTopo(r,"approach"));
 out+=row("Хайк после ферраты",routes,r=>textOrTopo(r,"hike"));
 out+=row("Риски и ограничения",routes,r=>textOrTopo(r,"conditions"));
 out+=section("03 / Погода на выбранную дату",n);
 out+=row("🌦 Прогноз 10–17",routes,r=>'<div class="matrixWeather" id="cmpWX-'+r.id+'"><span class="matrixMuted">Загрузка…</span></div>');
 out+=row("Суточные осадки (старый прогноз 08.10)",routes,r=>r.mm==null?'Не было сопоставимого числа':r.mm.toFixed(1)+' мм · регионально');
 out+=row("Официальная проверка",routes,r=>r.country==="AT"?'<a class="matrixTextLink" href="https://www.alpenverein.de/bergwetter/alpen/" target="_blank" rel="noreferrer noopener">DAV / GeoSphere ↗</a>':r.country==="DE"?'<a class="matrixTextLink" href="https://www.dwd.de/DE/wetter/wetter_node.html" target="_blank" rel="noreferrer noopener">DWD ↗</a>':r.country==="SK"?'<a class="matrixTextLink" href="https://www.shmu.sk/" target="_blank" rel="noreferrer noopener">SHMÚ ↗</a>':'<a class="matrixTextLink" href="https://meteo.arso.gov.si/met/en/weather/" target="_blank" rel="noreferrer noopener">ARSO ↗</a>');
 out+=section("04 / Проверка источников",n);
 out+=row("🗺️ Топо и схема",routes,r=>'<a class="matrixTextLink" href="'+esc(source(r))+'" target="_blank" rel="noopener noreferrer">Открыть источник ↗</a>');
 out+=row("Изображения",routes,r=>'<a class="matrixTextLink" href="'+photoSearch(r.name)+'" target="_blank" rel="noopener noreferrer">Google Картинки ↗</a>');
 out+=row("Подробный гид",routes,r=>'<a class="matrixTextLink" href="'+hrLink(r)+'">Все детали и прогноз ↗</a>');
 out+='</tbody></table>';
 $("compareMatrix").innerHTML=out;
 renderMobile(routes);
 requestAnimationFrame(refreshScrollNav);
 document.querySelectorAll("[data-remove-id]").forEach(btn=>btn.addEventListener("click",()=>{const id=Number(btn.dataset.removeId);setIds(getIds().filter(x=>x!==id));display()}));
 refreshWeather();
}
async function refreshWeather(){
const ids=getIds(),routes=ids.map(id=>db.routes[id]);const day=$("compareDate").value||"2026-10-10";
await Promise.all(routes.map(async r=>{
const el=$("cmpWX-"+r.id);if(!el)return;
if(r.lat==null||r.lon==null){el.textContent="Нет уточнённых координат";const mobile=$("cmpMobileWX-"+r.id);if(mobile)mobile.textContent=el.textContent;return}
el.innerHTML='<span class="matrixMuted">Загружаю почасовую модель…</span>';const loadingMobile=$("cmpMobileWX-"+r.id);if(loadingMobile)loadingMobile.innerHTML=el.innerHTML;
const p=new URLSearchParams({latitude:r.lat,longitude:r.lon,hourly:"precipitation,precipitation_probability,cloud_cover,temperature_2m,wind_gusts_10m,snowfall",timezone:"Europe/Vienna",start_date:day,end_date:day});
try{
 const res=await fetch("https://api.open-meteo.com/v1/forecast?"+p);
 if(!res.ok)throw Error("HTTP "+res.status);
 const d=await res.json();if(!d.hourly?.time?.length)throw Error("За выбранный день данных нет");
 const t=d.hourly;
 const sel=t.time.map((v,i)=>({i,h:+v.slice(11,13)})).filter(x=>x.h>=10&&x.h<=16).map(x=>x.i);
 if(!sel.length)throw Error("Почасовых данных нет");
 const sum=sel.reduce((a,i)=>a+(Number(t.precipitation?.[i])||0),0);
 const pop=Math.max(...sel.map(i=>Number(t.precipitation_probability?.[i])||0));
 const cloud=Math.round(sel.reduce((a,i)=>a+(Number(t.cloud_cover?.[i])||0),0)/sel.length);
 const gust=Math.round(Math.max(...sel.map(i=>Number(t.wind_gusts_10m?.[i])||0)));
 const snow=sel.reduce((a,i)=>a+(Number(t.snowfall?.[i])||0),0);
 const temp=sel.map(i=>t.temperature_2m?.[i]).filter(x=>x!=null);
 const lo=temp.length?Math.round(Math.min(...temp))+"°":"—";
 const hi=temp.length?Math.round(Math.max(...temp))+"°":"—";
 el.innerHTML='<div class="cmpWeatherStrong">'+sum.toFixed(1)+' мм / 10–17</div><div>🌧 Макс. '+pop+'% · ☁️ '+cloud+'%</div><div>🌡 '+lo+'…'+hi+' · 💨 '+gust+' км/ч</div>'+(snow>0?'<div class="cmpWeatherAlert">❄ Снег '+snow.toFixed(1)+' см</div>':"")+'<small>Open-Meteo · прогноз района, не скалы</small>';const mobile=$("cmpMobileWX-"+r.id);if(mobile)mobile.innerHTML=el.innerHTML;
}catch(e){el.innerHTML='<span class="matrixMuted">Недоступно: '+esc(e.message)+'. См. официальный прогноз.</span>';const mobile=$("cmpMobileWX-"+r.id);if(mobile)mobile.innerHTML=el.innerHTML}
}));
}
const WEATHER_DATE_KEY="ferrataWOW_weather_date_v1";
try{const savedDate=localStorage.getItem(WEATHER_DATE_KEY);if(savedDate)$("compareDate").value=savedDate}catch(e){}
$("compareDate").addEventListener("change",()=>{try{localStorage.setItem(WEATHER_DATE_KEY,$("compareDate").value)}catch(e){}refreshWeather()});
$("refreshCompareWeather").addEventListener("click",refreshWeather);
$("clearComparison").addEventListener("click",()=>{if(!confirm("Удалить все маршруты из сравнения? Избранное останется."))return;setIds([]);display()});

function myBackup(){
 const safely=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch(e){return fallback}};
 return {app:"FerrataAtlas",version:1,createdAt:new Date().toISOString(),favourites:safely("ferrataWOW_favorites_v1",[]),comparison:safely(KEY,[]),filters:safely("ferrataWOW_filters_v2",{})};
}
const feedback=$("backupFeedback");
$("exportPersonalData").addEventListener("click",()=>{
 const data=JSON.stringify(myBackup(),null,2);
 const blob=new Blob([data],{type:"application/json;charset=utf-8"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="ferrata-atlas-my-selection.json";document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
 feedback.textContent="Файл с твоими настройками сохранён. Он остаётся на устройстве.";
});
$("importPersonalData").addEventListener("change",async event=>{
 const file=event.target.files?.[0];if(!file)return;
 try{
  if(file.size>250000)throw Error("Файл слишком большой");
  const data=JSON.parse(await file.text());
  if(data.app!=="FerrataAtlas"||data.version!==1)throw Error("Это не файл Ferrata Atlas");
  const unique=(arr,min,max)=>[...new Set((Array.isArray(arr)?arr:[]).filter(x=>Number.isInteger(x)&&x>=min&&x<=max))];
  const favourites=unique(data.favourites,1,db.routes.length);
  const comparison=unique(data.comparison,0,db.routes.length-1).slice(0,5);
  localStorage.setItem("ferrataWOW_favorites_v1",JSON.stringify(favourites));
  localStorage.setItem(KEY,JSON.stringify(comparison));
  if(data.filters&&typeof data.filters==="object"&&!Array.isArray(data.filters)){
   const approved=["st","countries","minWow","maxRain","maxDrive","grade","lake","combos","shortDay","onlyKnown","climbMax","lengthMax","onlyFavorites","sort","weatherWeight","wowWeight","driveWeight"];
   const cleaned={};
   for(const key of approved)if(Object.prototype.hasOwnProperty.call(data.filters,key))cleaned[key]=data.filters[key];
   localStorage.setItem("ferrataWOW_filters_v2",JSON.stringify(cleaned));
  }
  feedback.textContent="✓ Загружено: "+favourites.length+" избранных, "+comparison.length+" для сравнения.";
  window.dispatchEvent(new Event("atlas:changed"));
  display();
 }catch(err){feedback.textContent="Не получилось импортировать: "+err.message}
 event.target.value="";
});
display();
window.addEventListener("storage",e=>{if(e.key===KEY)display()});
})();
