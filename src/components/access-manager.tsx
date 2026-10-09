import {useCallback,useEffect,useRef,useState,type FormEvent} from "react";
import {Copy,Download,Pencil,QrCode,RefreshCw,Trash2} from "lucide-react";
import QRCode from "qrcode";
import {toast} from "sonner";
import {api,AccessError} from "@/lib/api";
import {accessLink} from "@/lib/access";
import {shareQr} from "@/lib/native";
import {ACCESS_STATUS_LABELS,accessName,accessReference,filterAccesses,isCurrentAccess,normalizeAccessName,type AccessFilter,type ManagedAccess} from "@/lib/managed-access";

const dateLabel=(value:number)=>value?new Intl.DateTimeFormat("es-PE",{timeZone:"America/Lima",dateStyle:"short",timeStyle:"short"}).format(value):"Fecha anterior no disponible";
type GeneratedInvite={id:string;name:string;code:string;expiresAt:number;qr:string;url:string};
type ListProps={rows:ManagedAccess[];disabled:boolean;onRename:(row:ManagedAccess)=>void;onAction:(row:ManagedAccess)=>void;onRemove:(row:ManagedAccess)=>void};
type Confirmation={access:ManagedAccess;action:"access_cancel"|"access_revoke"|"access_hide"};

export function AccessList({rows,disabled,onRename,onAction,onRemove}:ListProps){
  if(!rows.length)return <p className="access-empty">No hay accesos que coincidan con esta selección.</p>;
  return <ul className="access-list">{rows.map(row=><li className="managed-access" key={row.id}>
    <div className="managed-access-heading"><strong>{accessName(row)}</strong><span className={`access-badge ${row.status}`}>{ACCESS_STATUS_LABELS[row.status]}</span></div>
    <span className="small access-reference">Referencia {accessReference(row.id)}</span>
    <p className="small">{row.kind==="invitation"?`Creado: ${dateLabel(row.createdAt)}`:`Activado: ${dateLabel(row.activatedAt)}`}</p>
    {row.status==="pending"&&<p className="small">El QR vence: {dateLabel(row.expiresAt)}</p>}
    <div className="access-row-actions"><button className="secondary" disabled={disabled} onClick={()=>onRename(row)} aria-label={`${row.name?"Editar nombre":"Poner nombre"} de ${accessReference(row.id)}`}><Pencil size={15}/>{row.name?"Editar nombre":"Poner nombre"}</button>
      {isCurrentAccess(row)?<button className="secondary access-danger" disabled={disabled} onClick={()=>onAction(row)}>{row.status==="pending"?"Cancelar QR":"Retirar acceso"}</button>:<button className="secondary access-danger" disabled={disabled} onClick={()=>onRemove(row)} aria-label={`Eliminar del listado a ${accessName(row)} · ${accessReference(row.id)}`}><Trash2 size={15}/>Eliminar del listado</button>}
    </div>
  </li>)}</ul>;
}

