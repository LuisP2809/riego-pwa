import {PRESSURE_SIDES,pressureLotLabel,type PressureSide,type PressureValues} from "@/lib/presiones";

type Props={ready:boolean;lots:readonly string[];unit?:string;values:PressureValues;onChange:(lot:string,side:PressureSide,value:string)=>void};

export default function PressureFields({ready,lots,unit,values,onChange}:Props){
  if(!ready)return <p className="pressure-prompt">Selecciona fecha, lugar, fundo y módulo para ingresar las presiones.</p>;
  if(!lots.length)return <p className="pressure-prompt">El módulo seleccionado no tiene lotes disponibles.</p>;
  return <section className="pressure-profile" aria-label="Presiones por lote y lado">
    <p className="pressure-caption">{lots.length} lotes del módulo. Completa las lecturas que quieras guardar.</p>
    {lots.map(lot=><fieldset className="pressure-lot" key={lot}>
      <legend>{pressureLotLabel(lot)}<small>{lot}</small></legend>
      <div className="pressure-heading"><span>Lado</span><span>Presión final{unit?` (${unit})`:""}</span></div>
      {PRESSURE_SIDES.map(side=><label className="field pressure-row" key={side}>
        <span>{side==="ESTE"?"Este":"Oeste"}</span>
        <input type="number" inputMode="decimal" step="any" min={0} value={values[lot]?.[side]??""} onChange={event=>onChange(lot,side,event.target.value)} aria-label={`Presión final de ${lot}, lado ${side==="ESTE"?"Este":"Oeste"}${unit?` (${unit})`:""}`}/>
      </label>)}
    </fieldset>)}
  </section>;
}
