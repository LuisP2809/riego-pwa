import {normalize,recordSchema,type Measurement} from "./riego-model";

export const WATER_FILTERS:Record<string,readonly string[]>={
  OLMOS:["FILTRADO PESQUERA","FILTRADO CHOLOCAL"],
  MOTUPE:["FRANCO","CHOLOQUE","PALACIOS","CHOC CHOC","ANDINA"],
};
export const WATER_PARAMETERS=[{key:"ph",label:"pH"},{key:"ce",label:"CE"},{key:"na",label:"Na"},{key:"ca",label:"Ca"}] as const;
export type WaterValues=Record<typeof WATER_PARAMETERS[number]["key"],string>;
export type WaterContext={date:string;lugar:string;filtrado:string};
export const waterFilters=(site:string):readonly string[]=>WATER_FILTERS[normalize(site)]??[];
export const emptyWaterValues=():WaterValues=>({ph:"",ce:"",na:"",ca:""});
export function changeWaterContext(context:WaterContext,key:keyof WaterContext,value:string):WaterContext{
  return {...context,[key]:value,...(key==="lugar"?{filtrado:""}:{})};
}
export function makeWaterQualityRecord(context:WaterContext,values:WaterValues):Measurement{
  if(!context.date.trim()||!context.lugar.trim()||!context.filtrado.trim())throw new Error("Selecciona fecha, sede y filtrado.");
  const filtrado=waterFilters(context.lugar).find(value=>normalize(value)===normalize(context.filtrado));
  if(!filtrado)throw new Error("Selecciona un filtrado de la sede elegida.");
  const readings:Record<string,number>={};
  for(const parameter of WATER_PARAMETERS){
    const value=String(values[parameter.key]??"").trim();if(!value)throw new Error(`Ingresa ${parameter.label}.`);
    const number=Number(value.replace(",","."));if(!Number.isFinite(number)||number<0)throw new Error(`${parameter.label} debe ser un número mayor o igual a cero.`);
    readings[parameter.key]=number;
  }
  const result=recordSchema.safeParse({...context,lugar:normalize(context.lugar),filtrado,...readings,id:crypto.randomUUID(),kind:"CALIDAD_AGUA"});
  if(!result.success)throw new Error(result.error.issues[0].message);
  return result.data;
}
