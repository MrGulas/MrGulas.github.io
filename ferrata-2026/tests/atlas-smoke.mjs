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
  await page.locator("#weatherImportance").selectOption("low");
  assert.match(await page.locator("#finderSummary").innerText(),/низкая/i);
  await page.locator('[data-preset="wow"]').click();
  assert.equal(await page.locator("#wowImportance").inputValue(),"high");
  const d=await page.evaluate(()=>({body:document.documentElement.scrollWidth,vw:innerWidth}));
  assert.ok(d.body<=d.vw+3,JSON.stringify(d));
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
await browser.close();
if(failures.length){console.error(JSON.stringify(failures,null,2));process.exitCode=1}else console.log("All Ferrata Atlas smoke checks passed");
