import {humidityDepths,type HumidityValues} from "@/lib/humedades";

type Props={site:string;ready:boolean;values:HumidityValues;onChange:(depth:number,value:string)=>void};
export default function HumidityFields({site,ready,values,onChange}:Props){
  const depths=humidityDepths(site);
  if(!ready||!depths.length)return <p className="humidity-prompt">Selecciona fecha, sede, fundo, módulo y lote para ingresar las humedades.</p>;
  return <section className="humidity-profile" aria-label="Humedades por profundidad">
    <div className="humidity-heading"><span>Profundidad</span><span>Humedad (%)</span></div>
    {depths.map(depth=><label className="field humidity-row" key={depth}>
      <span>{depth} cm</span>
      <input type="number" inputMode="decimal" step="any" min={0} max={100} value={values[depth]??""} onChange={event=>onChange(depth,event.target.value)} aria-label={`Humedad a ${depth} cm (%)`} required/>
    </label>)}
  </section>;
}
