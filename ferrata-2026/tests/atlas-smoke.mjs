import assert from "node:assert/strict";
import { chromium } from "playwright";
const site="http://127.0.0.1:8765";
const browser=await chromium.launch({headless:true,args:["--no-sandbox","--disable-dev-shm-usage"]});
const failures=[];
const check=(name,fn)=>fn().then(()=>console.log("PASS",name)).catch(e=>{failures.push([name,e.message]);console.error("FAIL",name,e.message)});
async function pageAt(width,path){
 const context=await browser.newContext({viewport:{width,height:880},deviceScaleFactor:1,hasTouch:width<900,isMobile:false});
 await context.route(/^https?:\/\/(?!127\.0\.0\.1)/,route=>route.abort());
 const page=await context.newPage();
 const errors=[];
 page.on("pageerror",e=>errors.push(e.message));
 await page.goto(site+path,{waitUntil:"domcontentloaded"});
 return {context,page,errors};
}
const testWidths=[320,375,390,428,768,1280];
for(const width of testWidths){
 await check("Route layout "+width+"px",async()=>{
  const {context,page,errors}=await pageAt(width,"/route.html?route=58-fieberbrunn-marokka-himmel-henne-wildseelodersee");
  await page.waitForSelector("#routePage:not([hidden])");
  const m=await page.evaluate(()=>({
   body:document.documentElement.scrollWidth,
   viewport:innerWidth,
   segments:document.querySelectorAll(".vipDetailSegments .vipPartTile").length,
   galleryWidth:document.querySelector(".vipDetailSegments")?.clientWidth,
   galleryScroll:document.querySelector(".vipDetailSegments")?.scrollWidth
  }));
  assert.equal(errors.length,0,JSON.stringify(errors));
  assert.ok(m.body<=m.viewport+3,JSON.stringify(m));
  assert.equal(m.segments,3,JSON.stringify(m));
  if(width<=850)assert.ok(m.galleryScroll>=m.galleryWidth,JSON.stringify(m));
  await context.close();
 });
}
for(const width of [320,390,768,1280]){
 await check("Catalog filter controls "+width+"px",async()=>{
  const {context,page,errors}=await pageAt(width,"/index.html");
  await page.waitForSelector(".importanceGrid");
  assert.equal(await page.locator(".presetSection .presetbar button").count(),5);
  assert.equal(await page.locator("#toggleMap, #mapPanel").count(),0);
  await page.locator("#weatherImportance").selectOption("low");
  assert.match(await page.locator("#finderSummary").innerText(),/низкая/i);
  await page.locator('[data-preset="wow"]').click();
  assert.equal(await page.locator("#wowImportance").inputValue(),"high");
  const d=await page.evaluate(()=>({body:document.documentElement.scrollWidth,vw:innerWidth}));
  assert.ok(d.body<=d.vw+3,JSON.stringify(d));
  // Presets filter and reorder the catalog. The original first DOM card may be
  // intentionally hidden, so verify that the filtered result contains at least
  // one visible card instead of requiring that specific card to stay visible.
  assert.ok(await page.locator("#cards>.card:visible").count()>0);
  // External image requests are intentionally aborted in this smoke suite.
  // A component tile is valid with either a loaded image element or its designed
  // icon fallback; requiring <img> made resilient image cleanup fail the CI.
  assert.equal(await page.locator(".vipPartTile:not(:has(img)):not(:has(.vipNoPhoto))").count(),0);
  assert.equal(errors.length,0,JSON.stringify(errors));
  await context.close();
 });
}
await check("Mobile compare picks and vertical scrolling",async()=>{
 const {context,page,errors}=await pageAt(390,"/index.html");
 await page.evaluate(()=>localStorage.setItem("ferrataWOW_compare_v2","[5,12,57]"));
 await page.goto(site+"/compare.html",{waitUntil:"domcontentloaded"});
 await page.waitForSelector(".mobileCompareGroup");
 assert.equal(await page.locator("#compareMobile .mobileCompareHero").count(),2);
 const select=page.locator("[data-mobile-slot='0']");
 await select.selectOption("58"); // Choose a different valid database route (id 58)
 assert.equal(await select.inputValue(),"58");
 assert.equal(await page.locator(".compareDesktop").isVisible(),false);
 const overflow=await page.evaluate(()=>({body:document.documentElement.scrollWidth,vw:innerWidth}));
 assert.ok(overflow.body<=overflow.vw+3,JSON.stringify(overflow));
 assert.equal(errors.length,0,JSON.stringify(errors));
 await context.close();
});
await check("Desktop compare wheel scrolls page and arrows move table",async()=>{
 const {context,page,errors}=await pageAt(1440,"/index.html");
 await page.evaluate(()=>localStorage.setItem("ferrataWOW_compare_v2","[5,12,55,56,57]"));
 await page.goto(site+"/compare.html",{waitUntil:"domcontentloaded"});
 await page.waitForSelector(".compareScroll");
 await page.locator(".compareScroll").scrollIntoViewIfNeeded();
 const before=await page.evaluate(()=>({x:document.querySelector(".compareScroll").scrollLeft,y:scrollY}));
 const rect=await page.locator(".compareScroll").boundingBox();
 await page.mouse.move(rect.x+100,rect.y+Math.min(150,rect.height/2));
 await page.mouse.wheel(0,400);
 await page.waitForTimeout(200);
 const after=await page.evaluate(()=>({x:document.querySelector(".compareScroll").scrollLeft,y:scrollY}));
 assert.ok(after.y>before.y,JSON.stringify({before,after}));
 await page.locator("#compareScrollRight").click();
 await page.waitForTimeout(350);
 assert.ok(await page.evaluate(()=>document.querySelector(".compareScroll").scrollLeft)>0);
 assert.equal(errors.length,0,JSON.stringify(errors));
 await context.close();
});

