"use client";
import {useEffect,useRef,useState} from "react";
import type L from "leaflet";
import {featureLocation,type GeoCollection,type Measurement,type Kind} from "@/lib/riego-model";
import {buildRanking,featureAverage,locationKey,valueColor,type RankLevel} from "@/lib/riego-analytics";

type Props={geojson:GeoCollection;records:Measurement[];metric:string;unit:string;kind:Kind;level?:RankLevel;basemap?:boolean};
export default function RiegoMap({geojson,records,metric,unit,kind,level="lot",basemap=true}:Props){
  const element=useRef<HTMLDivElement>(null),[error,setError]=useState("");
  useEffect(()=>{let cancelled=false,current:L.Map|null=null;setError("");
    void import("leaflet").then(module=>{
      if(cancelled||!element.current)return;
      const lib=module.default;current=lib.map(element.current,{zoomControl:true});
      if(basemap)lib.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',maxZoom:19}).addTo(current);
      const rows=buildRanking(records,kind,level,metric),values=new Map(geojson.features.map(feature=>[locationKey(featureLocation(feature),level),featureAverage(feature,rows,level)]));
      const group=lib.geoJSON(geojson as Parameters<typeof lib.geoJSON>[0],{
        style(feature){const value=values.get(locationKey(featureLocation(feature as unknown as GeoCollection["features"][0]),level))??null;return {color:"#87958e",weight:1,fillColor:valueColor(kind,value),fillOpacity:basemap ? 0.78 : 0.92};},
        onEachFeature(feature,layer){
          const f=feature as unknown as GeoCollection["features"][0],location=featureLocation(f),value=values.get(locationKey(featureLocation(f),level))??null;
          const box=document.createElement("div"),title=document.createElement("strong"),path=document.createElement("p"),result=document.createElement("p");
          title.textContent=location.lote;path.textContent=[location.lugar,location.fundo,location.modulo].filter(Boolean).join(" · ");
          result.textContent=value==null?"Sin lecturas en este filtro":`Promedio ${level==="module"?"del módulo":"del lote"}: ${value.toLocaleString("es-PE",{maximumFractionDigits:2})}${unit?" "+unit:""}`;
          box.append(title,path,result);layer.bindPopup(box);
        }
      }).addTo(current);
      if(group.getBounds().isValid())current.fitBounds(group.getBounds(),{padding:[24,24],maxZoom:17});
      if(typeof ResizeObserver!=="undefined"){const observer=new ResizeObserver(()=>current?.invalidateSize());observer.observe(element.current);current.on("unload",()=>observer.disconnect());}
    }).catch(()=>{if(!cancelled)setError("No se pudo abrir el mapa. Vuelve a entrar al apartado.");});
    return()=>{cancelled=true;current?.remove();};
  },[geojson,records,metric,unit,kind,level,basemap]);
  return <div className={`field-map ${basemap?"":"field-map-plain"}`}><div ref={element} className="map-surface" aria-label="Mapa de lotes y promedios"/>{error&&<p role="alert" className="map-note">{error}</p>}</div>;
}
