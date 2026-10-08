(function(){
"use strict";
const db=window.FERRATA_DB;
if(!db?.routes)return;
const $=id=>document.getElementById(id);
const favKey="ferrataWOW_favorites_v1",cmpKey="ferrataWOW_compare_v2";
const getArr=k=>{try{const a=JSON.parse(localStorage.getItem(k)||"[]");return Array.isArray(a)?a.filter(Number.isInteger):[]}catch(e){return []}};
const setArr=(k,x)=>{localStorage.setItem(k,JSON.stringify(x));window.dispatchEvent(new Event("atlas:changed"))};
const safe=x=>String(x||"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const googleImages=(name,kind)=>"https://www.google.com/search?tbm=isch&q="+encodeURIComponent(name+" Fotos "+(kind==="lake"||/see|weiher|mara|озеро|lake/i.test(name)?"See Austria":kind==="hike"||kind==="view"?"Panorama Wanderung":"Klettersteig"));
const routeURL=c=>{const id=c.routeId;return id&&db.routes[id-1]?"./route.html?route="+encodeURIComponent(db.routes[id-1].slug):null};
function count(){
 let a=new Set(getArr(favKey)),b=new Set(getArr(cmpKey));
 document.querySelectorAll("[data-fav-count]").forEach(el=>el.textContent=a.size);
 document.querySelectorAll("[data-compare-count]").forEach(el=>el.textContent=b.size);
 const legacy=$("premiumFavCount");if(legacy)legacy.textContent=String(a.size);
 const ob=$("openCompare");if(ob)ob.textContent="⚖ Сравнение ("+b.size+")";
 if(document.body.classList.contains("atlasDetail")&&!document.body.classList.contains("vipComparePage")){
  const id=new URL(location.href).searchParams.get("route");
  const rec=db.routes.find(r=>r.slug===id);
  const btn=$("vipDetailCompare");
  if(rec&&btn){const sel=b.has(rec.id-1);btn.textContent=sel?"✓ В сравнении":"⚖ Добавить к сравнению";btn.dataset.active=sel?"1":"0"}
 }
}
window.addEventListener("atlas:changed",count);
window.addEventListener("storage",e=>{if([favKey,cmpKey].includes(e.key))count()});
document.addEventListener("click",e=>{if(e.target.closest(".compareAdd,.favCard,#favRoute"))setTimeout(count,0)},true);
function icon(c){return c.kind==="lake"?"💧":c.kind==="hike"||c.kind==="view"?"🥾":"🧗"}
function componentTile(c){
 const photo=c.photo;
 const photoSrc=photo?.src||"";
 const link=googleImages(c.name,c.kind);
 return '<a class="vipPartTile" target="_blank" rel="noopener noreferrer" href="'+link+'" aria-label="Посмотреть фотографии '+safe(c.name)+' в Google Картинках">'+
 '<span class="vipNoPhoto" aria-hidden="true">'+icon(c)+'</span>'+(photoSrc?'<img loading="lazy" src="'+safe(photoSrc)+'" alt="'+safe(photo.alt||c.name)+'" onerror="this.remove()">':'')+
 '<span class="vipPartShade"></span><span class="vipPartInfo"><b>'+safe(c.name)+'</b><small>'+icon(c)+' Фотографии ↗</small></span></a>';
}
function componentPills(parts){
return parts.map(p=>'<a target="_blank" rel="noopener noreferrer" href="'+googleImages(p.name,p.kind)+'">'+icon(p)+' '+safe(p.name)+' ↗</a>').join("");
}
function groupGalleryHome(){
const cards=[...document.querySelectorAll("#cards>.card")];
if(!cards.length)return;
cards.forEach(el=>{
 const index=Number(el.dataset.orig);
 const r=db.routes[index];if(!r?.components||r.components.length<2)return;
 const g=el.querySelector(".gallery");if(!g)return;
 g.dataset.photoReady="1";g.className="gallery vipSplitGallery";
 g.innerHTML=r.components.map(componentTile).join("");
 const group=document.createElement("div");group.className="vipSegmentPills";group.setAttribute("aria-label","Части маршрута — фотографии по отдельности");
 group.innerHTML=componentPills(r.components);
 const meta=el.querySelector(".cardDataChips");
 if(meta)meta.after(group);else el.querySelector("h2")?.after(group);
 // Remove old caption from unrelated single-source gallery.
 const old=g.nextElementSibling;if(old?.classList.contains("pgallerySource"))old.remove();
});
}
function groupGalleryDetail(){
const slug=new URL(location.href).searchParams.get("route");
const r=db.routes.find(x=>x.slug===slug||String(x.id)===slug);
if(!r)return;
const actions=$("favRoute");
if(actions&&!$("vipDetailCompare")){
 const btn=document.createElement("button");btn.type="button";btn.className="actionSoft vipDetailCompareBtn";btn.id="vipDetailCompare";
 actions.after(btn);
 btn.addEventListener("click",()=>{
  const ids=new Set(getArr(cmpKey));
  if(ids.has(r.id-1))ids.delete(r.id-1);
  else if(ids.size>=5){alert("В сравнение можно добавить до пяти маршрутов. Убери один на странице сравнения.");return}
  else ids.add(r.id-1);
  setArr(cmpKey,[...ids]);
 });
}
const g=$("routeGallery"),parts=r.components;
if(!g||!parts?.length||parts.length<2)return;
g.classList.add("vipCompositeHero");
g.innerHTML='<div class="vipDetailSegments" style="--segment-count:'+parts.length+'">'+parts.map(componentTile).join("")+'</div>';
const photos=$("photoDetails");
if(photos){
 photos.innerHTML='<p class="detailLead">Здесь две или несколько самостоятельных точек. Ниже у каждой — своя ссылка на фотографии. Поэтому альбомы разных феррат и озёр больше не смешиваются.</p>'+
 '<div class="vipDetailPhotoLinks">'+parts.map(c=>{
 const internal=routeURL(c);
 const from=c.photo?.source?'<a class="vipSource" href="'+safe(c.photo.source)+'" rel="noopener noreferrer" target="_blank">Открыть источник фото ↗</a>':"";
 return '<div class="vipComponentCard"><small>'+icon(c)+' '+(c.kind==="lake"?"Озеро":c.kind==="ferrata"?"Феррата":"Прогулка / смотровая")+'</small><h3>'+safe(c.name)+'</h3><a href="'+googleImages(c.name,c.kind)+'" rel="noopener noreferrer" target="_blank">🖼 Фотографии '+safe(c.name)+' ↗</a>'+(internal?'<a href="'+internal+'">🗺 Открыть отдельный гид ↗</a>':"")+from+'</div>'
 }).join("")+'</div>';
}
}
function favoritesView(){
if(!document.querySelector("#routeFinder"))return;
const mode=new URL(location.href).searchParams.get("view");
const fav=$("onlyFavorites");
if(!fav)return;
if(mode==="favorites"){
 // Saved routes must not be hidden by unrelated weather/status filters.
 for(const el of document.querySelectorAll('input[name="showStatus"],input[name="showCountry"]'))el.checked=true;
 const inputs={minWow:"1",maxRain:"12",maxDrive:"6.5",maxDifficulty:"4",climbMax:"all",lengthMax:"all"};
 for(const [id,val] of Object.entries(inputs))if($(id))$(id).value=val;
 for(const id of ["onlyLakes","onlyCombos","onlyShortDay","onlyKnownRain"])if($(id))$(id).checked=false;
 fav.checked=true;
 window.FERRATA_REDRAW?.();
 const link=document.querySelector(".vipFavLink");if(link){link.classList.add("active");link.href="./index.html?view=all#cards";link.title="Вернуться ко всем маршрутам"}
 const hint=$("finderHint");if(hint)hint.textContent="В избранном — только маршруты этого браузера. Нажми «Избранное» ещё раз, чтобы вернуться ко всем.";
}else if(mode==="all"){
 fav.checked=false;window.FERRATA_REDRAW?.();
}
}
function updateCompareNav(){
 const b=$("openCompare");if(!b)return;
 b.addEventListener("click",function(event){event.preventDefault();event.stopImmediatePropagation();window.location.href="./compare.html"},true);
}
function detailsPrivacy(){
 const detail=document.querySelector(".detailFooter");
 if(detail&&!detail.querySelector(".vipPrivacyInline")){
  const s=document.createElement("p");s.className="vipPrivacyInline";s.textContent="♥ Избранное и ⚖ сравнение сохраняются персонально в этом браузере, не публикуются для других посетителей. Синхронизация между устройствами без аккаунта недоступна.";
  detail.append(s)
 }
}
groupGalleryHome();groupGalleryDetail();favoritesView();updateCompareNav();detailsPrivacy();count();
})();