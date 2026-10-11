(()=>{
"use strict";
const DB=window.ATLAS_HIKES;if(!DB||!Array.isArray(DB.routes))return;
const routes=DB.routes,$=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const fmtCost=x=>x==null?"Уточнить":Number(x).toLocaleString("cs-CZ");
const fareText=r=>r.fareMin==null||r.fareMax==null?"Уточнить билеты":fmtCost(r.fareMin)+"–"+fmtCost(r.fareMax)+" Kč";
const sourceLabel=r=>r.sourceLevel==="regional"?"Обзор региона ↗":r.sourceLevel==="community"?"Сторонний маршрут ↗":"Описание маршрута ↗";
const savedKey="atlas-hiking-favorites";let saved=new Set();try{saved=new Set(JSON.parse(localStorage.getItem(savedKey)||"[]"))}catch(e){};
const commons={
 rozsutec:["Rozsutec.jpg","AvantaR · CC BY-SA 3.0"],
 krivan:["Malá Fatra, Veľký Kriváň z Malého Kriváňa (2).jpg","Palickap · CC BY-SA 4.0"],
 jetrich:["Pohled Mariina skála.jpg","Wikimedia Commons"],
 "gosausee-zwei-seen":["Gosausee mit Dachstein.jpg","Karl Posch · CC BY-SA"],
 bilaopava:["Bílá Opava vodopád.jpg","Miramella · CC BY-SA"],
 labski:["Pančavský vodopád (01).jpg","ŠJů · Wikimedia Commons"],
 snezne:["Śnieżne Kotły (06).jpg","ŠJů · Wikimedia Commons"],
 poland:["Sniezne Kotly 01.jpg","Jojo · Public domain"],
 hockstein:["Bastei bridge in Saxony.jpg","Fabiquertz · Wikimedia Commons"],
 rauenstein:["Bastei bridge.jpg","Sgroey · Wikimedia Commons"],
 schramm:["Schrammsteine LC0185.jpg","Wikimedia Commons"],
 panorama:["Schrammsteine in der Sächsischen Schweiz (01).jpg","Bernd Gross · Wikimedia Commons"],
 hrubosk:["Hruboskalsko.jpg","Viktor.3333 · CC BY-SA 4.0"],
 trosky:["Hruboskalsko Český ráj 1.jpg","Wikimedia Commons"],
 sumavalakes:["Černé jezero (8).jpg","Huhulenik · Wikimedia Commons"],
 plesne:["Plešné jezero.jpg","Prochaine · Public domain"],
 mumlava:["Mumlavský vodopád 1.JPG","Wikimedia Commons"]
};
const typeName={panorama:"Горные панорамы",rocks:"Скалы и ущелья",lake:"Озёра и водопады",extreme:"Сложный альпийский рельеф",tatra:"Высокие Татры","3000":"3000+ · без ледника летом",glacier:"Альпинизм · нужен гид"};
const flags={CZ:"🇨🇿",DE:"🇩🇪",PL:"🇵🇱",SK:"🇸🇰",AT:"🇦🇹",IT:"🇮🇹",SI:"🇸🇮"};
function photoURL(filename){return "https://commons.wikimedia.org/wiki/Special:FilePath/"+encodeURIComponent(filename)+"?width=1000"}
function photoPage(filename){return "https://commons.wikimedia.org/wiki/File:"+encodeURIComponent(filename).replaceAll("%20","_")}
function transitLink(r){return "https://www.google.com/maps/dir/?api=1&origin="+encodeURIComponent("Praha, Czechia")+"&destination="+encodeURIComponent(r.gateway+", "+({CZ:"Czechia",DE:"Germany",PL:"Poland",SK:"Slovakia",AT:"Austria",IT:"Italy",SI:"Slovenia"}[r.country]))+"&travelmode=transit"}
function areaMap(r){return "https://mapy.com/turisticka?x="+r.lon+"&y="+r.lat+"&z=12"}
function isUncertain(r){return ["guide","alpine","closedHut","summerOnly","tatra"].includes(r.risk)||r.id==="jetrich"}
function routeClass(r){if(r.risk==="guide")return "guide";if(r.type==="3000"||["alpine","closedHut"].includes(r.risk)||r.type==="tatra"&&/T4|цепи|скал/i.test(r.level||"")||/лестниц|техническ/i.test(r.level||""))return "alpine";return "hike"}
function collectionOf(r){if(r.risk==="guide"||r.type==="glacier")return "alpinism";if(r.type==="3000"||(r.altitude||0)>=3000)return "high";return "hiking"}
const collectionLabel={hiking:"Hiking",high:"3000+ без гида летом",alpinism:"Альпинизм / гид"};
function travelHours(r){if(Number.isFinite(r.travelHours))return r.travelHours;const m=String(r.travelTime||"").match(/\d+(?:[.,]\d+)?/);return m?Number(m[0].replace(",",".")):99}
const classLabel={hike:"🥾 Пеший маршрут",alpine:"⛰ Сложный альпийский",guide:"🧗 Альпинизм / гид"};
function renderCard(r){
 const photo=commons[r.id];const art=photo?'<img src="'+esc(photoURL(photo[0]))+'" alt="'+esc(r.tag+" — "+r.region)+'" loading="lazy" referrerpolicy="no-referrer" onerror="this.hidden=true">':'<div class="visualTexture" aria-hidden="true"></div>';
 const credit=photo?'<a class="photoLicense" href="'+esc(photoPage(photo[0]))+'" target="_blank" rel="noopener" title="Автор и лицензия фотографии">📷 '+esc(photo[1])+' ↗</a>':"";
 const warning=r.risk==="guide"?"⚠️ Нужен горный гид":r.risk==="closedHut"?"⚠️ Хижина закрыта":r.risk==="tatra"?"⚠️ Сезон TANAP":r.risk==="alpine"||r.risk==="summerOnly"?"⚠️ Не для снега / льда":r.id==="jetrich"?"⚠️ Часть закрыта":r.transportStatus==="unverified"?"⚠️ Пересадки проверить":"🚆 Пересадки проверить";
 const n='<span class="'+(isUncertain(r)?"badgeWarn":"badgeGreen")+'">'+warning+'</span>';
 const km=r.km==null?"дистанция: уточнить":r.km.toLocaleString("ru-RU")+" км";
 const dist=r.gain==null?"Набор: уточнить": "+"+r.gain+" м";
 const google=transitLink(r),fee=fareText(r),longTransfer=travelHours(r)>7;
 return '<article class="hikeCard" id="hike-'+r.id+'"><div class="cardVisual">'+art+credit+'<div class="visualTitle"><span>'+esc(flags[r.country]+" "+r.region.toUpperCase())+'</span><b>'+esc(r.tag)+'</b></div></div><div class="cardBody">'+
 '<div class="hikeBadges"><span>✨ WOW '+r.wow.toFixed(1)+'/10</span><span class="badgeHikeCollection">'+esc(collectionLabel[collectionOf(r)])+'</span><span>'+esc(classLabel[routeClass(r)])+'</span>'+n+'</div>'+
 '<h3>'+esc(r.title)+'</h3><p class="hikeOneLine">'+esc(r.why)+'</p>'+
 '<div class="statsRow"><span>🥾 '+esc(km)+'</span><span>↗ '+esc(dist)+'</span><span>⏱ '+esc(r.hours)+'</span><span>⛰ '+esc(r.altitude? r.altitude+" м":"гора")+'</span><span>🚌 '+esc(r.travelTime)+'</span></div>'+
 '<div class="rideCost"><div><small>БИЛЕТЫ ИЗ ПРАГИ И ОБРАТНО / 1 ЧЕЛ.</small><strong'+(r.fareMin==null?' class="fareUnknown"':'')+'>'+esc(fee)+'</strong><em class="costNote">'+(r.fareMin==null?'Тариф не запрашивался — проверить билеты':'Непроверенная оценка, не тариф')+'</em></div><em>'+(longTransfer?'⚠️ Долгий<br>переезд':'🛏 Ночёвки<br>отдельно')+'</em></div>'+
 '<div class="cardControls"><a class="primaryC" href="./hike.html?id='+encodeURIComponent(r.id)+'&weekend='+encodeURIComponent(dateStart)+'">✦ Открыть маршрут →</a><button type="button" class="saveHike" data-save="'+r.id+'" aria-pressed="'+saved.has(r.id)+'">'+(saved.has(r.id)?"♥ Сохранено":"♡ В избранное")+'</button><a href="'+esc(r.source)+'" target="_blank" rel="noopener"'+esc(sourceLabel(r))+'</a><a href="'+esc(google)+'" target="_blank" rel="noopener">🚆 Как доехать ↗</a></div>'+
 '<details class="hikeDetails" data-route="'+r.id+'"><summary>Подробный план поездки и погода ↓</summary>'+
 '<div class="detailSection"><b>🚆 Пятница · дорога из Праги</b><p>'+esc(r.transit)+' Оценка пути '+esc(r.travelTime)+'. Ночевать удобнее всего в районе <b>'+esc(r.gateway)+'</b>. Последний местный автобус по вечерам не гарантирован: сначала проверить стыковки на IDOS.</p></div>'+
 '<div class="detailSection"><b>🏔 Суббота · главный трек</b><p>'+esc(r.saturday)+'</p></div>'+
 '<div class="detailSection"><b>🌤 Воскресенье · бонус и возвращение</b><p>'+esc(r.sunday)+'</p></div>'+
 '<div class="detailSection"><b>⚠️ Сложность, сезон и ограничения</b><p class="hikeRisk">'+esc(r.caution)+'</p><p>Сезон: '+esc(r.season||"Проверять по маршруту")+'. Сложность: '+esc(r.level||"горный хайк")+'.</p></div>'+
 '<div class="detailSection"><b>💸 Бюджет и билеты</b><p>Билеты из Праги и обратно: '+esc(fee)+' на человека. Тариф не подтверждён, жильё и еда отдельно. Жильё и питание не включены. <a href="https://idos.cz/vlakyautobusymhdvse/spojeni/" target="_blank" rel="noopener">Поиск стыковок IDOS ↗</a> · <a href="https://www.cd.cz/spojeni-a-jizdenka/" target="_blank" rel="noopener">Покупка/цены ČD ↗</a></p></div>'+
 '<div class="detailSection"><b>🗺 Трек и карта</b><p><a href="'+esc(r.id==="jetrich"?"https://www.ceskesvycarsko.cz/tip-na-vylet/za-jetrichovickymi-vyhlidkami/":r.source)+'" target="_blank" rel="noopener"'+esc(sourceLabel(r))+'</a> · <a href="'+esc(areaMap(r))+'" target="_blank" rel="noopener">Открыть район в Mapy.com ↗</a>. Отметка на обзорной карте не заменяет GPS-трек.</p></div>'+
 '<div class="wxPanel" id="wx-'+r.id+'"><div class="wxHead"><strong>🌦 Погода на выбранные пятницу — воскресенье</strong><button type="button" data-refresh-route="'+r.id+'">↻</button></div><div class="wxContent" data-weather-content="'+r.id+'">Нажми «↻» или открой детали: загрузим прогноз Open-Meteo.</div></div>'+
 '</details></div></article>';
}
function dateIso(d){return [d.getUTCFullYear(),String(d.getUTCMonth()+1).padStart(2,"0"),String(d.getUTCDate()).padStart(2,"0")].join("-")}
function weekdayValid(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s||""))return false;const d=new Date(s+"T12:00:00Z");return !Number.isNaN(d.valueOf())&&dateIso(d)===s}
function asDate(s){return new Date((weekdayValid(s)?s:"2026-10-16")+"T12:00:00Z")}
function isoPlus(s,days){const d=asDate(s);d.setUTCDate(d.getUTCDate()+days);return dateIso(d)}
function nice(s){return asDate(s).toLocaleDateString("ru-RU",{day:"2-digit",month:"2-digit",timeZone:"UTC"})}
const settingKey="atlas-hiking-weekend-start";
let dateStart=new URLSearchParams(location.search).get("weekend")||localStorage.getItem(settingKey)||"2026-10-16";if(!weekdayValid(dateStart))dateStart="2026-10-16";
$("weekendStart").value=dateStart;
function showDates(){
 $("fridayDate").textContent=nice(dateStart);$("saturdayDate").textContent=nice(isoPlus(dateStart,1));$("sundayDate").textContent=nice(isoPlus(dateStart,2));
 const d=asDate(dateStart).getUTCDay();document.querySelectorAll(".threeDays article>span").forEach((s,i)=>{s.childNodes[0].textContent=(d===5?["ПЯТНИЦА","СУББОТА","ВОСКРЕСЕНЬЕ"]:["ДЕНЬ 1","ДЕНЬ 2","ДЕНЬ 3"])[i]+" · "});
 if(d!==5)$("globalWeatherStatus").textContent="ℹ️ Выбрана не пятница. Прогноз строится на выбранную дату и следующие два дня; план ниже рассчитан на пятницу–воскресенье.";
}
let currentRequest=0;const weatherCache=new Map();const pending=new Map();
function weatherKey(r){return [r.id,dateStart].join(":")}
function cloudEmoji(code){if([0,1].includes(code))return "☀️";if([2,3].includes(code))return "⛅";if([45,48].includes(code))return "🌫️";if([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code))return "🌧️";if([71,73,75,77,85,86].includes(code))return "🌨️";if([95,96,99].includes(code))return "⛈️";return "🌤️"}
function val(x,unit){return x===null||x===undefined||!Number.isFinite(+x)?"—":Math.round(+x*10)/10+unit}
function renderWeather(r,body){
 const el=document.querySelector('[data-weather-content="'+r.id+'"]');if(!el)return;
 if(!body){el.textContent="Вне текущего горизонта модели: Open-Meteo обычно даёт прогноз примерно на 16 дней вперёд.";return}
 const days=[dateStart,isoPlus(dateStart,1),isoPlus(dateStart,2)],names=asDate(dateStart).getUTCDay()===5?["Пятница","Суббота","Воскресенье"]:["День 1","День 2","День 3"];
 const time=body.hourly?.time||[],daily=body.daily||{};let html='<div class="wxDays">';
 for(let i=0;i<3;i++){const dt=days[i],di=(daily.time||[]).indexOf(dt);if(di<0){html+='<article'+(i===1?' class="wxFocus"':'')+'><b>'+names[i]+' · '+nice(dt)+'</b>За горизонтом прогноза</article>';continue}
 const wx=cloudEmoji(daily.weather_code?.[di]);html+='<article'+(i===1?' class="wxFocus"':'')+'><b>'+names[i]+' · '+nice(dt)+'</b><strong>'+wx+' '+val(daily.temperature_2m_min?.[di],"°")+'…'+val(daily.temperature_2m_max?.[di],"°C")+'</strong><small>🌧 '+val(daily.precipitation_sum?.[di]," мм")+' за сутки</small></article>';}
 html+='</div><div class="wxHourly"><b>Суббота по часам (модель на точку маршрута)</b><div>';
 const saturday=days[1];for(const h of [9,12,15,18]){const ts=saturday+"T"+String(h).padStart(2,"0")+":00";const ii=time.indexOf(ts);if(ii<0){html+='<span>'+h+':00 · —</span>';continue}
 html+='<span><b>'+h+':00</b> '+cloudEmoji(body.hourly.weather_code?.[ii])+' '+val(body.hourly.temperature_2m?.[ii],"°")+' · 🌧 '+val(body.hourly.precipitation?.[ii]," мм")+' · ☁ '+val(body.hourly.cloud_cover?.[ii],"%")+' · 🌬 '+val(body.hourly.wind_speed_10m?.[ii]," км/ч")+'</span>';}
 html+='</div></div><p class="wxSource">Источник: Open-Meteo, прогнозная модель по координатам района ('+r.lat+', '+r.lon+'), часовое местное время Europe/Prague. Не замеры, не гарантия сухой тропы. Высота прогнозной ячейки ≈'+(Number.isFinite(body.elevation)?Math.round(body.elevation)+" м":"не указана")+', вершина/точка маршрута '+(r.altitude?r.altitude+" м":"может быть выше")+'. Обновлено '+new Date().toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit",timeZone:"Europe/Prague"})+'.</p>';
 el.innerHTML=html;
}
async function loadWeather(r,force=false){
 const key=weatherKey(r),el=document.querySelector('[data-weather-content="'+r.id+'"]');if(!el)return;
 const cached=weatherCache.get(key);if(cached&&!force){renderWeather(r,cached);return}
 if(pending.has(key))return pending.get(key);
 el.textContent="⌛ Получаем свежий прогноз…";
 const url="https://api.open-meteo.com/v1/forecast?latitude="+r.lat+"&longitude="+r.lon+"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&hourly=temperature_2m,precipitation,cloud_cover,wind_speed_10m,weather_code&timezone=Europe%2FPrague&forecast_days=16";
 const task=(async()=>{try{const resp=await fetch(url,{cache:"no-store"});if(!resp.ok)throw Error("HTTP "+resp.status);const data=await resp.json();if(data.error)throw Error(data.reason||"API");weatherCache.set(key,data);if(dateStart===key.split(":")[1])renderWeather(r,data);}catch(e){if(dateStart===key.split(":")[1])el.innerHTML='<p class="wxError">Не удалось загрузить прогноз: '+esc(e.message)+'. Попробуй ещё раз, либо проверь официальный прогноз региона.</p>';}finally{pending.delete(key)}})();
 pending.set(key,task);return task;
}

