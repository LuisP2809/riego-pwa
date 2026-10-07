import {locationOptions,type FieldLocation,type LocationField} from "@/lib/locations";

type Props={rows:readonly FieldLocation[];values:Record<string,string>;onChange:(field:LocationField,value:string)=>void};
const FIELDS:{key:LocationField;label:string;placeholder:string}[]=[
  {key:"fundo",label:"Fundo",placeholder:"Selecciona un fundo"},
  {key:"modulo",label:"Módulo",placeholder:"Selecciona un módulo"},
  {key:"lote",label:"Lote",placeholder:"Selecciona un lote"},
];

export default function LocationFields({rows,values,onChange}:Props){
  return <>{FIELDS.map(({key,label,placeholder})=>
    <label className={`field ${key==="lote"?"wide":""}`} key={key}>
      <span>{label}</span>
      <select name={key} aria-label={label} value={values[key]} required
        disabled={!values.lugar||(key!=="fundo"&&!values.fundo)||(key==="lote"&&!values.modulo)}
        onChange={event=>onChange(key,event.target.value)}>
        <option value="">{placeholder}</option>
        {locationOptions(rows,values,key).map(value=><option key={value} value={value}>{value}</option>)}
      </select>
    </label>
  )}</>;
}
