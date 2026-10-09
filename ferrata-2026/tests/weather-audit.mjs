/* On-demand regional forecast snapshot for Via Ferrata Atlas.
   Prints model fields, not safety/access claims; all times Europe/Vienna. */
const areas=[
 ["Riegersburg",47.005,15.930],
 ["Hochlantsch",47.366,15.405],
 ["Hohe Wand",47.824,16.062],
 ["Rax",47.716,15.753],
 ["Hinterstoder / Priel",47.714,14.063],
 ["Gesäuse",47.545,14.590],
 ["Gosausee",47.534,13.496],
 ["Bad Ischl / Katrin",47.699,13.607],
 ["Berchtesgaden",47.692,13.003],
 ["Fieberbrunn",47.450,12.538],
 ["Dachstein",47.465,13.668],
 ["Falkert",46.858,13.807]
];
const day=process.env.ATLAS_WEATHER_DAY||"2026-10-10";
function previous(day){const d=new Date(day+"T12:00:00Z");d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10)}
const prev=previous(day);
const fields="precipitation,precipitation_probability,temperature_2m,cloud_cover,wind_gusts_10m,snowfall";
const total=(a)=>Math.round(a.reduce((s,v)=>s+(typeof v==="number"&&Number.isFinite(v)?v:0),0)*10)/10;
function metrics(o){
 const h=o.hourly, t=h?.time;
 if(!Array.isArray(t)||t.length<35)throw Error("Not enough hourly data");
 const indices=(date,low,high)=>t.map((val,i)=>({val,i})).filter(({val})=>val.slice(0,10)===date&&Number(val.slice(11,13))>=low&&Number(val.slice(11,13))<=high).map(x=>x.i);
 const win=(day,from,to,key)=>indices(day,from,to).map(i=>h[key]?.[i]).filter(v=>typeof v==="number");
 const peak=a=>a.length?Math.max(...a):null;
 const minimum=a=>a.length?Math.min(...a):null;
 return {rainPrev:total(win(prev,0,23,"precipitation")),rainMorning:total(win(day,8,12,"precipitation")),rainAfternoon:total(win(day,13,18,"precipitation")),rain08to20:total(win(day,8,20,"precipitation")),peakPop:peak(win(day,8,20,"precipitation_probability")),lowTemp:minimum(win(day,8,20,"temperature_2m")),gust:peak(win(day,8,20,"wind_gusts_10m")),snow:total(win(day,8,20,"snowfall"))};
}
async function fetchArea([name,lat,lon]){
 const params=new URLSearchParams({latitude:String(lat),longitude:String(lon),hourly:fields,timezone:"Europe/Vienna",start_date:prev,end_date:day});
 const response=await fetch("https://api.open-meteo.com/v1/forecast?"+params,{signal:AbortSignal.timeout(20000),headers:{"User-Agent":"FerrataAtlasWeatherAudit/1.0"}});
 if(!response.ok)throw Error("HTTP "+response.status);
 const json=await response.json();
 if(json.error)throw Error(json.reason);
 return {name,lat,lon,providerElevation:json.elevation,...metrics(json)};
}
console.log("VFA WEATHER AUDIT",new Date().toISOString(),"target day",day,"timezone Europe/Vienna");
console.log("MODEL: Open-Meteo (regional coordinates, NOT the actual via ferrata wall); 09 Oct rain may leave rock wet even if 10 Oct shows 0 mm.");
let success=0;
for(const area of areas){
 try{
  const result=await fetchArea(area);
  success++;
  console.log("VFA_WX",JSON.stringify(result));
 }catch(error){console.log("VFA_WX_ERROR",area[0],error.message)}
}
console.log("VFA_WX_DONE",success,"of",areas.length);
try {
 const coords=areas.slice(0,3);
 const params=new URLSearchParams({latitude:coords.map(x=>x[1]).join(","),longitude:coords.map(x=>x[2]).join(","),hourly:fields,timezone:"Europe/Vienna",start_date:prev,end_date:day});
 const response=await fetch("https://api.open-meteo.com/v1/forecast?"+params,{signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error("HTTP "+response.status);
 const values=await response.json();
 if(!Array.isArray(values)||values.length!==coords.length)throw Error("Multi-coordinate API output shape unexpected");
 console.log("VFA_MULTI_POINT_OK",values.length,"locations; live catalog batching supported");
} catch(error){console.error("VFA_MULTI_POINT_FAIL",error.message);process.exitCode=1}

if(success<8)process.exitCode=1;