function setAlpineHero(){
 const area=document.querySelector(".hikeHeroArtwork");if(!area)return;
 const file="Gosausee mit Dachstein.jpg",img=document.createElement("img");
 img.src=photoURL(file);img.alt="Vorderer Gosausee и вершины Dachstein";img.onerror=()=>img.remove();area.prepend(img);
 const a=document.createElement("a");a.href=photoPage(file);a.className="heroPhotoLicense";a.target="_blank";a.rel="noopener";a.textContent="📷 Karl Posch · Wikimedia Commons · CC BY-SA ↗";area.append(a);
}

function alpinePriority(r){if(collectionOf(r)==="high")return r.risk==="summerOnly"?0:r.risk==="alpine"?1:r.risk==="closedHut"?2:3;if(collectionOf(r)==="alpinism")return 4;return routeClass(r)==="alpine"?5:6}
const collectionHelp={
 hiking:"Без обязательного гида: озёра, вершины, скальные ущелья и длинные горные дни. Часть маршрутов требует уверенной работы на тросах и лестницах. Первыми стоят самые быстрые по ориентировочному времени дороги.",
 high:"Высокогорные трёхтысячники без ледникового перехода в нормальных бесснежных летних условиях. На снегу и льду они могут стать альпинистскими — оценка состояния обязательна.",
 alpinism:"Ледники, альпинистские восхождения и маршруты с профессиональным гидом или подготовленной связкой. Не выдаём их за пеший хайкинг."
};
const params=new URLSearchParams(location.search);
let currentCollection=["high","alpinism"].includes(params.get("collection"))?params.get("collection"):"hiking";
function visibleList(){
 const country=$("hikeCountry").value,type=$("hikeType").value,level=$("hikeClass").value,onlySaved=$("onlySaved")?.checked||false,sort=$("hikeSort").value;
 const matched=routes.filter(r=>collectionOf(r)===currentCollection&&(country==="all"||r.country===country)&&(type==="all"||r.type===type)&&(level==="all"||routeClass(r)===level)&&(!onlySaved||saved.has(r.id)));
 const travelTier=r=>travelHours(r)<=3.5?0:travelHours(r)<=5?1:travelHours(r)<=7?2:3;
 const beauty=r=>r.wow+(r.type==="lake"||r.type==="panorama"?.24:0)-travelHours(r)*.04;
 const byTravel=(a,b)=>travelTier(a)-travelTier(b)||beauty(b)-beauty(a)||travelHours(a)-travelHours(b);
 return matched.sort((a,b)=>sort==="near"?byTravel(a,b):sort==="alpine"?(alpinePriority(a)-alpinePriority(b)||travelHours(a)-travelHours(b)||b.wow-a.wow||(b.altitude||0)-(a.altitude||0)):sort==="cheap"?(a.fareMax??Infinity)-(b.fareMax??Infinity)||byTravel(a,b):sort==="long"?(b.km||0)-(a.km||0):sort==="easy"?(a.km??999)-(b.km??999):b.wow-a.wow||byTravel(a,b));
}
function displayCollection(){
 document.querySelectorAll("[data-collection]").forEach(btn=>{const on=btn.dataset.collection===currentCollection;btn.classList.toggle("active",on);btn.setAttribute("aria-pressed",String(on))});
 $("collectionExplanation").textContent=collectionHelp[currentCollection];
 $("catalogTitle").textContent=currentCollection==="hiking"?"Красивые хайки с удобной дорогой из Праги":currentCollection==="high"?"Трёхтысячники без обязательного гида летом":"Ледниковые и альпинистские восхождения";
}
function setCollection(value){
 if(!collectionHelp[value])return;
 currentCollection=value;$("hikeType").value="all";$("hikeClass").value="all";$("hikeSort").value=value==="hiking"?"near":"alpine";
 displayCollection();
 try{const url=new URL(location.href);if(value==="hiking")url.searchParams.delete("collection");else url.searchParams.set("collection",value);history.replaceState(null,"",url.pathname+url.search+url.hash)}catch(e){}
 render();autoFeatured();
}

