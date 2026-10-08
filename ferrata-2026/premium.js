(function(){
"use strict";
const db=window.FERRATA_DB;
if(!db||!db.routes)return;
const list=document.querySelector("#cards");
const favKey="ferrataWOW_favorites_v1";
const favIds=()=>{try{return new Set(JSON.parse(localStorage.getItem(favKey)||"[]").map(Number))}catch(e){return new Set()}};
const save=ids=>localStorage.setItem(favKey,JSON.stringify([...ids]));
const esc=v=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const code={AT:"🇦🇹 Австрия",DE:"🇩🇪 Германия",SK:"🇸🇰 Словакия",SI:"🇸🇮 Словения"};
const fmt=(a,b)=>a==null||b==null?"Не уточнено":b<=60?"до "+b+" мин":b<=120?"~1–2 ч":b<=180?"~2–3 ч":b<=300?"~3–5 ч":"длинная";
function updateFavCards(){
const fav=favIds();
list.querySelectorAll(".card").forEach((el,i)=>{
const id=Number(el.dataset.routeId),btn=el.querySelector(".favCard");
if(!btn||!id)return;
const yes=fav.has(id);
btn.dataset.active=yes?"1":"0";
btn.textContent=yes?"♥ Сохранено":"♡ Сохранить";
btn.setAttribute("aria-label",yes?"Убрать из избранного":"Добавить в избранное");
});
const counter=document.getElementById("premiumFavCount");
if(counter)counter.textContent="♥ "+fav.size;
}
const original=[...list.querySelectorAll(":scope>.card")];
for(let i=0;i<original.length;i++){
 const el=original[i],r=db.routes[Number(el.dataset.orig)];if(!r)continue;
 el.dataset.routeId=r.id;
 const link="./route.html?route="+encodeURIComponent(r.slug);
 const top=document.createElement("div");top.className="cardTopbar";
 top.innerHTML='<button type="button" class="favCard" title="Сохранить в избранном">♡ Сохранить</button><a href="'+link+'" class="cardTopGo" style="pointer-events:auto;background:#0b1a27d9;border:1px solid #ffffff44;backdrop-filter:blur(12px);color:#fff;text-decoration:none;font-size:12px;font-weight:800;padding:8px 11px;border-radius:999px">↗ Подробно</a>';
 el.prepend(top);
 const title=el.querySelector("h2");
 if(title){const a=document.createElement("a");a.href=link;a.textContent=title.textContent;a.style.cssText="color:inherit;text-decoration:none";title.textContent="";title.append(a);}
 const meta=el.querySelector(".meta"),chips=document.createElement("div");chips.className="cardDataChips";
 chips.innerHTML='<span>'+esc(code[r.country]||r.country)+'</span><span>⏱ Феррата*: '+esc(fmt(r.climbMin,r.climbMax))+'</span>'+(r.lengthM?'<span>↗ Трос: '+r.lengthM+' м</span>':"")+(r.combo?'<span>⇄ Комбинация</span>':"");
 if(meta)meta.after(chips);
 const action=document.createElement("a");action.className="detailCTA";action.href=link;action.textContent="Открыть подробный гид →";
 const actions=el.querySelector(".actions");if(actions)actions.before(action);else el.append(action);
 top.querySelector(".favCard").addEventListener("click",()=>{
  let favs=favIds();if(favs.has(r.id))favs.delete(r.id);else favs.add(r.id);save(favs);updateFavCards();if(window.FERRATA_REDRAW)window.FERRATA_REDRAW()
 })
}
updateFavCards();
document.querySelector("#resetFilters")?.addEventListener("click",()=>{const chk=document.getElementById("onlyFavorites");if(chk)chk.checked=false;});
const helper=document.querySelector("#finderHint");
if(helper)helper.title="Указанные интервалы лазания ориентировочные. Для подтверждённой длины и времени всегда сверяйся с топо.";
})();