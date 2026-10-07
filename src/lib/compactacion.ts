import {recordSchema,type Measurement} from "./riego-model";

export const COMPACTION_POINTS=["P1","P2","P3","P4","P5","P6"] as const;
export const COMPACTION_READINGS=["m1","m2","m3"] as const;
export type CompactionPoint=typeof COMPACTION_POINTS[number];
export type CompactionReading=typeof COMPACTION_READINGS[number];
export type CompactionValues=Record<CompactionPoint,Record<CompactionReading,string>>;
export type CompactionContext=Pick<Measurement,"date"|"lugar"|"fundo"|"modulo"|"lote">;

export function emptyCompactionValues():CompactionValues{
  return Object.fromEntries(COMPACTION_POINTS.map(point=>[point,{m1:"",m2:"",m3:""}])) as CompactionValues;
}

export function makeCompactionRecords(context:CompactionContext,values:CompactionValues):Measurement[]{
  if([context.date,context.lugar,context.fundo,context.modulo,context.lote].some(value=>!value.trim()))throw new Error("Selecciona la fecha, sede, fundo, módulo y lote.");
  return COMPACTION_POINTS.map(puntos=>{
    const readings={} as Record<CompactionReading,number>;
    for(const reading of COMPACTION_READINGS){
      const value=String(values[puntos]?.[reading]??"").trim();
      if(!value)throw new Error(`Ingresa ${reading.toUpperCase()} del punto ${puntos}.`);
      const number=Number(value.replace(",","."));
      if(!Number.isFinite(number)||number<0)throw new Error(`${reading.toUpperCase()} del punto ${puntos} debe ser un número mayor o igual a 0.`);
      readings[reading]=number;
    }
    const result=recordSchema.safeParse({...context,id:crypto.randomUUID(),kind:"COMPACTACION",puntos,...readings});
    if(!result.success)throw new Error(result.error.issues[0].message);
    return result.data;
  });
}
