import {COMPACTION_POINTS,COMPACTION_READINGS,type CompactionPoint,type CompactionReading,type CompactionValues} from "@/lib/compactacion";

type Props={ready:boolean;unit?:string;values:CompactionValues;onChange:(point:CompactionPoint,reading:CompactionReading,value:string)=>void};

export default function CompactionFields({ready,unit,values,onChange}:Props){
  if(!ready)return <p className="compaction-prompt">Selecciona fecha, lugar, fundo, módulo y lote para ingresar la compactación.</p>;
  return <section className="compaction-profile" aria-label="Compactación por punto">
    {COMPACTION_POINTS.map((point,index)=><fieldset className="compaction-point" key={point}>
      <legend>Punto {index+1} ({point})</legend>
      <div className="compaction-readings">
        {COMPACTION_READINGS.map(reading=><label className="field" key={reading}>
          <span>{reading.toUpperCase()}{unit?` (${unit})`:""}</span>
          <input type="number" inputMode="decimal" step="any" min={0} value={values[point][reading]} onChange={event=>onChange(point,reading,event.target.value)} aria-label={`${reading.toUpperCase()} del punto ${point}${unit?` (${unit})`:""}`} required/>
        </label>)}
      </div>
    </fieldset>)}
  </section>;
}
