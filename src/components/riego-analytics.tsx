import {useMemo} from "react";
import {LineChart,Line,BarChart,Bar,Cell,LabelList,XAxis,YAxis,CartesianGrid,Tooltip,Legend,ResponsiveContainer} from "recharts";
import Picker from "@/components/field-picker";
import FieldMap from "@/components/riego-map";
import RangeLegend from "@/components/range-legend";
import {KINDS,LABELS,featureLocation,normalize,type Kind,type Measurement,type GeoCollection} from "@/lib/riego-model";
import {locationOptions} from "@/lib/locations";
import {analyticsDepths,weeklyHumidity,humidityEvolutionScale,humidityFarmMeans,humidityModuleMatrix,buildRanking,filterAnalyticsRecords,filterAnalyticsGeo,locationKey,valueColor,updateAnalyticsFilters,type AnalyticsFilters,type RankingRow} from "@/lib/riego-analytics";

type Props={records:Measurement[];geojson?:GeoCollection;units:Record<string,string>;kind:Kind;onKindChange:(kind:Kind)=>void;filters:AnalyticsFilters;onFiltersChange:(filters:AnalyticsFilters)=>void};
const DEPTH_COLORS:Record<number,string>={20:"#6666ff",40:"#4c1785",60:"#ee6b2f",80:"#00a05c"};
export function numberLabel(value:number|null|undefined){return value==null?"—":value.toLocaleString("es-PE",{maximumFractionDigits:2});}
function NoData(){return <div className="analytics-empty"><strong>Sin datos en este filtro</strong><p>Selecciona otro periodo o guarda una evaluación para ver sus resultados.</p></div>;}
function RankTick({x=0,y=0,payload,rows}:{x?:number;y?:number;payload?:{value:string};rows:RankingRow[]}){
  const row=rows.find(item=>item.key===payload?.value);if(!row)return null;
  const farm=row.location.fundo.length>15?row.location.fundo.slice(0,14)+"…":row.location.fundo;
  return <g transform={`translate(${x},${y})`}><text textAnchor="end" fill="#465f6f" fontSize={11} dy={-3}>{row.shortLabel}</text><text textAnchor="end" fill="#7a8c98" fontSize={9} dy={10}>{farm}</text></g>;
}
export function HumidityMatrix({records,depths}:{records:Measurement[];depths:number[]}){
  const rows=humidityModuleMatrix(records,depths);
  if(!rows.length)return <NoData/>;
  return <div className="humidity-matrix-scroll"><table className="humidity-matrix"><caption>Humedad promedio (%) por módulo y profundidad</caption><thead><tr><th scope="col">Módulo</th>{depths.map(depth=><th scope="col" key={depth}>{depth} cm</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.key}><th scope="row"><strong>{row.location.modulo}</strong><small>{row.location.lugar} · {row.location.fundo}</small></th>{depths.map(depth=>{const value=row.values[depth];return <td key={depth} style={{backgroundColor:valueColor("HUMEDADES",value),color:value!=null&&value>65?"white":"#243344"}}>{numberLabel(value)}</td>;})}</tr>)}</tbody></table></div>;
}
export function RankingValues({rows,unit}:{rows:RankingRow[];unit:string}){
  return <details className="ranking-values"><summary>Ver promedios del ranking</summary><div className="ranking-values-scroll"><table><thead><tr><th scope="col">Ubicación</th><th scope="col">Promedio{unit?` (${unit})`:""}</th></tr></thead><tbody>{rows.map(row=><tr key={row.key}><th scope="row">{row.label}</th><td>{numberLabel(row.value)}</td></tr>)}</tbody></table></div></details>;
}

