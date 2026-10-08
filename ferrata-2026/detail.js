(function(){
"use strict";
var db=window.FERRATA_DB;
var $=id=>document.getElementById(id);
var esc=v=>String(v==null?"":v).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
var slug=new URL(location.href).searchParams.get("route");
var r=db&&db.routes&&db.routes.find(x=>x.slug===slug||String(x.id)===slug);
if(!r){$("pageLoading").hidden=true;$("pageError").hidden=false;return;}
$("pageLoading").hidden=true;$("routePage").hidden=false;
document.title=r.name+" | Ferrata Atlas";
var countryName={AT:"Австрия",DE:"Германия",SK:"Словакия",SI:"Словения"}[r.country]||"Альпы";
var labels={green:"🟢 Реалистичный кандидат",yellow:"🟡 При хороших условиях",orange:"🟠 Нужна осторожность",red:"🔴 На эту субботу не рекомендуется",closed:"⛔ Исключено на эту дату"};
var statusText={green:"Предварительный рейтинг благоприятен, но необходимо отдельно подтвердить сухую скалу и открытый спуск.",yellow:"Прохождение возможно только при подходящих условиях; проверяй подход, скалу, дождь и время спуска.",orange:"Существенные ограничения по погоде, сложности или времени. Без подтверждения безопасного сухого окна лучше не идти.",red:"Для выезда из Праги в 05:00 этот вариант не подходит по совокупности высоты, длины или погодного риска.",closed:"Маршрут закрыт, выше выбранного уровня или заведомо не подходит. Не планировать без пересмотра ограничения."};
var queryGoogle="https://www.google.com/search?tbm=isch&q="+encodeURIComponent(r.name+" Klettersteig Fotos");
var googleMaps="https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(r.region+" "+({AT:"Austria",DE:"Germany",SK:"Slovakia",SI:"Slovenia"}[r.country]||"Austria"));
var hasCoordinates=r.lat!=null&&r.lon!=null;
var meteo={AT:[["GeoSphere Austria — официальный прогноз","https://www.geosphere.at/de"],["Alpenverein / GeoSphere — горная погода","https://www.alpenverein.de/bergwetter/alpen/"]],DE:[["DWD — официальный прогноз","https://www.dwd.de/DE/wetter/wetter_node.html"],["Alpenverein — горный прогноз","https://www.alpenverein.de/bergwetter/"]],SK:[["SHMÚ — официальный прогноз","https://www.shmu.sk/"]],SI:[["ARSO — официальный прогноз","https://meteo.arso.gov.si/met/en/weather/"]]}; 
function minutes(a,b){if(a==null||b==null)return "Не уточнено";var hr=t=>t<60?t+" мин":(t/60).toFixed(t%60?1:0)+" ч";return hr(a)+"–"+hr(b)}
function linkList(items){return items.map(x=>'<a class="detailLink" target="_blank" rel="noopener noreferrer" href="'+esc(x[1])+'">'+esc(x[0])+' <span>↗</span></a>').join("")}
function host(url){try{return new URL(url).hostname.replace(/^www\./,"")}catch(e){return "Источник"}}
$("crumbRegion").textContent=r.region;$("crumbRoute").textContent=r.name;
$("routeEyebrow").textContent=countryName+" · "+r.region+" · 10 октября 2026";
$("routeTitle").textContent=r.name;$("routeSubtitle").textContent=r.desc.length>195?r.desc.slice(0,190)+"…":r.desc;
$("routePills").innerHTML='<span class="infoPill">'+esc(labels[r.status])+'</span><span class="infoPill">✨ WOW '+r.wow+'/10</span><span class="infoPill">🧗 '+esc(r.grade)+'</span><span class="infoPill">⏱ '+esc(minutes(r.climbMin,r.climbMax))+'*</span>'+(r.driveHours!=null?'<span class="infoPill">🚗 ~'+r.driveHours+' ч из Праги</span>':"")+(r.hasLake?'<span class="infoPill">💧 Озеро / вода</span>':"")+(r.combo?'<span class="infoPill">⇄ Комбинация</span>':"");
$("topoCTA").href=r.topo||googleMaps;$("googleCTA").href=queryGoogle;$("photoGoogleButton").href=queryGoogle;
$("routeDescription").textContent=r.desc;
const long=r.guide;
const details=document.getElementById("routeDeepDives");
if(long){details.innerHTML=[
 ["Почему маршрут особенный",long.why],
 ["Подход и организация",long.approach],
 ["Что добавить к феррате",long.hike],
 ["На что обратить внимание 10 октября",long.conditions]
].map(x=>'<div class="deepText"><h3>'+esc(x[0])+'</h3><p>'+esc(x[1])+'</p></div>').join("")}
else{details.innerHTML='<div class="deepText"><h3>Особенности именно этого маршрута</h3><p>'+esc(r.meta)+'. За подробным описанием подхода, схемой сложных участков и спуска открой привязанный к карточке маршрутный топо. Эти детали нельзя надёжно восстановить по одной краткой заметке, поэтому мы не рисуем выдуманный трек.</p></div>'}

$("statusBox").innerHTML='<div class="'+(r.status==="green"?"greenCallout":"warning")+'"><b>'+esc(labels[r.status])+'</b><br>'+esc(statusText[r.status])+'</div>';
var stats=[
 ["Сложность",r.grade],["Лазание — оценка*",minutes(r.climbMin,r.climbMax)],["Длина троса",r.lengthM?r.lengthM+" м":"Нет подтверждённых данных"],
 ["Дорога из Праги",r.driveHours==null?"Не уточнено":"~"+r.driveHours+" ч"],["Осадки 10.10 · старый прогноз",r.mm==null?"Нет данных":"~"+r.mm+" мм"],["Озеро или вода",r.hasLake?"Рядом / в программе":"Не основной акцент"]
];
$("routeStats").innerHTML=stats.map(a=>'<div class="dataCell"><span>'+esc(a[0])+'</span><b>'+esc(a[1])+'</b></div>').join("");
$("bigWow").textContent=r.wow.toFixed(1);
$("sideQuickStats").innerHTML=stats.slice(0,4).map(a=>'<div class="dataCell"><span>'+esc(a[0])+'</span><b style="font-size:13px">'+esc(a[1])+'</b></div>').join("");
var risks=[];
if(r.status==="closed")risks.push("Закрытие или несоответствие уровня — не игнорировать при улучшении прогноза.");
if(r.highAlpine)risks.push("Высота: возможны снег и лёд даже без дождя.");
if(/drachenwand/i.test(r.name))risks.push("Особенно опасен мокрый спуск Hirschsteig.");
if(/alberfeldkogel/i.test(r.name))risks.push("Крутой нестрахованный подход к феррате должен быть сухим.");
if(/königsjodler/i.test(r.name))risks.push("Официальное закрытие 10.10.2026 из-за учений горноспасателей.");
if(/spielmäuer/i.test(r.name))risks.push("В октябре действует сезонное закрытие из-за оленьего гона.");
if(/mooserboden|mobo|kaprun/i.test(r.name))risks.push("Обязательный трансфер от Kesselfall; проверить расписание и последний спуск.");
if(/fieberbrunn|marokka|henne|wildseeloder/i.test(r.name))risks.push("Учитывайте часы канатки и возможную сырость северных скал.");
if(/falkert/i.test(r.name))risks.push("Верхние участки около 2300 м; возможен лёд.");
if(/schmied|postalm/i.test(r.name))risks.push("Затенённая скала может не просохнуть после осадков.");
if(!risks.length)risks.push("Перед выходом проверить топо, возможные закрытия, подход и безопасный спуск.");
$("sideRisk").innerHTML='<b>⚠️ Главный риск</b><br>'+esc(risks[0]);
var driveText=r.driveHours==null?"проверить маршрут на карте":("около "+r.driveHours+" ч");
var steps=[
 ["Выезд из Праги · 05:00","Переезд до района "+esc(r.region)+" — "+driveText+" без учёта пробок и остановок. Учти парковку, очереди и работу канаток."],
 ["Подход по топо","Найди точную точку входа на трассу, вариант прохождения и спуск по ссылке на топо; карта ниже показывает только район."],
 ["Лазание · "+minutes(r.climbMin,r.climbMax),"Сложность: "+esc(r.grade)+". Продолжительность ориентировочная, зависит от выбранной линии, группы и состояния скалы."],
 ["Спуск и дополнительный хайк",r.hasLake?"Если условия позволяют, оставь запас времени для прогулки к озеру и фотографий. Протяжённость хайка уточни по тропам.":"Выбери короткую панорамную прогулку, но учитывай, что безопасный спуск иногда дольше самой ферраты."],
 ["Возвращение до темноты","Если прогноз ухудшился — откажись от дополнительной линии, вершины или озера. Не сокращай запас времени на спуск."]
];
$("routeSteps").innerHTML=steps.map((x,i)=>'<div class="routeStep"><span class="stepNum">0'+(i+1)+'</span><div><strong>'+x[0]+'</strong><p>'+x[1]+'</p></div></div>').join("");
$("routeCautions").innerHTML='<div class="warning"><b>Проверить перед стартом</b><br>'+risks.map(esc).join("<br>")+'</div>';
$("officialWeatherLinks").innerHTML=linkList(meteo[r.country]||meteo.AT);
var sourceLinks=[["Топо и подробности · "+host(r.topo),r.topo||googleMaps]];
for(var l of r.links||[]){if(l.url&&l.url!==r.topo&&!/google\.com\/search/.test(l.url))sourceLinks.push([l.title+" · "+host(l.url),l.url])}
$("sourcesLinks").innerHTML=linkList(sourceLinks);
// Accurate media only: photos already directly bound to this route, never nearby-location substitutes.
function fallback(){return '<div class="heroFrame heroPlaceholder"><div class="mountainMark"></div><div class="heroMessage"><div class="atlasEyebrow">Точные фотографии</div><strong>Посмотри именно эту феррату</strong><p>Проверенных фото линии пока нет в базе. Вместо случайных гор — точный поиск изображений.</p><a class="actionMain" target="_blank" rel="noopener noreferrer" href="'+queryGoogle+'">🖼 Google Картинки ↗</a></div></div>'}
var images=r.photos||[];
$("routeGallery").innerHTML=images.length?images.slice(0,5).map((x,i)=>'<div class="heroFrame"><a href="'+esc(x.source)+'" class="openPhoto" data-index="'+i+'"><img src="'+esc(x.src)+'" loading="'+(i?"lazy":"eager")+'" alt="'+esc(x.alt||r.name)+'" onerror="this.closest(&quot;.heroFrame&quot;).style.display=&quot;none&quot;"></a><div class="heroCaption">'+esc(host(x.src))+'</div></div>').join(""):fallback();
$("photoDetails").innerHTML=images.length?'<p>Здесь '+images.length+' изображений из заранее привязанных к маршруту источников. Нажми на фото для просмотра и ссылки на оригинал.</p>':'<p>У этой линии пока нет проверенных встроенных фотографий. Для достоверных снимков открывай точный поиск Google Картинок по названию маршрута.</p>';

$("routeGallery").querySelectorAll("img").forEach(img=>img.addEventListener("error",()=>{
const frame=img.closest(".heroFrame");if(frame)frame.remove();
if(!$("routeGallery").querySelector("img"))$("routeGallery").innerHTML=fallback();
},{once:true}));
$("routeGallery").addEventListener("click",e=>{var a=e.target.closest(".openPhoto");if(!a)return;e.preventDefault();var i=+a.dataset.index,p=images[i];if(!p)return;$("lightboxImage").src=p.src;$("lightboxImage").alt=p.alt||r.name;$("lightboxSource").href=p.source;$("lightbox").hidden=false;document.body.style.overflow="hidden"});
function closeLightbox(){$("lightbox").hidden=true;document.body.style.overflow=""}
$("closeLightbox").addEventListener("click",closeLightbox);
$("lightbox").addEventListener("click",e=>{if(e.target.id==="lightbox")closeLightbox()});
window.addEventListener("keydown",e=>{if(e.key==="Escape")closeLightbox()});
if(hasCoordinates){
var lat=r.lat,lon=r.lon,bbox=[lon-.035,lat-.02,lon+.035,lat+.02].join(",");
$("mapContainer").innerHTML='<iframe title="Район '+esc(r.region)+' — приблизительная точка" loading="lazy" referrerpolicy="no-referrer" src="https://www.openstreetmap.org/export/embed.html?bbox='+encodeURIComponent(bbox)+'&layer=mapnik&marker='+lat+'%2C'+lon+'"></iframe>';
$("mapLinks").innerHTML=linkList([["Навигация в район — Google Maps",googleMaps],["Топографическая карта — OpenTopoMap","https://opentopomap.org/#map=14/"+lat+"/"+lon],["Топо ферраты — источник маршрута",r.topo||googleMaps]]);
}else{$("mapContainer").innerHTML='<p style="padding:30px">Координаты района не уточнены. Используй ссылку на официальный маршрут.</p>';$("mapLinks").innerHTML=linkList([["Открыть район в Google Maps",googleMaps],["Официальное топо",r.topo||googleMaps]])}
var rad=x=>x*Math.PI/180;
function distance(a,b){if(a.lat==null||a.lon==null||b.lat==null||b.lon==null)return 999;var dlat=rad(b.lat-a.lat),dlon=rad(b.lon-a.lon);var q=Math.sin(dlat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dlon/2)**2;return Math.round(6371*2*Math.atan2(Math.sqrt(q),Math.sqrt(1-q)))}
var rel=db.routes.filter(x=>x.slug!==r.slug&&x.country===r.country).map(x=>Object.assign({},x,{dist:distance(r,x)})).sort((a,b)=>a.dist-b.dist||b.wow-a.wow).slice(0,4);
$("relatedRoutes").innerHTML=rel.map(x=>'<a class="relatedRoute" href="./route.html?route='+encodeURIComponent(x.slug)+'"><b>'+esc(x.name)+'</b><small>📍 '+(x.dist===999?"поблизости":x.dist+" км от района")+' · WOW '+x.wow+'/10 · '+esc(x.grade)+'</small></a>').join("");
var favKey="ferrataWOW_favorites_v1",favs;
try{favs=new Set(JSON.parse(localStorage.getItem(favKey)||"[]").map(Number))}catch(e){favs=new Set()}
function updateFav(){$("favRoute").textContent=favs.has(r.id)?"♥ В избранном":"♡ В избранное"}
$("favRoute").addEventListener("click",()=>{if(favs.has(r.id))favs.delete(r.id);else favs.add(r.id);localStorage.setItem(favKey,JSON.stringify([...favs]));updateFav()});updateFav();
$("shareRoute").addEventListener("click",async()=>{try{if(navigator.share)await navigator.share({title:r.name,url:location.href});else {await navigator.clipboard.writeText(location.href);$("shareRoute").textContent="✓ Ссылка скопирована";setTimeout(()=>$("shareRoute").textContent="🔗 Поделиться",2000)}}catch(e){if(e.name!=="AbortError")window.prompt("Ссылка",location.href)}});
async function forecast(){
var weatherDate=$("weatherDate")?.value||"2026-10-10";
var load=$("weatherLoading"),out=$("weatherData");load.hidden=false;out.hidden=true;
if(!hasCoordinates){load.textContent="Для района пока нет точных координат. Используй ссылки на официальные метеослужбы.";return}
var req=new URLSearchParams({latitude:r.lat,longitude:r.lon,hourly:"temperature_2m,precipitation,precipitation_probability,cloud_cover,snowfall,wind_gusts_10m",timezone:"Europe/Vienna",start_date:weatherDate,end_date:weatherDate});
try{
var rr=await fetch("https://api.open-meteo.com/v1/forecast?"+req.toString());if(!rr.ok)throw Error("HTTP "+rr.status);
var d=await rr.json();if(d.error)throw Error(d.reason||"API error");
var hh=d.hourly;if(!hh||!Array.isArray(hh.time))throw Error("Нет почасовых данных");
var rows=hh.time.map((t,i)=>({hour:+t.slice(11,13),time:t.slice(11,16),t:hh.temperature_2m?.[i],mm:hh.precipitation?.[i],pop:hh.precipitation_probability?.[i],cloud:hh.cloud_cover?.[i],snow:hh.snowfall?.[i],gust:hh.wind_gusts_10m?.[i]})).filter(x=>x.hour>=8&&x.hour<=20);
if(!rows.length)throw Error("Нет часов на указанную дату");
var win=rows.filter(x=>x.hour>=10&&x.hour<=16);
var total=win.reduce((s,x)=>s+(+x.mm||0),0),pop=Math.max(...win.map(x=>+x.pop||0)),gust=Math.max(...win.map(x=>+x.gust||0));
var cloud=Math.round(win.reduce((s,x)=>s+(+x.cloud||0),0)/win.length),snow=win.reduce((s,x)=>s+(+x.snow||0),0);
var dec=v=>v==null?"—":Number(v).toFixed(1);
out.innerHTML='<p class="sourceNote">Open-Meteo · координаты района '+esc(r.region)+' · дата '+esc(weatherDate)+'. Сумма для периода 10:00–17:00.</p>'+
'<div class="wxKpis"><div class="wxKpi"><label>Осадки 10–17</label><strong>'+dec(total)+' мм</strong></div><div class="wxKpi"><label>Макс. вероятность</label><strong>'+pop+'%</strong></div><div class="wxKpi"><label>Средние облака</label><strong>'+cloud+'%</strong></div><div class="wxKpi"><label>Порывы ветра</label><strong>'+gust.toFixed(0)+' км/ч</strong></div></div>'+
(snow>0?'<div class="warning"><b>❄️ Снег в модели: '+dec(snow)+' см.</b> Горные условия могут быть значительно сложнее.</div>':"")+
'<div class="hourlyScroll"><table class="hourlyTable"><thead><tr><th>Время</th><th>Осадки</th><th>Шанс</th><th>Облака</th><th>Темп.</th><th>Порывы</th><th>Снег</th></tr></thead><tbody>'+
rows.map(x=>'<tr><td><b>'+x.time+'</b></td><td>'+dec(x.mm)+' мм<div class="wxBar" style="width:'+Math.round(Math.max(5,Math.min(78,(+x.mm||0)*25)))+'px"></div></td><td class="'+((+x.pop||0)>60?"wxRisk":"")+'">'+(x.pop==null?"—":x.pop+"%")+'</td><td>'+(x.cloud==null?"—":x.cloud+"%")+'</td><td>'+(x.t==null?"—":Math.round(x.t)+"°")+'</td><td>'+(x.gust==null?"—":Math.round(x.gust)+" км/ч")+'</td><td>'+(x.snow?dec(x.snow)+" см":"—")+'</td></tr>').join("")+'</tbody></table></div><p class="sourceNote">Погодная модель — НЕ официальное заключение о состоянии ферраты. На высоте могут быть снег, лёд и более сильный ветер, даже если в таблице сухо. Суточные данные каталога от 08.10 могут отличаться.</p>';
load.hidden=true;out.hidden=false;
}catch(e){load.textContent="Не удалось загрузить прогноз ("+e.message+"). Используй официальные ссылки ниже.";out.hidden=true}
}
$("refreshWeather").addEventListener("click",forecast);$("weatherDate").addEventListener("change",forecast);forecast();
})();