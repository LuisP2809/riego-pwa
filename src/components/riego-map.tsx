"use client";
import { useEffect, useRef } from "react";
import type L from "leaflet";
import { matchesFeature, featureLocation, mean, reading, type GeoCollection, type Measurement } from "@/lib/riego-model";
export default function RiegoMap({geojson,records,metric,unit}:{geojson:GeoCollection;records:Measurement[];metric:string;unit:string}){
 const element=useRef<HTMLDivElement>(null);
 useEffect(()=>{let cancelled=false,current:L.Map|null=null;
  void import("leaflet").then(module=>{
   if(cancelled||!element.current)return;const lib=module.default;current=lib.map(element.current,{zoomControl:true});
   lib.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',maxZoom:19}).addTo(current);
   const avgs=geojson.features.map(f=>mean(records.filter(r=>matchesFeature(r,f)).map(r=>reading(r,metric)).filter((v):v is number=>typeof v==="number"))),nums=avgs.filter((v):v is number=>v!==null),lo=nums.length?Math.min(...nums):0,hi=nums.length?Math.max(...nums):0;
   const group=lib.geoJSON(geojson as Parameters<typeof lib.geoJSON>[0],{
    style(feature){const v=avgs[geojson.features.indexOf(feature as unknown as GeoCollection["features"][0])];const t=v==null||hi===lo?0.5:(v-lo)/(hi-lo);return {color:v==null?"#8795a1":"#075b4c",weight:1.5,fillColor:v==null?"#dbe2e8":`hsl(${190-t*45} 72% ${74-t*34}%)`,fillOpacity:.74};},
    onEachFeature(feature,layer){const f=feature as unknown as GeoCollection["features"][0],loc=featureLocation(f),value=mean(records.filter(r=>matchesFeature(r,f)).map(r=>reading(r,metric)).filter((v):v is number=>typeof v==="number"));const div=document.createElement("div"),title=document.createElement("strong"),path=document.createElement("p"),result=document.createElement("p");title.textContent=loc.lote;path.textContent=[loc.lugar,loc.fundo,loc.modulo].filter(Boolean).join(" · ");result.textContent=value==null?"Sin mediciones en este filtro":`Promedio: ${value.toLocaleString("es-PE",{maximumFractionDigits:2})}${unit?" "+unit:""}`;div.appendChild(title);div.appendChild(path);div.appendChild(result);layer.bindPopup(div);}
   }).addTo(current);if(group.getBounds().isValid())current.fitBounds(group.getBounds(),{padding:[24,24],maxZoom:17});setTimeout(()=>current?.invalidateSize(),100);
  }).catch(()=>{});return()=>{cancelled=true;current?.remove();};
 },[geojson,records,metric,unit]);
 return <div ref={element} className="map-surface" aria-label="Mapa de lotes y mediciones"/>;
}
