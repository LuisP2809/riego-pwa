import {featureLocation,isoWeek,normalize,type GeoCollection,type GeoFeature,type Kind,type Measurement} from "./riego-model";
import {humidityDepths} from "./humedades";
import type {FieldLocation} from "./locations";

export type RankLevel="module"|"lot";
export type CompactionMetric="average"|"m1"|"m2"|"m3";
export type AnalyticsFilters={site:string;farm:string;module:string;lot:string;from:string;to:string;level:RankLevel;metric:CompactionMetric;side:string};
export const defaultAnalyticsFilters=():AnalyticsFilters=>({site:"all",farm:"all",module:"all",lot:"all",from:"",to:"",level:"module",metric:"average",side:"all"});
export const RANGE_COLORS={red:"#ff0000",blue:"#6666ff",green:"#00b050",empty:"#dbe2e8"};
export type RangeBand={label:string;color:string};
export function rangeBands(kind:Kind):RangeBand[]{
  return kind==="COMPACTACION"?[{label:"0 a 40",color:RANGE_COLORS.red},{label:"Mayor de 40 hasta 60",color:RANGE_COLORS.blue},{label:"Mayor de 60",color:RANGE_COLORS.green}]:
    kind==="PRESIONES"?[{label:"Menor de 8",color:RANGE_COLORS.red},{label:"8 a 12",color:RANGE_COLORS.green},{label:"Mayor de 12",color:RANGE_COLORS.blue}]:[];
}
export function valueColor(kind:Kind,value:number|null|undefined):string{
  if(value==null||!Number.isFinite(value))return RANGE_COLORS.empty;
  if(kind==="COMPACTACION")return value<=40?RANGE_COLORS.red:value<=60?RANGE_COLORS.blue:RANGE_COLORS.green;
  if(kind==="PRESIONES")return value<8?RANGE_COLORS.red:value<=12?RANGE_COLORS.green:RANGE_COLORS.blue;
  return `hsl(145 60% ${92-Math.min(100,Math.max(0,value))*.45}%)`;
}
export function locationKey(location:FieldLocation,level:RankLevel="lot"):string{
  return JSON.stringify([location.lugar,location.fundo,location.modulo,...(level==="lot"?[location.lote]:[])].map(normalize));
}
export function updateAnalyticsFilters(filters:AnalyticsFilters,field:keyof AnalyticsFilters,value:string):AnalyticsFilters{
  return {...filters,[field]:value,...(field==="site"?{farm:"all",module:"all",lot:"all"}:field==="farm"?{module:"all",lot:"all"}:field==="module"?{lot:"all"}:{})};
}
export function locationInFilter(location:FieldLocation,filters:AnalyticsFilters):boolean{
  return (filters.site==="all"||normalize(location.lugar)===normalize(filters.site))&&
    (filters.farm==="all"||normalize(location.fundo)===normalize(filters.farm))&&
    (filters.module==="all"||normalize(location.modulo)===normalize(filters.module))&&
    (filters.lot==="all"||locationKey(location)===filters.lot);
}
export function filterAnalyticsRecords(records:readonly Measurement[],kind:Kind,filters:AnalyticsFilters):Measurement[]{
  return records.filter(record=>record.kind===kind&&locationInFilter(record,filters)&&(!filters.from||record.date>=filters.from)&&(!filters.to||record.date<=filters.to)&&
    (kind!=="PRESIONES"||filters.side==="all"||normalize(record.lado)===normalize(filters.side)));
}
export function filterAnalyticsGeo(geojson:GeoCollection,filters:AnalyticsFilters):GeoCollection{
  return {...geojson,features:geojson.features.filter(feature=>locationInFilter(featureLocation(feature),filters))};
}
function valuesFor(record:Measurement,kind:Kind,metric:string):number[]{
  const values=kind==="HUMEDADES"?[record.humedad]:kind==="PRESIONES"?[record.presion]:metric==="average"?[record.m1,record.m2,record.m3]:[(record as unknown as Record<string,number>)[metric]];
  return values.filter((value):value is number=>typeof value==="number"&&Number.isFinite(value));
}
export type RankingRow={key:string;location:FieldLocation;label:string;shortLabel:string;value:number;count:number};
export function buildRanking(records:readonly Measurement[],kind:Kind,level:RankLevel="lot",metric="average"):RankingRow[]{
  const groups=new Map<string,{location:FieldLocation;sum:number;count:number}>();
  for(const record of records){
    if(record.kind!==kind)continue;
    const values=valuesFor(record,kind,metric);if(!values.length)continue;
    const key=locationKey(record,level),group=groups.get(key)??{location:{lugar:record.lugar,fundo:record.fundo,modulo:record.modulo,lote:level==="lot"?record.lote:""},sum:0,count:0};
    values.forEach(value=>{group.sum+=value;group.count++;});groups.set(key,group);
  }
  return [...groups.entries()].map(([key,group])=>({key,location:group.location,label:[group.location.lugar,group.location.fundo,group.location.modulo,...(level==="lot"?[group.location.lote]:[])].join(" · "),shortLabel:level==="lot"?group.location.lote:group.location.modulo,value:group.sum/group.count,count:group.count}))
    .sort((a,b)=>b.value-a.value||a.label.localeCompare(b.label,"es",{numeric:true}));
}
export function featureAverage(feature:GeoFeature,rows:readonly RankingRow[],level:RankLevel="lot"):number|null{
  const location=featureLocation(feature),exact=rows.find(row=>row.key===locationKey(location,level));
  if(exact)return exact.value;
  if(location.lugar&&location.fundo&&location.modulo)return null;
  const matches=rows.filter(row=>(level==="module"||normalize(row.location.lote)===normalize(location.lote))&&(!location.lugar||normalize(row.location.lugar)===normalize(location.lugar))&&(!location.fundo||normalize(row.location.fundo)===normalize(location.fundo))&&(!location.modulo||normalize(row.location.modulo)===normalize(location.modulo)));
  const count=matches.reduce((total,row)=>total+row.count,0);return count?matches.reduce((total,row)=>total+row.value*row.count,0)/count:null;
}
export function analyticsDepths(records:readonly Measurement[],site:string):number[]{
  const known=site==="all"?[...new Set(records.filter(row=>row.kind==="HUMEDADES").flatMap(row=>humidityDepths(row.lugar)))]:[...humidityDepths(site)];
  return [...new Set([...known,...records.filter(row=>row.kind==="HUMEDADES"&&typeof row.prof==="number").map(row=>row.prof!)])].sort((a,b)=>a-b);
}
export type WeeklyHumidityRow={key:string;label:string;[key:string]:string|number|null};
export function humidityEvolutionScale(rows:readonly WeeklyHumidityRow[],depths:readonly number[]):{max:number;ticks:number[]}{
  let highest=45;
  for(const row of rows)for(const depth of depths){const value=row["d"+depth];if(typeof value==="number"&&Number.isFinite(value))highest=Math.max(highest,value);}
  const max=highest<=45?45:Math.ceil(highest/10)*10,step=max===45?5:10;
  return {max,ticks:Array.from({length:max/step+1},(_,index)=>index*step)};
}
function monday(date:string):string{
  const day=new Date(date+"T00:00:00Z");day.setUTCDate(day.getUTCDate()-((day.getUTCDay()+6)%7));return day.toISOString().slice(0,10);
}
export function weeklyHumidity(records:readonly Measurement[],depths:readonly number[]):WeeklyHumidityRow[]{
  const groups=new Map<string,Map<number,{sum:number;count:number}>>();
  for(const record of records){
    if(record.kind!=="HUMEDADES"||record.prof==null||record.humedad==null||!Number.isFinite(record.humedad))continue;
    const key=monday(record.date),week=groups.get(key)??new Map<number,{sum:number;count:number}>(),group=week.get(record.prof)??{sum:0,count:0};
    group.sum+=record.humedad;group.count++;week.set(record.prof,group);groups.set(key,week);
  }
  const keys=[...groups.keys()].sort();if(!keys.length)return [];
  const rows:WeeklyHumidityRow[]=[],end=new Date(keys.at(-1)!+"T00:00:00Z").getTime();
  for(const day=new Date(keys[0]+"T00:00:00Z");day.getTime()<=end;day.setUTCDate(day.getUTCDate()+7)){
    const key=day.toISOString().slice(0,10),thursday=new Date(day);thursday.setUTCDate(day.getUTCDate()+3);
    const row:WeeklyHumidityRow={key,label:`S${isoWeek(key)} · ${thursday.getUTCFullYear()}`};
    depths.forEach(depth=>{const group=groups.get(key)?.get(depth);row["d"+depth]=group?group.sum/group.count:null;});rows.push(row);
  }
  return rows;
}
export function humidityFarmMeans(records:readonly Measurement[]):{key:string;label:string;value:number}[]{
  const groups=new Map<string,{label:string;sum:number;count:number}>();
  for(const row of records){if(row.kind!=="HUMEDADES"||row.humedad==null||!Number.isFinite(row.humedad))continue;
    const key=JSON.stringify([normalize(row.lugar),normalize(row.fundo)]),group=groups.get(key)??{label:[row.lugar,row.fundo].join(" · "),sum:0,count:0};group.sum+=row.humedad;group.count++;groups.set(key,group);
  }
  return [...groups.entries()].map(([key,group])=>({key,label:group.label,value:group.sum/group.count})).sort((a,b)=>b.value-a.value||a.label.localeCompare(b.label,"es"));
}
export type HumidityMatrixRow={key:string;location:FieldLocation;values:Record<number,number|null>};
export function humidityModuleMatrix(records:readonly Measurement[],depths:readonly number[]):HumidityMatrixRow[]{
  const rows=new Map<string,{location:FieldLocation;groups:Map<number,{sum:number;count:number}>}>();
  for(const row of records){if(row.kind!=="HUMEDADES"||row.prof==null||row.humedad==null||!Number.isFinite(row.humedad))continue;
    const key=locationKey(row,"module"),item=rows.get(key)??{location:{lugar:row.lugar,fundo:row.fundo,modulo:row.modulo,lote:""},groups:new Map<number,{sum:number;count:number}>()},group=item.groups.get(row.prof)??{sum:0,count:0};group.sum+=row.humedad;group.count++;item.groups.set(row.prof,group);rows.set(key,item);
  }
  return [...rows.entries()].map(([key,row])=>({key,location:row.location,values:Object.fromEntries(depths.map(depth=>{const group=row.groups.get(depth);return [depth,group?group.sum/group.count:null];}))})).sort((a,b)=>[a.location.lugar,a.location.fundo,a.location.modulo].join("|").localeCompare([b.location.lugar,b.location.fundo,b.location.modulo].join("|"),"es",{numeric:true}));
}
