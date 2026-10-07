import { z } from "zod";

export const KINDS = ["HUMEDADES", "COMPACTACION", "PRESIONES"] as const;
export type Kind = typeof KINDS[number];
export const HEADERS: Record<Kind, string[]> = {
  HUMEDADES: ["AÑO","MES","SEMANA","FECHA","LUGAR","FUNDO","MODULO","LOTE","PROF","%HUMEDAD"],
  COMPACTACION: ["AÑO","MES","SEMANA","FECHA","LUGAR","FUNDO","MODULO","LOTE","PUNTOS","M1","M2","M3"],
  PRESIONES: ["AÑO","MES","SEMANA","FECHA","LUGAR","FUNDO","MODULO","LOTE","LADO","PRESION FINAL"],
};
export const LABELS: Record<Kind,string> = {HUMEDADES:"Humedades", COMPACTACION:"Compactación", PRESIONES:"Presiones"};
export const recordSchema = z.object({
  id:z.string().uuid(), kind:z.enum(KINDS),
  date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => { const d=new Date(v+"T12:00:00Z"); return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10)===v; },"Fecha inválida"),
  lugar:z.string().trim().min(1).max(100), fundo:z.string().trim().min(1).max(100),
  modulo:z.string().trim().min(1).max(100), lote:z.string().trim().min(1).max(100),
  prof:z.number().nonnegative().max(10000).optional(), humedad:z.number().min(0).max(100).optional(),
  puntos:z.string().trim().max(100).optional(), m1:z.number().nonnegative().optional(), m2:z.number().nonnegative().optional(), m3:z.number().nonnegative().optional(),
  lado:z.string().trim().max(100).optional(), presion:z.number().nonnegative().optional(),
}).superRefine((r,c)=>{
  const required = r.kind==="HUMEDADES" ? ["prof","humedad"] : r.kind==="COMPACTACION" ? ["puntos","m1","m2","m3"] : ["lado","presion"];
  for(const key of required) if((r as Record<string, unknown>)[key]===undefined || (r as Record<string, unknown>)[key]==="") c.addIssue({code:"custom",path:[key],message:"Completa este campo"});
});
export type Measurement = z.infer<typeof recordSchema> & {synced?:boolean; pending?:boolean; createdAt?:string};
export type GeoFeature = {type:"Feature"; properties:Record<string,unknown>; geometry:{type:"Polygon"|"MultiPolygon";coordinates:unknown}};
export type GeoCollection = {type:"FeatureCollection";features:GeoFeature[]};
export function normalize(v:unknown):string { return String(v??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/[^A-Z0-9]/g,""); }
export function property(p:Record<string,unknown>, ...keys:string[]):string {
  for (const key of keys) { const match=Object.keys(p).find(k=>normalize(k)===normalize(key)); if(match && p[match]!=null) return String(p[match]); } return "";
}
export function featureLocation(f:GeoFeature) {return {
  lugar:property(f.properties,"LUGAR","CAMPO","SEDE"), fundo:property(f.properties,"FUNDO"),
  modulo:property(f.properties,"MODULO","MÓDULO"), lote:property(f.properties,"LOTE","ID_LOTE","lote_nombre","name"),
};}
export function matchesFeature(r:Measurement,f:GeoFeature):boolean {
  const loc=featureLocation(f);
  return normalize(loc.lote)===normalize(r.lote) && (!loc.lugar || normalize(loc.lugar)===normalize(r.lugar)) && (!loc.fundo || normalize(loc.fundo)===normalize(r.fundo)) && (!loc.modulo || normalize(loc.modulo)===normalize(r.modulo));
}
export function validateGeo(raw:unknown):GeoCollection {
  const g=raw as GeoCollection;
  if(!g || g.type!=="FeatureCollection" || !Array.isArray(g.features) || !g.features.length || g.features.length>3000) throw new Error("Carga un GeoJSON de lotes (máximo 3000 polígonos).");
  let points=0;
  const scan=(c:unknown):void=>{if(!Array.isArray(c)||!c.length) throw new Error("Geometría vacía."); if(typeof c[0]==="number") {if(c.length<2||!Number.isFinite(c[0])||!Number.isFinite(c[1])||Math.abs(c[0])>180||Math.abs(c[1] as number)>90) throw new Error("Coordenadas inválidas."); if(++points>150000) throw new Error("El mapa es demasiado grande.");} else c.forEach(scan);};
  for(const f of g.features) {if(f.type!=="Feature" || !f.properties || !["Polygon","MultiPolygon"].includes(f.geometry?.type)) throw new Error("El archivo debe contener polígonos de lotes."); if(!featureLocation(f).lote) throw new Error("Cada polígono necesita una propiedad LOTE o ID_LOTE."); scan(f.geometry.coordinates); }
  return g;
}
export function isoWeek(value:string):number {const d=new Date(value+"T00:00:00Z");d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7));const start=new Date(Date.UTC(d.getUTCFullYear(),0,1)); return Math.ceil((((+d-+start)/86400000)+1)/7);}
export function todayLima():string {const p=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Lima",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date()); return ["year","month","day"].map(k=>p.find(v=>v.type===k)?.value).join("-");}
export function mean(nums:number[]):number|null {const n=nums.filter(Number.isFinite);return n.length?n.reduce((a,b)=>a+b,0)/n.length:null;}
export function reading(r:Measurement,metric="m1"):number|undefined {return r.kind==="HUMEDADES"?r.humedad:r.kind==="PRESIONES"?r.presion:(r as unknown as Record<string,number>)[metric];}
