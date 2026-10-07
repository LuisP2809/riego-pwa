import {locationOptions,type FieldLocation} from "./locations";
import {recordSchema,type Measurement} from "./riego-model";

export const PRESSURE_SIDES=["ESTE","OESTE"] as const;
export type PressureSide=typeof PRESSURE_SIDES[number];
export type PressureValues=Record<string,Partial<Record<PressureSide,string>>>;
export type PressureContext=Pick<Measurement,"date"|"lugar"|"fundo"|"modulo">;

export function modulePressureLots(rows:readonly FieldLocation[],context:PressureContext):string[]{
  return locationOptions(rows,context,"lote");
}

export function pressureLotLabel(lot:string):string{
  const number=lot.match(/^M\d+T\d+(?:-|L)(\d+[A-Z]*)$/i)?.[1];
  return number?`Lote ${number}`:`Lote ${lot}`;
}

export function makePressureRecords(context:PressureContext,lots:readonly string[],values:PressureValues):Measurement[]{
  if([context.date,context.lugar,context.fundo,context.modulo].some(value=>!value.trim()))throw new Error("Selecciona la fecha, sede, fundo y módulo.");
  const selectedLots=[...new Set(lots.map(lot=>lot.trim()).filter(Boolean))];
  if(!selectedLots.length)throw new Error("El módulo seleccionado no tiene lotes disponibles.");
  const records:Measurement[]=[];
  for(const lote of selectedLots)for(const lado of PRESSURE_SIDES){
    const value=String(values[lote]?.[lado]??"").trim();
    if(!value)continue;
    const presion=Number(value.replace(",","."));
    if(!Number.isFinite(presion)||presion<0)throw new Error(`La presión del lado ${lado==="ESTE"?"Este":"Oeste"} de ${pressureLotLabel(lote)} debe ser un número mayor o igual a 0.`);
    const result=recordSchema.safeParse({...context,id:crypto.randomUUID(),kind:"PRESIONES",lote,lado,presion});
    if(!result.success)throw new Error(result.error.issues[0].message);
    records.push(result.data);
  }
  if(!records.length)throw new Error("Ingresa al menos una presión final.");
  return records;
}