// Photos sourced from Wikipedia pageimages, loaded lazily. Each photo links to its source page for author/license.
const cachedImages=new Map();
function wikiArt(){
 const cards=[...document.querySelectorAll(".hikeCard")];
 if(!("IntersectionObserver" in window))return;
 const observer=new IntersectionObserver(entries=>{for(const e of entries){if(!e.isIntersecting)continue;observer.unobserve(e.target);
  const card=e.target, id=card.id.slice(5),r=routes.find(x=>x.id===id);
  if(!r||!r.imagePage||commons[id])continue;
  const art=card.querySelector(".cardVisual");if(!art)continue;
  if(cachedImages.has(r.imagePage)){const obj=cachedImages.get(r.imagePage);if(obj)showWiki(art,obj);continue}
  const u="https://en.wikipedia.org/w/api.php?"+new URLSearchParams({action:"query",format:"json",prop:"pageimages",titles:r.imagePage,pithumbsize:"920",piprop:"thumbnail|name",origin:"*"});
  fetch(u).then(res=>res.json()).then(data=>{const p=Object.values(data.query?.pages||{})[0];const obj=p?.thumbnail?{url:p.thumbnail.source,file:p.pageimage}:null;cachedImages.set(r.imagePage,obj);if(obj)showWiki(art,obj)}).catch(()=>{});
 }},{rootMargin:"180px"});cards.forEach(c=>observer.observe(c));
}
function showWiki(art,obj){if(art.querySelector("img")||!obj)return;const img=document.createElement("img");img.src=obj.url;img.alt="Гора: "+(art.closest("article")?.querySelector("h3")?.textContent||"");img.loading="lazy";img.onerror=()=>img.remove();art.insertBefore(img,art.firstElementChild);const a=document.createElement("a");a.className="photoLicense";a.href="https://commons.wikimedia.org/wiki/File:"+encodeURIComponent(obj.file||"");a.target="_blank";a.rel="noopener";a.textContent="📷 Wikimedia · автор и лицензия ↗";art.append(a)}

