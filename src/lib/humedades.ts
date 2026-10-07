import {normalize,recordSchema,type Measurement} from "./riego-model";

export type HumidityValues=Record<number,string>;
export type HumidityContext=Pick<Measurement,"date"|"lugar"|"fundo"|"modulo"|"lote">;
const DEPTHS:Record<string,readonly number[]>={OLMOS:[20,40,60],MOTUPE:[20,40,60,80]};
export function humidityDepths(site:string):readonly number[]{return DEPTHS[normalize(site)]??[];}
export function emptyHumidityValues():HumidityValues{return {20:"",40:"",60:"",80:""};}
export function makeHumidityRecords(context:HumidityContext,values:HumidityValues):Measurement[]{
  const depths=humidityDepths(context.lugar);
  if(!depths.length)throw new Error("Selecciona la sede OLMOS o MOTUPE.");
  if([context.date,context.lugar,context.fundo,context.modulo,context.lote].some(v=>!v.trim()))throw new Error("Selecciona la fecha, sede, fundo, módulo y lote.");
  return depths.map(prof=>{
    const value=String(values[prof]??"").trim();
    if(!value)throw new Error(`Ingresa la humedad a ${prof} cm.`);
    const humedad=Number(value.replace(",","."));
    if(!Number.isFinite(humedad)||humedad<0||humedad>100)throw new Error(`La humedad a ${prof} cm debe estar entre 0 y 100%.`);
    const result=recordSchema.safeParse({...context,id:crypto.randomUUID(),kind:"HUMEDADES",prof,humedad});
    if(!result.success)throw new Error(result.error.issues[0].message);
    return result.data;
  });
}