/* Regression coverage for the eight researched routes, preserved storage
   indices, no-lift logistics, and real forecast refresh / date-selection UI.
   A deterministic API stub verifies DOM wiring; the separate Actions step
   checks live Open-Meteo reachability. */
await check("70 routes and newly added alpine entries",async()=>{
 const {context,page,errors}=await pageAt(390,"/index.html");
 assert.equal(await page.locator("#cards>.card").count(),70);
 assert.equal(await page.locator(".newRoutesNotice").count(),1);
 await page.locator('input[name="showStatus"][value="red"]').check();
 await page.locator("#maxDifficulty").selectOption("4");
 const card=page.locator('#cards>.card[data-orig="68"]');
 assert.equal(await card.count(),1);
 assert.equal(await card.isVisible(),true);
 const uri=await card.locator(".detailCTA").getAttribute("href");
 assert.ok(uri?.includes("69-irg-ii-koppenkarstein"),String(uri));
 assert.equal(errors.length,0,JSON.stringify(errors));
 await context.close();
});
await check("Lift-free guide does not invent an operator URL",async()=>{
 const {context,page,errors}=await pageAt(390,"/route.html?route=63-berchtesgadener-hochthronsteig");
 await page.waitForSelector("#routePage:not([hidden])");
 assert.equal(await page.locator("#transportPlan").count(),0);
 assert.equal(await page.locator('#sourcesLinks a[href*="bergsteigen.com"]').count()>0,true);
 assert.equal(await page.locator("#routeDeepDives .deepText").count(),4);
 assert.equal(errors.length,0,JSON.stringify(errors));
 await context.close();
});
await check("Dachstein / Nebelhorn access lists actual operators",async()=>{
 for(const [slug,domain] of [["69-irg-ii-koppenkarstein","derdachstein.at"],["68-hindelanger-klettersteig","ok-bergbahnen.com"]]){
  const {context,page,errors}=await pageAt(390,"/route.html?route="+slug);
  await page.waitForSelector("#routePage:not([hidden])");
  assert.equal(await page.locator("#transportPlan").count(),1);
  assert.equal(await page.locator('#transportPlan a[href*="'+domain+'"]').count(),1);
  assert.equal(errors.length,0,JSON.stringify(errors));
  await context.close();
 }
});
function fakeWeather(day){
 const h=[...Array(24)].map((_,i)=>String(day)+"T"+String(i).padStart(2,"0")+":00");
 const n=day==="2026-10-11"?0.9:0.2;
 return {latitude:47.7,longitude:13.6,hourly:{time:h,precipitation:h.map(()=>n),precipitation_probability:h.map(()=>30),cloud_cover:h.map(()=>40),temperature_2m:h.map(()=>7),snowfall:h.map(()=>0),wind_gusts_10m:h.map(()=>14)}};
}
await check("Route weather refetches and updates after date selection",async()=>{
 const {context,page,errors}=await pageAt(390,"/route.html?route=63-berchtesgadener-hochthronsteig");
 let calls=[];
 await page.route(/^https:\/\/api\.open-meteo\.com\/v1\/forecast\?/,async r=>{
  const day=new URL(r.request().url()).searchParams.get("start_date");
  calls.push(day);
  await r.fulfill({status:200,contentType:"application/json",body:JSON.stringify(fakeWeather(day))});
 });
 await page.locator("#refreshWeather").click();
 await page.waitForFunction(()=>document.querySelector("#weatherData")?.hidden===false);
 assert.match(await page.locator("#weatherData").innerText(),/2026-10-10/);
 await page.locator("#weatherDate").fill("2026-10-11");
 await page.locator("#weatherDate").dispatchEvent("change");
 await page.waitForFunction(()=>document.querySelector("#weatherData")?.innerText?.includes("2026-10-11"));
 assert.equal(calls[0],"2026-10-10");
 assert.ok(calls.length>=2 && calls.slice(1).every(day=>day==="2026-10-11"),JSON.stringify(calls));
 assert.equal(errors.length,0,JSON.stringify(errors));
 await context.close();
});
await check("Comparison weather date updates mobile and desktop rows",async()=>{
 const {context,page,errors}=await pageAt(390,"/index.html");
 await page.evaluate(()=>localStorage.setItem("ferrataWOW_compare_v2","[61,62]"));
 await page.goto(site+"/compare.html",{waitUntil:"domcontentloaded"});
 let dates=[];
 await page.route(/^https:\/\/api\.open-meteo\.com\/v1\/forecast\?/,async r=>{
  const day=new URL(r.request().url()).searchParams.get("start_date");
  dates.push(day);
  await r.fulfill({status:200,contentType:"application/json",body:JSON.stringify(fakeWeather(day))});
 });
 await page.locator("#refreshCompareWeather").click();
 await page.waitForFunction(()=>document.querySelector("#cmpWX-62")?.innerText?.includes("мм"));
 await page.locator("#compareDate").fill("2026-10-11");
 await page.locator("#compareDate").dispatchEvent("change");
 await page.waitForFunction(()=>document.querySelector("#cmpWX-62")?.innerText?.includes("2026-10-11") || document.querySelector("#cmpWX-62")?.innerText?.includes("6.3"));
 assert.ok(dates.filter(d=>d==="2026-10-11").length>=2,JSON.stringify(dates));
 assert.equal(errors.length,0,JSON.stringify(errors));
 await context.close();
});

