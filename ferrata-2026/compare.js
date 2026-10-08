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
const photoSearch=name=>"https://www.google.com/search?tbm=isch&q="+encodeURIComponent(name+" Klettersteig Fotos");
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
 if(r.components?.length)return '<div class="compareParts">'+r.components.map(c=>'<a target="_blank" rel="noopener noreferrer" href="'+photoSearch(c.name)+'">'+(c.kind==="lake"?"💧":c.kind==="ferrata"?"🧗":"🥾")+' '+esc(c.name)+' ↗</a>').join("")+'</div>';
 return '<a class="matrixTextLink" target="_blank" rel="noopener noreferrer" href="'+photoSearch(r.name)+'">Фотографии именно этой линии ↗</a>';
}
function textOrTopo(r,key){return r.guide?.[key]?'<span class="matrixProse">'+esc(r.guide[key])+'</span>':'<span class="matrixMuted">Подробности подхода и спуска — в оригинальном топо. Не указаны без проверки.</span>'}
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
 document.querySelectorAll("[data-remove-id]").forEach(btn=>btn.addEventListener("click",()=>{const id=Number(btn.dataset.removeId);setIds(getIds().filter(x=>x!==id));display()}));
 refreshWeather();
}
async function refreshWeather(){
const ids=getIds(),routes=ids.map(id=>db.routes[id]);const day=$("compareDate").value||"2026-10-10";
await Promise.all(routes.map(async r=>{
const el=$("cmpWX-"+r.id);if(!el)return;
if(r.lat==null||r.lon==null){el.textContent="Нет уточнённых координат";return}
el.innerHTML='<span class="matrixMuted">Загружаю почасовую модель…</span>';
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
 el.innerHTML='<div class="cmpWeatherStrong">'+sum.toFixed(1)+' мм / 10–17</div><div>🌧 Макс. '+pop+'% · ☁️ '+cloud+'%</div><div>🌡 '+lo+'…'+hi+' · 💨 '+gust+' км/ч</div>'+(snow>0?'<div class="cmpWeatherAlert">❄ Снег '+snow.toFixed(1)+' см</div>':"")+'<small>Open-Meteo · прогноз района, не скалы</small>';
}catch(e){el.innerHTML='<span class="matrixMuted">Недоступно: '+esc(e.message)+'. См. официальный прогноз.</span>'}
}));
}
$("compareDate").addEventListener("change",refreshWeather);
$("refreshCompareWeather").addEventListener("click",refreshWeather);
$("clearComparison").addEventListener("click",()=>{if(!confirm("Удалить все маршруты из сравнения? Избранное останется."))return;setIds([]);display()});
display();
window.addEventListener("storage",e=>{if(e.key===KEY)display()});
})();