export default function RiegoAnalytics({records,geojson,units,kind,onKindChange,filters,onFiltersChange}:Props){
  const locations=useMemo(()=>[...(geojson?.features.map(featureLocation)??[]),...records.map(record=>({lugar:record.lugar,fundo:record.fundo,modulo:record.modulo,lote:record.lote}))],[geojson,records]);
  const selected=useMemo(()=>filterAnalyticsRecords(records,kind,filters),[records,kind,filters]);
  const filteredGeo=useMemo(()=>geojson?filterAnalyticsGeo(geojson,filters):undefined,[geojson,filters]);
  const depths=useMemo(()=>analyticsDepths(selected,filters.site),[selected,filters.site]);
  const weeks=useMemo(()=>weeklyHumidity(selected,depths),[selected,depths]);
  const humidityScale=useMemo(()=>humidityEvolutionScale(weeks,depths),[weeks,depths]);
  const farms=useMemo(()=>humidityFarmMeans(selected),[selected]);
  const rankings=useMemo(()=>buildRanking(selected,kind,filters.level,filters.metric),[selected,kind,filters.level,filters.metric]);
  const update=(field:keyof AnalyticsFilters,value:string)=>onFiltersChange(updateAnalyticsFilters(filters,field,value));
  const options=(values:string[],label:string)=>[{value:"all",label},...values.map(value=>({value,label:value}))];
  const context={lugar:filters.site==="all"?"":filters.site,fundo:filters.farm==="all"?"":filters.farm,modulo:filters.module==="all"?"":filters.module,lote:""};
  const scopedLocations=locations.filter(location=>(filters.site==="all"||normalize(location.lugar)===normalize(filters.site))&&(filters.farm==="all"||normalize(location.fundo)===normalize(filters.farm)));
  const farmOptions=filters.site==="all"?[...new Set(locations.map(location=>location.fundo))].sort():locationOptions(locations,context,"fundo");
  const moduleOptions=[...new Set(scopedLocations.map(location=>location.modulo).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"es",{numeric:true}));
  const lotOptions=[...new Map(scopedLocations.filter(location=>filters.module==="all"||normalize(location.modulo)===normalize(filters.module)).map(location=>[locationKey(location),location])).entries()].sort(([,a],[,b])=>a.lote.localeCompare(b.lote,"es",{numeric:true}));
  const unit=kind==="HUMEDADES"?"%":kind==="COMPACTACION"?units.compactacion??"":units.presion??"";
  const sideOptions=[...new Set(["ESTE","OESTE",...records.filter(record=>record.kind==="PRESIONES").map(record=>record.lado??"")].filter(Boolean))];
  return <div className="riego-analytics">
    <section className="panel analysis-panel"><div className="panel-heading between"><div><p className="eyebrow">ANÁLISIS DE CAMPO</p><h2>{LABELS[kind]}</h2></div><span className="count-chip">{selected.length} registros</span></div>
      <div className="filter-grid analytics-filter-grid">
        <Picker label="Apartado" value={kind} onChange={value=>onKindChange(value as Kind)} options={KINDS.map(value=>({value,label:LABELS[value]}))}/>
        <Picker label="Sede" value={filters.site} onChange={value=>update("site",value)} options={options([...new Set(["OLMOS","MOTUPE",...locations.map(location=>location.lugar)])],"Todas las sedes")}/>
        <Picker label="Fundo" value={filters.farm} onChange={value=>update("farm",value)} options={options(farmOptions,"Todos los fundos")}/>
        <Picker label="Módulo" value={filters.module} onChange={value=>update("module",value)} options={options(moduleOptions,"Todos los módulos")}/>
        <Picker label="Lote" value={filters.lot} onChange={value=>update("lot",value)} options={[{value:"all",label:"Todos los lotes"},...lotOptions.map(([value,location])=>({value,label:[location.modulo,location.lote,location.fundo].join(" · ")}))]}/>
        <label className="field"><span>Desde</span><input type="date" value={filters.from} max={filters.to||undefined} onChange={event=>update("from",event.target.value)}/></label>
        <label className="field"><span>Hasta</span><input type="date" value={filters.to} min={filters.from||undefined} onChange={event=>update("to",event.target.value)}/></label>
        {kind!=="HUMEDADES"&&<Picker label="Ranking y mapa" value={filters.level} onChange={value=>update("level",value)} options={[{value:"module",label:"Por módulo"},{value:"lot",label:"Por lote"}]}/>}
        {kind==="COMPACTACION"&&<Picker label="Lecturas" value={filters.metric} onChange={value=>update("metric",value)} options={[{value:"average",label:"Promedio M1, M2 y M3"},{value:"m1",label:"M1"},{value:"m2",label:"M2"},{value:"m3",label:"M3"}]}/>}
        {kind==="PRESIONES"&&<Picker label="Lado" value={filters.side} onChange={value=>update("side",value)} options={options(sideOptions,"Todos los lados")}/>}
      </div>
      <p className="analytics-period">Promedios de las lecturas del periodo seleccionado{unit?` · ${unit}`:""}.</p>
      {kind!=="HUMEDADES"&&<RangeLegend kind={kind}/>}
    </section>
    {kind==="HUMEDADES"?<div className="humidity-charts">
      <section className="panel chart-panel humidity-evolution"><h3>Evolución semanal por profundidad</h3><p className="chart-caption">Promedio semanal de humedad (%).</p>{weeks.length?<div className="analytics-chart" aria-label="Evolución semanal de humedad"><ResponsiveContainer width="100%" height="100%"><LineChart data={weeks} margin={{top:16,right:14,left:0,bottom:8}}><CartesianGrid stroke="#e5ecef" vertical={false}/><XAxis dataKey="label" tick={{fontSize:11}} minTickGap={18}/><YAxis domain={[0,humidityScale.max]} ticks={humidityScale.ticks} allowDecimals={false} width={36} tick={{fontSize:11}}/><Tooltip formatter={value=>`${numberLabel(Number(value))} %`}/><Legend wrapperStyle={{fontSize:12}}/>{depths.map((depth,index)=><Line key={depth} type="monotone" dataKey={"d"+depth} name={`${depth} cm`} stroke={DEPTH_COLORS[depth]??["#3179ba","#805bc3"][index%2]} strokeWidth={2.5} dot={{r:3}} connectNulls={false} isAnimationActive={false}/>)}</LineChart></ResponsiveContainer></div>:<NoData/>}</section>
      <section className="panel chart-panel"><h3>Promedio por fundo</h3><p className="chart-caption">Humedad (%) en las profundidades registradas.</p>{farms.length?<div className="analytics-chart-scroll"><div className="analytics-chart" style={{height:Math.max(260,farms.length*38+40)}} aria-label="Humedad promedio por fundo"><ResponsiveContainer width="100%" height="100%"><BarChart data={farms} layout="vertical" margin={{top:10,right:45,left:0,bottom:5}}><CartesianGrid stroke="#e5ecef" horizontal={false}/><XAxis type="number" domain={[0,100]} tick={{fontSize:11}}/><YAxis type="category" dataKey="label" width={110} tick={{fontSize:10}} tickFormatter={(value:string)=>value.split(" · ").at(-1)??value}/><Tooltip formatter={value=>`${numberLabel(Number(value))} %`}/><Bar dataKey="value" name="Humedad" fill="#00a05c" barSize={20} isAnimationActive={false}><LabelList dataKey="value" position="right" fontSize={10} formatter={value=>numberLabel(Number(value))}/></Bar></BarChart></ResponsiveContainer></div></div>:<NoData/>}</section>
      <section className="panel chart-panel"><h3>Matriz módulo–profundidad</h3><p className="chart-caption">Humedad promedio (%). Cada celda corresponde al periodo filtrado.</p><HumidityMatrix records={selected} depths={depths}/></section>
    </div>:<div className="ranking-dashboard">
      <section className="panel ranking-map-panel"><div className="ranking-panel-heading"><h3>Mapa de {kind==="COMPACTACION"?"compactación":"presiones"}</h3><p>Promedio por {filters.level==="module"?"módulo":"lote"}.</p></div>{filteredGeo?.features.length?<FieldMap geojson={filteredGeo} records={selected} kind={kind} metric={filters.metric} unit={unit} level={filters.level} basemap={false}/>:<div className="analytics-empty"><strong>Sin lotes en este filtro</strong><p>Selecciona otra ubicación para consultar el mapa.</p></div>}<p className="map-note">Mapa y ranking comparten filtros, promedios y límites de color.</p></section>
      <section className="panel chart-panel ranking-chart-panel"><h3>Ranking por {filters.level==="module"?"módulo":"lote"}</h3><p className="chart-caption">Ordenado de mayor a menor promedio{unit?` (${unit})`:""}.</p>{rankings.length?<><div className="analytics-chart-scroll"><div className="analytics-chart ranking-chart" style={{height:Math.max(300,rankings.length*42+50)}} aria-label={`Ranking de ${LABELS[kind].toLowerCase()}`}><ResponsiveContainer width="100%" height="100%"><BarChart data={rankings} layout="vertical" margin={{top:10,right:48,left:0,bottom:5}}><CartesianGrid stroke="#e5ecef" horizontal={false}/><XAxis type="number" domain={[0,"auto"]} tick={{fontSize:11}}/><YAxis type="category" dataKey="key" width={102} tick={<RankTick rows={rankings}/>} interval={0}/><Tooltip labelFormatter={(_label,payload)=>payload[0]?.payload?.label??""} formatter={value=>`${numberLabel(Number(value))}${unit?" "+unit:""}`}/><Bar dataKey="value" name="Promedio" barSize={23} isAnimationActive={false}>{rankings.map(row=><Cell key={row.key} fill={valueColor(kind,row.value)}/>)}<LabelList dataKey="value" position="right" fontSize={10} formatter={value=>numberLabel(Number(value))}/></Bar></BarChart></ResponsiveContainer></div></div><RankingValues rows={rankings} unit={unit}/></>:<NoData/>}</section>
    </div>}
  </div>;
}