function render(){
 const subset=visibleList(),totalSection=routes.filter(r=>collectionOf(r)===currentCollection).length;$("visibleCount").textContent=subset.length+" / "+totalSection+" в разделе · "+routes.length+" всего";$("totalRoutes").textContent=routes.length;$("noHikes").hidden=!!subset.length;
 $("hikeCards").innerHTML=subset.map(renderCard).join("");wikiArt();
 document.querySelectorAll(".hikeDetails").forEach(d=>d.addEventListener("toggle",()=>{if(d.open){const r=routes.find(x=>x.id===d.dataset.route);if(r)loadWeather(r)}}));
 document.querySelectorAll("[data-save]").forEach(b=>b.addEventListener("click",()=>{const id=b.dataset.save;if(saved.has(id))saved.delete(id);else saved.add(id);localStorage.setItem(savedKey,JSON.stringify([...saved]));if($("onlySaved").checked)render();else{b.setAttribute("aria-pressed",saved.has(id)?"true":"false");b.textContent=saved.has(id)?"♥ Сохранено":"♡ В избранное";}}));
 document.querySelectorAll("[data-refresh-route]").forEach(b=>b.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();const r=routes.find(x=>x.id===b.dataset.refreshRoute);if(r)loadWeather(r,true)}));
}
function updateWeekend(newDate){if(!weekdayValid(newDate))return;dateStart=newDate;localStorage.setItem(settingKey,dateStart);$("weekendStart").value=dateStart;showDates();document.querySelectorAll(".hikeCard").forEach(card=>{const a=card.querySelector("a.primaryC");if(a)a.href="./hike.html?id="+encodeURIComponent(card.id.slice(5))+"&weekend="+encodeURIComponent(dateStart)});document.querySelectorAll(".hikeDetails[open]").forEach(d=>{const r=routes.find(x=>x.id===d.dataset.route);if(r)loadWeather(r)});autoFeatured()}
async function autoFeatured(){const ids=currentCollection==="hiking"?["krkonose-modry-dul","lilienstein-loop","oetschergraben-bahn"]:currentCollection==="high"?["sulzkogel","pizboe","saeuleck"]:["grossglockner","wildspitze","gerlach"];const selected=routes.filter(r=>ids.includes(r.id));$("globalWeatherStatus").textContent="⌛ Получаем Open-Meteo для выбранного раздела…";const d=dateStart,section=currentCollection;await Promise.all(selected.map(r=>loadWeatherSummary(r)));if(dateStart===d&&currentCollection===section){const results=selected.map(r=>{const v=weatherCache.get(weatherKey(r));const ix=(v?.daily?.time||[]).indexOf(isoPlus(dateStart,1));return {r,mm:ix>=0?v.daily.precipitation_sum[ix]:null}}).filter(x=>x.mm!==null);const offFriday=asDate(dateStart).getUTCDay()!==5?"ℹ️ Дата начала не пятница: логистику на выбранные дни проверь отдельно. ":"";$("globalWeatherStatus").textContent=offFriday+(results.length?"🌦 "+(asDate(dateStart).getUTCDay()===5?"Суббота":"День 2")+" · "+results.map(x=>x.r.region+": "+val(x.mm," мм")+" осадков").join("  |  ")+" · нажми «Подробный план» в карточке для прогноза по часам.":"Погода пока недоступна либо даты дальше горизонта 16 дней. Открывай карточки для повторной загрузки.");}}
async function loadWeatherSummary(r){const key=weatherKey(r);if(weatherCache.has(key))return;const url="https://api.open-meteo.com/v1/forecast?latitude="+r.lat+"&longitude="+r.lon+"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&hourly=temperature_2m,precipitation,cloud_cover,wind_speed_10m,weather_code&timezone=Europe%2FPrague&forecast_days=16";try{const res=await fetch(url,{cache:"no-store"});if(res.ok){const data=await res.json();if(!data.error)weatherCache.set(key,data)}}catch(e){}}
["hikeCountry","hikeType","hikeClass","hikeSort","onlySaved"].forEach(id=>$(id)?.addEventListener("change",render));
document.querySelectorAll("[data-collection]").forEach(btn=>btn.addEventListener("click",()=>setCollection(btn.dataset.collection)));
for(const name of ["hiking","high","alpinism"])$(name+"Count").textContent=routes.filter(r=>collectionOf(r)===name).length;
if(currentCollection!=="hiking")$("hikeSort").value="alpine";displayCollection();
$("weekendStart").addEventListener("change",e=>updateWeekend(e.target.value));
$("prevWeek").addEventListener("click",()=>updateWeekend(isoPlus(dateStart,-7)));
$("nextWeek").addEventListener("click",()=>updateWeekend(isoPlus(dateStart,7)));
$("refreshHikeWeather").addEventListener("click",async()=>{const btn=$("refreshHikeWeather");btn.disabled=true;btn.textContent="⌛ Обновляем…";weatherCache.clear();const open=Array.from(document.querySelectorAll(".hikeDetails[open]")).map(d=>routes.find(r=>r.id===d.dataset.route)).filter(Boolean);await Promise.all(open.map(r=>loadWeather(r,true)));await autoFeatured();btn.disabled=false;btn.textContent="↻ Обновить погоду"});
showDates();render();autoFeatured();setAlpineHero();
})();