type Props={open:boolean;online:boolean;disabled:boolean;endpoint:string;onAccessDenied:(message:string)=>void};
export default function AccessManager({open,online,disabled,endpoint,onAccessDenied}:Props){
  const [name,setName]=useState(""),[rows,setRows]=useState<ManagedAccess[]>([]),[ready,setReady]=useState(false),[loading,setLoading]=useState(false),[working,setWorking]=useState(false),[problem,setProblem]=useState("");
  const [invite,setInvite]=useState<GeneratedInvite|null>(null),[filter,setFilter]=useState<AccessFilter>("current"),[query,setQuery]=useState("");
  const [editing,setEditing]=useState<ManagedAccess|null>(null),[editName,setEditName]=useState(""),[confirmation,setConfirmation]=useState<Confirmation|null>(null);
  const denied=useRef(onAccessDenied),requestNumber=useRef(0);denied.current=onAccessDenied;
  const handleError=useCallback((error:unknown)=>{const message=(error as Error).message;setProblem(message);if(error instanceof AccessError)denied.current(message);},[]);
  const load=useCallback(async()=>{
    const request=++requestNumber.current;setLoading(true);setProblem("");
    try{const result=await api<{accesses:ManagedAccess[]}>("accesses");if(request===requestNumber.current){setRows(result.accesses);setReady(true);setInvite(current=>current&&result.accesses.some(row=>row.id===current.id&&row.status==="pending")?current:null);}}
    catch(error){if(request===requestNumber.current){setReady(false);handleError(error);}}
    finally{if(request===requestNumber.current)setLoading(false);}
  },[handleError]);
  useEffect(()=>{if(open&&online)void load();return()=>{requestNumber.current++;};},[open,online,load]);
  const blocked=disabled||working||loading||!online;
  async function create(event:FormEvent){
    event.preventDefault();if(blocked||!ready)return;setWorking(true);setProblem("");
    try{
      const label=normalizeAccessName(name),result=await api<{id:string;name:string;code:string;expiresAt:number}>("invite",{name:label});
      const url=accessLink(endpoint,result.code),qr=await QRCode.toDataURL(url,{width:280,margin:2,color:{dark:"#064d40",light:"#ffffff"}});
      await load();setInvite({...result,url,qr});setName("");toast.success(`Acceso creado para ${result.name}.`);
    }catch(error){handleError(error);}finally{setWorking(false);}
  }
  async function rename(event:FormEvent){
    event.preventDefault();if(blocked||!editing)return;setWorking(true);setProblem("");
    try{const result=await api<{access:ManagedAccess}>("access_rename",{id:editing.id,name:normalizeAccessName(editName)});setRows(current=>current.map(row=>row.id===result.access.id?result.access:row));setInvite(current=>current?.id===result.access.id?{...current,name:result.access.name}:current);setEditing(null);toast.success("Nombre guardado.");}
    catch(error){handleError(error);}finally{setWorking(false);}
  }
  async function confirmAction(){
    if(blocked||!confirmation)return;setWorking(true);setProblem("");
    try{
      if(confirmation.action==="access_hide"){
        const result=await api<{id:string}>("access_hide",{id:confirmation.access.id});setRows(current=>current.filter(row=>row.id!==result.id));toast.success("Acceso eliminado del listado.");
      }else{
        const result=await api<{access:ManagedAccess}>(confirmation.action,{id:confirmation.access.id});setRows(current=>current.map(row=>row.id===result.access.id?result.access:row));toast.success(result.access.status==="cancelled"?"QR cancelado.":"Acceso retirado.");
      }
      requestNumber.current++;setLoading(false);setInvite(current=>current?.id===confirmation.access.id?null:current);setConfirmation(null);
    }
    catch(error){handleError(error);setConfirmation(null);try{const result=await api<{accesses:ManagedAccess[]}>("accesses");setRows(result.accesses);}catch{/* Keep the original error visible. */}}
    finally{setWorking(false);}
  }
  const copy=(value:string)=>void navigator.clipboard.writeText(value).then(()=>toast.success("Copiado.")).catch(error=>toast.error((error as Error).message));
  return <section className="access-manager">
    {!online&&<p className="access-info" role="status">Conéctate para crear, nombrar, retirar o eliminar accesos del listado.</p>}
    {problem&&<p className="access-problem" role="alert">{problem}</p>}
    <form className="access-create" onSubmit={create}><h3>Crear un acceso</h3><p className="small">Escribe a quién entregarás el QR. Cada código activa un celular y vence en 24 horas.</p>
      <label className="field"><span>Nombre de la persona</span><input value={name} onChange={event=>setName(event.target.value)} placeholder="Ejemplo: Juan Pérez" minLength={2} maxLength={80} required disabled={blocked} autoComplete="off"/></label>
      <button className="primary full" disabled={blocked||!ready||name.trim().length<2}><QrCode size={18}/>{working?"Procesando…":"Generar código y QR"}</button>
    </form>
    {invite&&<div className="invite"><strong>Acceso para {invite.name}</strong><img src={invite.qr} width={240} height={240} alt={`QR de acceso para ${invite.name}`}/><strong className="invite-code">{invite.code.match(/.{1,4}/g)?.join(" ")}</strong><span className="small">Vence: {dateLabel(invite.expiresAt)}</span>
      <div className="invite-actions"><button className="secondary" onClick={()=>copy(invite.code)}><Copy size={16}/>Copiar código</button><button className="secondary" onClick={()=>copy(invite.url)}><Copy size={16}/>Copiar acceso completo</button><button className="secondary" onClick={()=>void shareQr(invite.qr,invite.url).catch(error=>toast.error(error.message))}><Download size={16}/>Compartir QR</button></div>
      <p className="small">En el otro celular instala Riego y elige Tengo un código o QR. El QR incluye la conexión. Comparte este acceso solo con la persona indicada.</p>
    </div>}
    <div className="access-directory"><div className="managed-access-heading"><h3>Accesos de tu equipo</h3><button className="secondary" disabled={blocked} onClick={()=>void load()}><RefreshCw size={16} className={loading?"spinning":""}/>{loading?"Cargando…":"Actualizar"}</button></div>
      <p className="small">{rows.filter(row=>row.status==="pending").length} pendientes · {rows.filter(row=>row.status==="active").length} activos</p>
      <p className="small">Los accesos anteriores pueden aparecer sin nombre. Identifícalos por la fecha o la referencia que muestra ese celular y pulsa Poner nombre.</p>
      <div className="access-filters"><label className="field"><span>Buscar persona o referencia</span><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Nombre o referencia"/></label><label className="field"><span>Mostrar</span><select value={filter} onChange={event=>setFilter(event.target.value as AccessFilter)}><option value="current">Activos y pendientes</option><option value="pending">Pendientes</option><option value="active">Activos</option><option value="inactive">Finalizados</option><option value="all">Todos</option></select></label></div>
      <p className="small">En Finalizados puedes eliminar del listado los accesos retirados, cancelados, vencidos o cerrados.</p>
      {editing&&<form className="access-edit" onSubmit={rename}><label className="field"><span>Nombre del acceso {accessReference(editing.id)}</span><input value={editName} onChange={event=>setEditName(event.target.value)} minLength={2} maxLength={80} required disabled={blocked} autoFocus/></label><div className="access-row-actions"><button className="primary" disabled={blocked}>Guardar nombre</button><button type="button" className="secondary" disabled={working} onClick={()=>setEditing(null)}>Volver</button></div></form>}
      {confirmation&&<div className="access-confirm" role="alert"><strong>{confirmation.action==="access_hide"?"Eliminar del listado a":confirmation.action==="access_cancel"?"Cancelar QR de":"Retirar acceso de"} {accessName(confirmation.access)} · {accessReference(confirmation.access.id)}</strong><p className="small">{confirmation.action==="access_hide"?"Dejará de aparecer en la lista. Su acceso seguirá bloqueado y las mediciones guardadas se conservarán.":confirmation.action==="access_cancel"?"Este código y su QR dejarán de servir para activar un celular.":"Este celular dejará de conectar con Drive. Riego actualizado bloqueará la entrada cuando compruebe el retiro con internet. Los datos ya descargados no se borran del celular."}</p><div className="access-row-actions"><button className="primary access-danger-button" disabled={blocked} onClick={()=>void confirmAction()}>{confirmation.action==="access_hide"?"Confirmar eliminación":confirmation.action==="access_cancel"?"Confirmar cancelación":"Confirmar retiro"}</button><button className="secondary" disabled={working} onClick={()=>setConfirmation(null)}>Volver</button></div></div>}
      {ready&&<AccessList rows={filterAccesses(rows,filter,query)} disabled={blocked||Boolean(editing)||Boolean(confirmation)} onRename={row=>{setEditing(row);setEditName(row.name);}} onAction={row=>setConfirmation({access:row,action:row.status==="pending"?"access_cancel":"access_revoke"})} onRemove={row=>setConfirmation({access:row,action:"access_hide"})}/>}
      <p className="small access-footnote">La lista registra códigos creados y celulares activados. No detecta a quién se reenvió una imagen del QR. Para devolver un acceso retirado, crea un código nuevo.</p>
    </div>
  </section>;
}