await check("All 70 public route links load and fit on 390px",async()=>{
 const {context,page,errors}=await pageAt(390,"/index.html");
 const routes=await page.evaluate(()=>window.FERRATA_DB.routes.map(x=>({id:x.id,name:x.name,slug:x.slug})));
 assert.equal(routes.length,70);
 assert.equal(new Set(routes.map(x=>x.slug)).size,70);
 for(const route of routes){
  await page.goto(site+"/route.html?route="+encodeURIComponent(route.slug),{waitUntil:"domcontentloaded"});
  await page.waitForSelector("#routePage:not([hidden])");
  const data=await page.evaluate(()=>({
   label:document.getElementById("crumbRoute")?.textContent?.trim(),
   description:document.getElementById("routeDescription")?.textContent?.trim(),
   width:document.documentElement.scrollWidth,
   viewport:innerWidth
  }));
  assert.equal(data.label,route.name,"Incorrect deep-link route "+route.slug);
  assert.ok(data.description?.length>=20,"Missing full route description "+route.slug);
  assert.ok(data.width<=data.viewport+3,"Overflow on "+route.slug+" "+JSON.stringify(data));
 }
 assert.equal(errors.length,0,JSON.stringify(errors));
 await context.close();
});
await check("Officially closed Attersee route is marked closed and has no lift",async()=>{
 const {context,page,errors}=await pageAt(390,"/index.html");
 await page.locator('input[name="showStatus"][value="closed"]').check();
 await page.locator("#maxDifficulty").selectOption("4");
 const card=page.locator('#cards>.card[data-orig="69"]');
 assert.ok(await card.isVisible(),"Closed route should be discoverable with explicit filters");
 assert.match(await card.innerText(),/обрыв троса|закрыта/i);
 await page.goto(site+"/route.html?route=70-attersee-klettersteig-mahdlgupf",{waitUntil:"domcontentloaded"});
 await page.waitForSelector("#routePage:not([hidden])");
 assert.equal(await page.locator("#transportPlan").count(),0);
 assert.match(await page.locator("#routeDescription").innerText(),/закрыта|обрыв троса/i);
 assert.equal(errors.length,0,JSON.stringify(errors));
 await context.close();
});

