import {rangeBands} from "@/lib/riego-analytics";
import type {Kind} from "@/lib/riego-model";

export default function RangeLegend({kind}:{kind:Kind}){
  return <div className="range-legend" aria-label={`Límites de color de ${kind==="COMPACTACION"?"compactación":"presión"}`}>
    {rangeBands(kind).map(band=><span key={band.label}><i style={{backgroundColor:band.color}} aria-hidden="true"/>{band.label}</span>)}
    <span><i style={{backgroundColor:"#dbe2e8"}} aria-hidden="true"/>Sin datos</span>
  </div>;
}
