(()=>{"use strict";
const targetDate="2026-10-10";
const orig=[...document.querySelectorAll("#cards>.card")],list=document.querySelector("#cards");
const STATE_KEY="ferrataWOW_filters_v2", COMP_KEY="ferrataWOW_compare_v2";
const $=id=>document.getElementById(id);
const q=(sel,base=document)=>base.querySelector(sel);
const num=v=>Number(v);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const rules=[
[/riegersburg/i,47.005,15.93,"Riegersburg"],
[/hochlantsch/i,47.366,15.405,"Hochlantsch"],
[/hohe wand/i,47.824,16.062,"Hohe Wand"],
[/mödling/i,48.087,16.286,"Mödling"],
[/poppenberg/i,47.702,14.162,"Hinterstoder"],
[/beisteinmauer/i,47.9,14.47,"Beisteinmauer"],
[/hochkar/i,47.724,14.922,"Hochkar"],
[/rax/i,47.716,15.753,"Rax"],
[/geo-steig|alpinpark.*johnsbach|spielmäuer/i,47.545,14.59,"Gesäuse"],
[/stoderzinken/i,47.46,13.813,"Stoderzinken"],
[/loser/i,47.665,13.78,"Altaussee / Loser"],
[/laser|gosausee|schmied/i,47.534,13.496,"Gosau / Gosausee"],
[/katrin/i,47.699,13.607,"Bad Ischl / Katrin"],
[/kampenwand/i,47.749,12.361,"Kampenwand"],
[/jenner|grünstein/i,47.57,13.024,"Königssee / Jenner"],
[/dve veže/i,48.94,19.18,"Liptovské Revúce"],
[/häntzschel/i,50.934,14.28,"Sächsische Schweiz"],
[/skalka/i,48.73,18.98,"Kremnica / Skalka"],
[/gebirgsvereinssteig/i,47.825,16.06,"Hohe Wand"],
[/grete-klinger/i,47.52,14.976,"Eisenerzer Alpen"],
[/wildfrauen|bosruck/i,47.652,14.324,"Bosruck"],
[/teufelsteig|tieflimauer/i,47.55,14.69,"Gesäuse"],
[/innsbrucker|nordkette/i,47.31,11.388,"Nordkette"],
[/donnerkogel/i,47.528,13.504,"Gosau / Donnerkogel"],
[/mittenwalder/i,47.43,11.264,"Karwendel"],
[/traunstein|traunsee/i,47.87,13.825,"Traunstein / Traunsee"],
[/drachenwand/i,47.814,13.367,"Mondsee"],
[/alberfeldkogel|feuerkogel/i,47.815,13.762,"Feuerkogel"],
[/postalm/i,47.667,13.43,"Salzkammergut"],
[/rofan/i,47.46,11.755,"Achensee / Rofan"],
[/tegelberg/i,47.556,10.781,"Tegelberg"],
[/friedberger/i,47.5,10.606,"Tannheimer Tal"],
[/mooserboden|kaprun|mobo/i,47.174,12.697,"Kaprun / Mooserboden"],
[/mojstrana/i,46.459,13.936,"Mojstrana"],
[/kaiser-franz|eisenerzer|pfaffenstein/i,47.546,14.89,"Eisenerz"],
[/seewand/i,47.566,13.638,"Hallstatt"],
[/krippenstein/i,47.53,13.694,"Krippenstein"],
[/alpspitz/i,47.429,11.052,"Alpspitze"],
[/pidinger/i,47.743,12.924,"Piding"],
[/marokka|himmel.*henne|wildseeloder|fieberbrunn/i,47.450,12.538,"Fieberbrunn / Wildseeloder"],
[/falkert/i,46.858,13.807,"Falkertsee / Falkertspitz"],
[/steinplatte|schuastagangl/i,47.614,12.565,"Steinplatte / Waidring"],
[/königsjodler/i,47.422,13.057,"Hochkönig"]];
const country=t=>/dve veže|skalka pri|liptov|кремниц/i.test(t)?"SK":/mojstrana|словени/i.test(t)?"SI":/jenner|grünstein|häntzschel|kampenwand|tegelberg|mittenwalder|friedberger|pidinger|alpspitz/i.test(t)?"DE":"AT";
const officialInfo={AT:["GeoSphere Austria — официальный прогноз","https://portale.geosphere.at/hpAT/index.php?gl=DE","DAV / GeoSphere — горный прогноз","https://www.alpenverein.de/bergwetter/alpen/"],DE:["DWD — официальный прогноз","https://www.dwd.de/DE/wetter/wetter_node.html","DAV — горный прогноз","https://www.alpenverein.de/bergwetter/"],SK:["SHMÚ — официальный прогноз","https://w5.shmu.sk/en/?id=meteo_gpredpoved_sk&page=1","SHMÚ — метеограммы","https://w5.shmu.sk/en/?id=meteo_num_mgram10&page=1"],SI:["ARSO — официальный прогноз","https://meteo.arso.gov.si/met/en/weather/","ARSO — прогноз по Словении","https://meteo.arso.gov.si/uploads/probase/www/fproduct/text/en/fcast_SLOVENIA_latest.html"]};
function driveOf(c){let tx=q(".meta",c)?.textContent||"",m=tx.match(/🚗\s*[≈~]?\s*(\d+):(\d+)/);return m?+(Number(m[1])+Number(m[2])/60).toFixed(2):null}
function difficulty(c){let t=(q(".meta",c)?.textContent||"").toLowerCase();if(/d\/e|bis e|до e|до e\b|\se\b|d продолж|d, длин|d, много|d, многочис|d, силовой|d, труд|силовой|сложность d/.test(t))return 4;if(/(?:d\b|c\/d)/.test(t))return 3;if(/\bc\b/.test(t))return 2;return 1;}
function hasLake(name){return /see|озер|pleso|weiher|mara|kaprun|mobo|mooserboden|katrin|loser|traunstein|drachenwand|alberfeld|schieder|gosau|jenner|tegelberg|rofan|friedberger|feuerkogel|donnerkogel/.test(name.toLowerCase())}
function isLong(c){const text=(q(".meta",c)?.textContent||"").toLowerCase();return /(?:6[\u2013-]9 ч|7[\u2013-]8 ч|8[\u2013-]10 ч|8 ч|8[\u2013-]9 ч|5[\u2013-]7 ч|6[\u2013-]8 ч|полный день|6:30[\u2013-]9 ч|~8 ч день)/.test(text)}
const items=orig.map((el,i)=>{const name=q("h2",el).textContent.trim(),a=rules.find(([re])=>re.test(name)),record=window.FERRATA_DB?.routes?.[i],c=record?.country||country(name),tag=record?(record.combo?"combo":"single"):(name.includes(" + ")||name.includes(" +")||name.includes("+ ")||/combo|комбо/i.test(name))?"combo":"single";el.dataset.country=c;el.dataset.drive=record?.driveHours??driveOf(el)??999;el.dataset.lake=(record?.hasLake??hasLake(name))?"1":"0";el.dataset.kind=tag;el.dataset.difficulty=el.dataset.difficulty||difficulty(el);el.dataset.longDay=el.dataset.longDay||(isLong(el)?"1":"0");el.dataset.orig=i;return {id:i,el,name,country:c,lat:record?.lat??a?.[1]??47.55,lon:record?.lon??a?.[2]??14.4,location:record?.region||a?.[3]||name,kind:tag};});
let compare=new Set(JSON.parse(localStorage.getItem(COMP_KEY)||"[]").map(Number).filter(n=>Number.isInteger(n)));
const controls={statuses:[...document.querySelectorAll('input[name="showStatus"]')],countries:[...document.querySelectorAll('input[name="showCountry"]')]};
function selected(nodes){return nodes.filter(i=>i.checked).map(i=>i.value)}
function defaults(){return{st:["green","yellow","orange"],countries:["AT","DE","SK","SI"],minWow:7,maxRain:10,maxDrive:6.5,grade:3,lake:false,combos:false,shortDay:false,onlyKnown:false,climbMax:"all",lengthMax:"all",onlyFavorites:false,sort:"balanced",weatherWeight:55,wowWeight:35,driveWeight:10}}
const importanceWeight=value=>({low:1,medium:3,high:6}[value]||3);
const importanceLabel=value=>({low:"Низкая",medium:"Средняя",high:"Высокая"}[value]||"Средняя");
const weightLevel=value=>value>=48?"high":value>=17?"medium":"low";
function state(){return{st:selected(controls.statuses),countries:selected(controls.countries),minWow:+$("minWow").value,maxRain:+$("maxRain").value,maxDrive:+$("maxDrive").value,grade:+$("maxDifficulty").value,lake:$("onlyLakes").checked,combos:$("onlyCombos").checked,shortDay:$("onlyShortDay").checked,onlyKnown:false,climbMax:$("climbMax").value,lengthMax:$("lengthMax").value,onlyFavorites:$("onlyFavorites").checked,sort:$("sortOrder").value,weatherImportance:$("weatherImportance").value,wowImportance:$("wowImportance").value,driveImportance:$("driveImportance").value,weatherWeight:importanceWeight($("weatherImportance").value),wowWeight:importanceWeight($("wowImportance").value),driveWeight:importanceWeight($("driveImportance").value)}}
function setState(s){for(let i of controls.statuses)i.checked=s.st?.includes(i.value)??false;for(let i of controls.countries)i.checked=s.countries?.includes(i.value)??false;for(let [id,key] of Object.entries({minWow:"minWow",maxRain:"maxRain",maxDrive:"maxDrive",maxDifficulty:"grade",sortOrder:"sort",climbMax:"climbMax",lengthMax:"lengthMax"})) if(s[key]!=null)$(id).value=s[key];for(let [id,key] of Object.entries({onlyLakes:"lake",onlyCombos:"combos",onlyShortDay:"shortDay",onlyFavorites:"onlyFavorites"}))$(id).checked=!!s[key];
for(const key of ["weather","wow","drive"]){
 const field=$(key+"Importance");
 if(field) field.value=s[key+"Importance"]||weightLevel(Number(s[key+"Weight"]??(key==="weather"?55:key==="wow"?35:10)));
}}
let initial=defaults();try{let v=JSON.parse(localStorage.getItem(STATE_KEY)||"null");if(v&&typeof v==="object")initial={...initial,...v}}catch(e){}
setState(initial);
const fixedRisk={green:94,yellow:68,orange:42,red:10,closed:0};
const rainOf=it=>{const live=window.FERRATA_LIVE;return live?.active?(live.metrics?.[it.id]?.mm??999):Number(it.el.dataset.mm)};
function scoreOf(it,s){let el=it.el,mm=rainOf(it),p=mm>=900?20:clamp(100-13*mm,0,100),status=fixedRisk[el.dataset.status]??30,weather=0.60*status+0.40*p,wow=Number(el.dataset.wow)*10,dr=Number(el.dataset.drive),road=Number.isFinite(dr)&&dr<50?clamp(112-14*dr,0,100):20;let weight=s.weatherWeight+s.wowWeight+s.driveWeight||1;let score=(s.weatherWeight*weather+s.wowWeight*wow+s.driveWeight*road)/weight;if(el.dataset.status==="closed")score=0; else if(el.dataset.status==="red")score=Math.min(score,34);return Math.round(score)}
function filtered(s){return items.filter(it=>{let e=it.el,mm=rainOf(it),d=+e.dataset.drive;return s.st.includes(e.dataset.status)&&s.countries.includes(it.country)&&Number(e.dataset.wow)>=s.minWow&&(window.FERRATA_LIVE?.active?(mm!==999&&mm<=s.maxRain):(mm===999?!s.onlyKnown:mm<=s.maxRain))&&(d===999? s.maxDrive>=6.5:d<=s.maxDrive)&&Number(e.dataset.difficulty)<=s.grade&&(!s.lake||e.dataset.lake==="1")&&(!s.combos||it.kind==="combo")&&(!s.shortDay||e.dataset.longDay==="0")&&filterLength(it,s);})}
function filterLength(it,s){
const r=window.FERRATA_DB?.routes?.[it.id];
if(!r)return s.climbMax==="all"&&s.lengthMax==="all";
if(s.onlyFavorites){let favs=[];try{favs=JSON.parse(localStorage.getItem("ferrataWOW_favorites_v1")||"[]")}catch(e){}if(!favs.includes(r.id))return false}
if(s.climbMax==="unknown"&&r.climbMax!=null)return false;
if(s.climbMax!=="all"&&s.climbMax!=="unknown"&&(r.climbMax==null||!Number.isFinite(r.climbMax)))return false;
if(s.climbMax==="long"&&(r.climbMin==null||r.climbMin<180))return false;
if(!["all","unknown","long"].includes(s.climbMax)&&r.climbMax>Number(s.climbMax))return false;
if(s.lengthMax==="unknown")return r.lengthM==null;
if(s.lengthMax!=="all"&&(r.lengthM==null||r.lengthM>Number(s.lengthMax)))return false;
return true
}
function sortItems(rows,s){const numeric=it=>rainOf(it);return rows.sort((a,b)=>{if(s.sort==="rain")return numeric(a)-numeric(b)||scoreOf(b,s)-scoreOf(a,s);if(s.sort==="wow")return +b.el.dataset.wow- +a.el.dataset.wow||numeric(a)-numeric(b);if(s.sort==="drive")return (+a.el.dataset.drive)-(+b.el.dataset.drive)||numeric(a)-numeric(b);if(s.sort==="safety")return (fixedRisk[b.el.dataset.status]??0)-(fixedRisk[a.el.dataset.status]??0)||numeric(a)-numeric(b);return scoreOf(b,s)-scoreOf(a,s)||numeric(a)-numeric(b)})}
function redraw(){const s=state();localStorage.setItem(STATE_KEY,JSON.stringify(s));$("valWow").textContent=s.minWow.toFixed(1)+"/10";$("valRain").textContent=s.maxRain.toFixed(1)+" мм";$("valDrive").textContent=s.maxDrive.toFixed(1)+" ч";const visible=sortItems(filtered(s),s);items.forEach(it=>it.el.hidden=true);for(const it of visible){it.el.hidden=false;it.el.style.display="";list.appendChild(it.el);let b=q(".scoreBadge",it.el);if(b)b.textContent="Рейтинг "+scoreOf(it,s)+"/100"}for(const it of items)if(!visible.includes(it))it.el.style.display="none";$("finderCount").textContent=visible.length+" из "+items.length+" вариантов";$("finderSummary").textContent="Твои приоритеты: погода — "+importanceLabel(s.weatherImportance).toLowerCase()+" · виды — "+importanceLabel(s.wowImportance).toLowerCase()+" · дорога — "+importanceLabel(s.driveImportance).toLowerCase();if(!visible.length)$("finderHint").textContent="Ничего не найдено: попробуй повысить лимит дождя, дороги или добавить статусы.";else $("finderHint").textContent=window.FERRATA_LIVE?.active?"Осадки обновлены по Open-Meteo. Статусы и открытость трасс этим НЕ подтверждены.":"⚠️ Осадки в фильтре — снимок от 08.10. Обнови модель в блоке выше перед выбором маршрута.";observePhotoRows();}
for(let el of [...document.querySelectorAll("#routeFinder input, #routeFinder select")])
el.addEventListener(el.type==="range"?"input":"change",()=>{
  // As soon as a user tweaks a preset, it becomes a custom configuration.
  document.querySelectorAll("[data-preset].isActive").forEach(button=>button.classList.remove("isActive"));
  redraw();
});
function preset(name){let s=defaults();if(name==="dry"){s.minWow=7;s.maxRain=2;s.weatherImportance="high";s.wowImportance="medium";s.driveImportance="low";s.sort="rain";s.st=["green","yellow"]}if(name==="wow"){s.minWow=9;s.maxRain=10;s.weatherImportance="medium";s.wowImportance="high";s.driveImportance="low";s.sort="wow"}if(name==="lake"){s.lake=true;s.minWow=8;s.weatherImportance="medium";s.wowImportance="high";s.driveImportance="low"}if(name==="near"){s.maxDrive=5;s.minWow=7;s.weatherImportance="medium";s.wowImportance="medium";s.driveImportance="medium"}if(name==="combo"){s.combos=true;s.grade=3;s.maxRain=9;s.maxDrive=6.5}s.st=s.st.filter(st=>st!=="closed"&&st!=="red");setState(s);redraw();}
document.querySelectorAll("[data-preset]").forEach(btn=>btn.addEventListener("click",()=>{preset(btn.dataset.preset);document.querySelectorAll("[data-preset]").forEach(b=>b.classList.toggle("isActive",b===btn))}));
$("resetFilters").addEventListener("click",()=>{setState(defaults());document.querySelectorAll("[data-preset]").forEach(b=>b.classList.remove("isActive"));redraw()});
$("openCompare").addEventListener("click",()=>showCompare());
$("closeCompare").addEventListener("click",()=>{$("compareModal").hidden=true});
$("compareModal").addEventListener("click",e=>{if(e.target.id==="compareModal")e.currentTarget.hidden=true});
function safe(t){return String(t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function showCompare(){const box=$("compareList");const arr=items.filter(it=>compare.has(it.id));if(!arr.length)box.innerHTML="<p>Отметь 2–5 понравившихся вариантов кнопкой «В сравнение» в карточке.</p>";else{const s=state();box.innerHTML='<div class="compScroll"><table class="compTable"><thead><tr><th>Маршрут</th><th>Сложность / время</th><th>Дорога</th><th>Суббота*</th><th>WOW</th><th>Рейтинг</th></tr></thead><tbody>'+arr.map(it=>'<tr><td>'+safe(it.name)+'</td><td>'+safe(q(".meta",it.el).textContent.split("🧗")[1]?.split("⏱")[0]||"—")+'</td><td>'+(it.el.dataset.drive==="999"?"—":(+it.el.dataset.drive).toFixed(1)+" ч")+'</td><td>'+(it.el.dataset.mm==="999"?"нет данных":it.el.dataset.mm+" мм")+'</td><td>'+it.el.dataset.wow+'</td><td>'+scoreOf(it,s)+'</td></tr>').join("")+'</tbody></table></div><p class="wxNote">* Старый региональный ориентир 08.10, смотри обновление внутри карточки. Баллы — не оценка безопасности.</p>'} $("compareModal").hidden=false}
function updateCompareCount(){$("openCompare").textContent="⚖️ Сравнение ("+compare.size+")"}
function toggleCompare(it){if(compare.has(it.id))compare.delete(it.id);else if(compare.size<5)compare.add(it.id);else {alert("Можно сравнить максимум 5 маршрутов. Убери один из уже выбранных.");return}localStorage.setItem(COMP_KEY,JSON.stringify([...compare]));let b=q(".compareAdd",it.el);b.dataset.active=compare.has(it.id)?"1":"0";b.textContent=compare.has(it.id)?"✓ В сравнении":"＋ Сравнить";updateCompareCount();}
function official(it){return officialInfo[it.country]||officialInfo.AT}
function mapsURL(it){return "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(it.location+" "+(it.country==="AT"?"Österreich":it.country==="DE"?"Deutschland":it.country==="SK"?"Slovakia":"Slovenia"))}
function openMeteoURL(it){return "https://api.open-meteo.com/v1/forecast?latitude="+it.lat+"&longitude="+it.lon+"&hourly=precipitation,precipitation_probability,cloud_cover,snowfall,temperature_2m&timezone=Europe%2FVienna&start_date="+targetDate+"&end_date="+targetDate}
async function loadWeather(it,btn){const node=q(".wxResults",it.el);btn.disabled=true;btn.textContent="⏳ Загружаю почасовой прогноз…";try{const rs=await fetch(openMeteoURL(it),{cache:"no-store"});if(!rs.ok)throw Error("HTTP "+rs.status);const d=await rs.json();if(d.error||!d.hourly?.time?.length)throw Error(d.reason||"нет почасовых данных");const h=d.hourly,windows=[[9,11],[12,14],[15,17],[18,20]],format=([start,end])=>{const ar=h.time.map((v,i)=>({v,i})).filter(o=>{let hour=+o.v.slice(11,13);return hour>=start&&hour<=end});if(!ar.length)return null;const ids=ar.map(v=>v.i);const mm=ids.reduce((a,i)=>a+(+h.precipitation?.[i]||0),0);const pops=ids.map(i=>h.precipitation_probability?.[i]).filter(v=>v!=null);const clouds=ids.map(i=>h.cloud_cover?.[i]).filter(v=>v!=null);const temps=ids.map(i=>h.temperature_2m?.[i]).filter(v=>v!=null);const snow=ids.reduce((a,i)=>a+(+h.snowfall?.[i]||0),0);return '<div class="wxHour"><span>'+start+':00–'+(end+1)+':00</span><b>'+mm.toFixed(1)+' мм</b><span>дождь: '+(pops.length?Math.max(...pops)+"%":"—")+'</span><span>облака: '+(clouds.length?Math.round(clouds.reduce((a,b)=>a+b,0)/clouds.length)+"%":"—")+'</span><span>t: '+(temps.length?Math.round(temps.reduce((a,b)=>a+b,0)/temps.length)+"°":"—")+'</span>'+(snow>0?'<span>❄️ снег '+snow.toFixed(1)+' см</span>':"")+'</div>'};node.innerHTML='<p><strong>Почасово на 10 октября — '+safe(it.location)+'</strong></p><div class="wxGrid">'+windows.map(format).filter(Boolean).join("")+'</div><p class="wxNote">Источник чисел: Open-Meteo, НЕ официальный прогноз. Вероятность дождя — максимум внутри интервала, а мм — сумма. Координаты ориентировочные, без учёта локальной экспозиции стены. Высокогорный снег, мокрая скала и закрытия проверяются отдельно. Модельная погода обновляется при открытии, если дата ещё входит в доступный прогноз.</p>';btn.textContent="↻ Обновить";btn.disabled=false}catch(e){node.innerHTML='<p class="wxNote">Почасовой прогноз не загрузился ('+safe(e.message)+'). Используй ссылку на официальный прогноз ниже.</p>';btn.textContent="↻ Повторить";btn.disabled=false}}
function enhance(it){const e=it.el,[source,url,secondary,secondaryURL]=official(it),name=it.name;const b=document.createElement("div");b.className="cardTools";b.innerHTML='<span class="scoreBadge"></span><button type="button" class="compareAdd" data-active="'+(compare.has(it.id)?"1":"0")+'">'+(compare.has(it.id)?"✓ В сравнении":"＋ Сравнить")+'</button><a class="cardMap" href="'+mapsURL(it)+'" target="_blank" rel="noreferrer" style="text-decoration:none">📍 Карта</a>'+(it.kind==="combo"?'<span class="badge" style="background:#335577">⇄ Комбинация</span>':"");
q("h2",e).insertAdjacentElement("afterend",b);q(".compareAdd",e).addEventListener("click",()=>toggleCompare(it));let wx=document.createElement("details");wx.className="wx-details";wx.innerHTML='<summary>🌤 Погода: '+safe(it.location)+' · официальный источник</summary><p>Суточные осадки в карточке — зафиксированный региональный прогноз на 08.10, а не проверка сухости скалы. Для текущего прогноза на 10.10 открой почасовые значения и сравни с официальным источником.</p><button type="button" class="weatherOpen">🌦 Показать погоду 09:00–21:00</button><div class="wxResults"></div><div><a class="wx-official" target="_blank" rel="noreferrer" href="'+url+'">🏛 '+safe(source)+' ↗</a><a class="wx-official" target="_blank" rel="noreferrer" href="'+secondaryURL+'">⛰ '+safe(secondary)+' ↗</a></div>';q(".actions",e).before(wx);q(".weatherOpen",wx).addEventListener("click",ev=>loadWeather(it,ev.currentTarget));}
items.forEach(enhance);updateCompareCount();

/* Accurate image policy:
   Never substitute photographs of nearby mountains for the named via ferrata.
   Direct images already curated in page stay visible; cards without directly
   attributed photos present Google Images as an explicit external search.
   We intentionally do not scrape or frame Google image results. */
function observePhotoRows(){
 for(const it of items){
  const gallery=q(".gallery",it.el);
  if(!gallery||gallery.dataset.photoReady==="1")continue;
  gallery.dataset.photoReady="1";
  const placeholder=q(".empty",gallery);
  const google=q('.actions a[href*="google.com/search"]',it.el);
  const googleUrl=google?.href||"https://www.google.com/search?tbm=isch&q="+encodeURIComponent(it.name+" Klettersteig Fotos");
  if(placeholder){
   gallery.classList.add("photoFallback");
   placeholder.innerHTML=
    '<div class="missingPhoto"><div class="missingIcon" aria-hidden="true">📷</div>'+
    '<strong>Фото маршрута</strong>'+
    '<span>Для этого маршрута пока нет подтверждённых изображений непосредственно в каталоге.</span>'+
    '<a href="'+googleUrl+'" class="photoSearch" target="_blank" rel="noopener noreferrer">🖼 Посмотреть фотографии в Google ↗</a>'+
    '</div>';
  } else {
    gallery.querySelectorAll("a img").forEach(img=>{
      img.addEventListener("error",()=>{
        const link=img.closest("a");if(link)link.style.display="none";
        const good=[...gallery.querySelectorAll("img")].some(x=>x.complete&&x.naturalWidth>0&&x.closest("a")?.style.display!=="none");
        const failing=[...gallery.querySelectorAll("img")].some(x=>!x.complete);
        if(!good&&!failing&&!q(".empty",gallery)){
           gallery.innerHTML='<div class="empty"><div class="missingPhoto"><strong>Фото не загрузились</strong><a href="'+googleUrl+'" target="_blank" rel="noopener noreferrer" class="photoSearch">🖼 Посмотреть точные фотографии в Google ↗</a></div></div>';
        }
      },{once:true})
    })
  }
 }
}
function googleImagesLinks(){for(const it of items){let a=q('.actions a[href*="google.com/search"]',it.el);if(a){a.title="Открыть Google Картинки с точным названием маршрута: снимки не встраиваются и не подменяются похожими местами.";a.textContent="🖼 Google: реальные фото маршрута ↗"}}}
googleImagesLinks();
// Another tab or the detailed guide can update this user's comparison list.
window.addEventListener("storage",event=>{
 if(event.key!==COMP_KEY)return;
 try{
  let ids=JSON.parse(localStorage.getItem(COMP_KEY)||"[]");
  if(!Array.isArray(ids))ids=[];
  compare.clear();for(const id of ids){if(Number.isInteger(id)&&id>=0&&id<items.length)compare.add(id)}
  for(const it of items){
   const b=q(".compareAdd",it.el);if(!b)continue;
   const active=compare.has(it.id);
   b.dataset.active=active?"1":"0";b.textContent=active?"✓ В сравнении":"＋ Сравнить";
  }
  updateCompareCount();
 }catch(e){}
});
const mapPoints=[
["Laserer Alpin · Gosausee",47.5338,13.4959,"https://www.google.com/maps/search/?api=1&query=Gosausee+Parkplatz"],
["Schmiedsteig · Gosau",47.5510,13.5164,"https://www.google.com/maps/search/?api=1&query=Parkplatz+Gosauschmied"],
["Alberfeldkogel · Feuerkogelbahn",47.81298,13.75846,"https://www.google.com/maps/search/?api=1&query=Feuerkogelbahn+Talstation"],
["Katrin · Talstation",47.69833,13.6075,"https://www.google.com/maps/search/?api=1&query=Katrin+Seilbahn+Bad+Ischl"],
["Loser · Altaussee",47.659,13.779,"https://www.google.com/maps/search/?api=1&query=Loser+Panoramabahn+Altaussee"]];
let mapBuilt=false;
const mapToggle=$("toggleMap");
if(mapToggle)mapToggle.addEventListener("click",async()=>{$("mapPanel").hidden=!$("mapPanel").hidden;if($("mapPanel").hidden)return;if(mapBuilt)return;try{if(!window.L){await new Promise((resolve,reject)=>{let css=document.createElement("link");css.rel="stylesheet";css.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";document.head.append(css);let scr=document.createElement("script");scr.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";scr.onload=resolve;scr.onerror=reject;document.body.append(scr)})}const mp=L.map("explorerMap").setView([47.65,13.59],9);L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:18,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'}).addTo(mp);const pts=[];for(const [name,lat,lon,link] of mapPoints){pts.push([lat,lon]);L.marker([lat,lon]).addTo(mp).bindPopup('<strong>'+safe(name)+'</strong><br><a target="_blank" rel="noreferrer" href="'+link+'">Открыть навигацию ↗</a>')}mp.fitBounds(pts,{padding:[20,20]});mapBuilt=true;setTimeout(()=>mp.invalidateSize(),200)}catch(e){$("explorerMap").textContent="Карта сейчас недоступна. Используй ссылки на Google Maps под ней."}});
window.FERRATA_REDRAW=redraw;
redraw();
})();