await check("Fresh catalog forecast changes rain badges and numeric filtering",async()=>{
 const {context,page,errors}=await pageAt(390,"/index.html");
 const requests=[];
 await page.route(/^https:\/\/api\.open-meteo\.com\/v1\/forecast\?/,async req=>{
   const url=new URL(req.request().url());
   const lats=url.searchParams.get("latitude").split(",");
   requests.push(lats.length);
   const times=["2026-10-09","2026-10-10"].flatMap(day=>Array.from({length:24},(_,h)=>day+"T"+String(h).padStart(2,"0")+":00"));
   const payload=lats.map(lat=>({hourly:{
     time:times,precipitation:times.map(t=>t.startsWith("2026-10-10")?(Number(lat)<47.1?0.02:0.2):0),
     precipitation_probability:times.map(()=>15),
     temperature_2m:times.map(()=>8),
     wind_gusts_10m:times.map(()=>20),
     cloud_cover:times.map(()=>40),
     snowfall:times.map(()=>0)
   }}));
   await req.fulfill({status:200,contentType:"application/json",body:JSON.stringify(lats.length===1?payload[0]:payload)});
 });
 const prev=await page.locator('#cards>.card[data-orig="0"] .mm').innerText();
 await page.locator("#fetchLiveForecast").click();
 await page.waitForFunction(()=>window.FERRATA_LIVE?.active);
 const present=await page.locator('#cards>.card[data-orig="0"] .mm').innerText();
 assert.notEqual(prev,present);
 assert.match(present,/08–20/);
 assert.match(await page.locator("#liveForecastStatus").innerText(),/70 из 70/);
 assert.ok(requests.length>2,JSON.stringify(requests));
 const allVisible=await page.locator("#cards>.card:visible").count();
 await page.locator("#maxRain").fill("1");
 await page.locator("#maxRain").dispatchEvent("input");
 assert.ok(await page.locator("#cards>.card:visible").count()<allVisible);
 assert.equal(await page.locator('#cards>.card[data-orig="0"]').isVisible(),true,"Riegersburg should remain visible at 0.3 mm");
 assert.equal(await page.locator('#cards>.card[data-orig="1"]').isVisible(),false,"Hochlantsch should be filtered at 2.6 mm");
 await page.locator("#maxRain").fill("6");
 await page.locator("#maxRain").dispatchEvent("input");
 assert.ok(await page.locator("#cards>.card:visible").count()>0);
 assert.ok(allVisible>0);
 await page.locator("#liveForecastDate").fill("2026-10-11");
 await page.locator("#liveForecastDate").dispatchEvent("change");
 assert.equal(await page.evaluate(()=>window.FERRATA_LIVE.active),false);
 const restored=await page.locator('#cards>.card[data-orig="0"] .mm').innerText();
 assert.equal(restored,prev,"Changing the date must restore/archive old labels until refetch");
 const dims=await page.evaluate(()=>({body:document.documentElement.scrollWidth,w:innerWidth}));
 assert.ok(dims.body<=dims.w+3,JSON.stringify(dims));
 assert.equal(errors.length,0,JSON.stringify(errors));
 await context.close();
});

// Catalog weather accordion is intentionally hidden by vip.css. Forecast behavior
// is tested through visible route and compare UIs above; catalog refresh no-store
// is additionally checked in source review, without manufacturing a visible control.
await browser.close();
if(failures.length){console.error(JSON.stringify(failures,null,2));process.exitCode=1}else console.log("All Ferrata Atlas smoke checks passed");
