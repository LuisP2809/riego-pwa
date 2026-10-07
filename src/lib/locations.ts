import {normalize,type Measurement} from "./riego-model";

export type FieldLocation=Pick<Measurement,"lugar"|"fundo"|"modulo"|"lote">;
export type LocationField="fundo"|"modulo"|"lote";

export function locationOptions(rows:readonly FieldLocation[],values:Record<string,string>,field:LocationField):string[]{
  if(!values.lugar||(field!=="fundo"&&!values.fundo)||(field==="lote"&&!values.modulo))return [];
  return [...new Set(rows.filter(row=>
    normalize(row.lugar)===normalize(values.lugar)&&
    (field==="fundo"||normalize(row.fundo)===normalize(values.fundo))&&
    (field!=="lote"||normalize(row.modulo)===normalize(values.modulo))
  ).map(row=>row[field]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"es",{numeric:true}));
}

export function changeLocation(values:Record<string,string>,field:LocationField|"lugar",value:string):Record<string,string>{
  return {...values,[field]:value,
    ...(field==="lugar"?{fundo:"",modulo:"",lote:""}:field==="fundo"?{modulo:"",lote:""}:field==="modulo"?{lote:""}:{})};
}
