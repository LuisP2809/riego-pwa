import {Capacitor,CapacitorHttp} from "@capacitor/core";
import geoText from "../../data/lotes-mapa.geojson?raw";
import {recordSchema,validateGeo,type Measurement,type GeoCollection} from "./riego-model";
import {cached,cache,clearAccessState} from "./riego-offline";
import {endpointUrl} from "./access";
import {DriveProtocolError,parseDriveReply,parseDriveGreeting,postDriveNative,verifyDriveNative} from "./drive-transport";
import {RIEGO_ENDPOINT,APP_VERSION} from "./connection";
import {managedAccessSchema,normalizeAccessName} from "./managed-access";

export type Snapshot={records:Measurement[];geojson:GeoCollection;owner:boolean;sourceConnected:boolean;lastSync:string;units:Record<string,string>;scriptUrl?:string;profileName?:string;waterQualityAvailable?:boolean;accessId?:string};
type Session={endpoint:string;token:string;owner:boolean;name?:string;accessId?:string};
const MASTER=validateGeo(JSON.parse(geoText));
export class AccessError extends Error {code="ACCESS_DENIED";}
export const configuredEndpoint=()=>cached<string>("endpoint");
export async function configureEndpoint(value:string){await cache("endpoint",endpointUrl(value));}
async function localSnapshot():Promise<Snapshot>{
  const session=await cached<Session>("session"),old=await cached<Snapshot>("snapshot");
  return {records:old?.records??[],geojson:old?.geojson??MASTER,owner:session?.owner??false,profileName:session?.name??"",accessId:session?.accessId??"",sourceConnected:Boolean(session),lastSync:old?.lastSync??"",units:old?.units??{},scriptUrl:session?.endpoint??await configuredEndpoint(),waterQualityAvailable:old?.waterQualityAvailable??false};
}
async function verifyConnection(endpoint:string):Promise<void>{
  try{
    if(Capacitor.isNativePlatform())await verifyDriveNative(endpoint,CapacitorHttp);
    else{
      const r=await fetch(endpoint,{method:"GET",redirect:"follow",credentials:"omit",signal:AbortSignal.timeout(45000)});
      if(!r.ok)throw new DriveProtocolError(`Google no pudo comprobar la conexión (HTTP ${r.status}). La clave inicial no se envió. [RIEGO_CONNECTION]`);
      parseDriveGreeting(await r.text(),{status:r.status,url:r.url||endpoint,contentType:r.headers.get("content-type")??""});
    }
  }catch(e){
    if(e instanceof DriveProtocolError)throw e;
    throw new DriveProtocolError(`No se pudo comprobar la conexión de Riego. Revisa internet y vuelve a intentarlo; la clave inicial no se envió. [RIEGO_CONNECTION]`);
  }
}
async function request<T>(endpoint:string,payload:Record<string,unknown>):Promise<T>{
  const url=endpointUrl(endpoint);let data:unknown;
  try {
    if(Capacitor.isNativePlatform()){
      data=await postDriveNative(url,payload,CapacitorHttp);
    }else{
      const r=await fetch(url,{method:"POST",headers:{"Content-Type":"text/plain;charset=UTF-8"},body:JSON.stringify(payload),redirect:"follow",credentials:"omit",signal:AbortSignal.timeout(45000)});
      if(!r.ok)throw new Error(`Error de conexión (${r.status}).`);
      data=parseDriveReply(await r.text(),{status:r.status,url:r.url||url,contentType:r.headers.get("content-type")??""});
    }
  }catch(e){if(e instanceof DriveProtocolError)throw e;throw new Error("No se pudo conectar con Drive. Comprueba internet y que Apps Script esté publicado para cualquier usuario. "+(e as Error).message);}
  const out=data as {ok?:boolean;error?:string;code?:string};
  if(out?.code==="ACCESS_DENIED")throw new AccessError(out.error??"Este dispositivo ya no tiene acceso.");
  if(!out||out.ok!==true)throw new DriveProtocolError(typeof out?.error==="string"&&out.error.trim()?out.error:`La conexión rechazó la operación sin explicar el motivo. Riego ${APP_VERSION}, operación ${String(payload.action)}. [RIEGO_REPLY_REJECTED]`);
  return data as T;
}
async function remote<T>(action:string,body:Record<string,unknown>={}):Promise<T>{
  const session=await cached<Session>("session");
  if(!session)throw new AccessError("Activa este dispositivo con tu código o QR.");
  try{return await request<T>(session.endpoint,{action,token:session.token,...body});}
  catch(e){if(e instanceof AccessError&&(await cached<Session>("session"))?.token===session.token)await clearAccessState();throw e;}
}
export async function api<T>(action:string,body?:unknown):Promise<T>{
  const b=(body??{}) as Record<string,unknown>;
  switch(action){
    case "status":{
      const session=await cached<Session>("session");
      if(!session)return {ok:false,owner:false} as T;
      const result=await remote<{ok:boolean;owner:boolean;name?:string;accessId?:string}>("status");
      // A concurrent revocation check must not restore a session cleared by another request.
      const current=await cached<Session>("session");
      if(!current)return {ok:false,owner:false} as T;
      if(current.token===session.token)await cache("session",{...current,owner:result.owner,name:result.name??current.name,accessId:result.accessId??current.accessId});return result as T;
    }
    case "activate":{
      const code=String(b.code??"").replace(/\s+/g,"").toUpperCase(),name=String(b.name??"").trim().replace(/\s+/g," ");
      if(b.principal===true){
        if(name.length<2||name.length>80)throw new Error("Escribe tu nombre y apellidos.");
        if(!/^[A-F0-9]{64}$/.test(code))throw new Error("Usa la clave inicial de configuración de tu archivo para crear el acceso principal.");
      }else if(b.principal===false&&!/^[A-Z0-9]{12}$/.test(code))throw new Error("Ingresa el código de 12 caracteres que recibiste o escanea tu QR.");
      const endpoint=b.principal===true?RIEGO_ENDPOINT:await configuredEndpoint();if(!endpoint)throw new Error("Primero pega el enlace de conexión o escanea el QR que recibiste.");
      const old=await cached<Snapshot>("snapshot");if(old?.records.some(r=>!r.synced)&&old.scriptUrl!==endpoint)throw new Error("Hay mediciones de otra conexión pendientes. Sincronízalas antes de cambiar de archivo.");
      await verifyConnection(endpoint);
      await configureEndpoint(endpoint);
      const r=await request<{ok:boolean;token:string;owner:boolean;name?:string;accessId?:string;units:Record<string,string>}>(endpoint,{action:"activate",code,principal:b.principal,name});
      if(typeof r.token!=="string"||!/^[a-f0-9]{64}$/.test(r.token)||typeof r.owner!=="boolean")throw new DriveProtocolError("Google confirmó una respuesta de activación incompleta. No se guardó un acceso inválido en este dispositivo.");
      if(b.principal===true&&!r.owner)throw new AccessError("Este código no permite crear un acceso principal.");
      await cache("session",{endpoint,token:r.token,owner:r.owner,name:r.name??name,accessId:r.accessId??""});await cache("activated",true);
      await cache("snapshot",{records:old?.scriptUrl===endpoint?old.records:[],geojson:old?.scriptUrl===endpoint?old.geojson:MASTER,owner:r.owner,profileName:r.name??name,accessId:r.accessId??"",sourceConnected:true,lastSync:old?.scriptUrl===endpoint?old.lastSync:"",units:r.units??{},scriptUrl:endpoint});
      return {ok:true} as T;
    }
    case "records":return await localSnapshot() as T;
    case "save":{
      if(!await cached("session"))throw new AccessError("Activa este dispositivo primero.");
      const parsed=(b.records as unknown[]).map(r=>recordSchema.parse(r));
      const s=await localSnapshot(),rows=new Map(s.records.map(r=>[r.id,r]));
      for(const r of parsed)if(!rows.has(r.id))rows.set(r.id,{...r,synced:false});
      await cache("snapshot",{...s,records:[...rows.values()]});return {saved:parsed.map(r=>r.id)} as T;
    }
    case "sync":{
      let s=await localSnapshot(),pending=s.records.filter(r=>!r.synced),written=0,latest:Measurement[]=[];
      let waterHeld=false;
      if(pending.some(record=>record.kind==="CALIDAD_AGUA")&&!s.waterQualityAvailable){
        const info=await remote<{capabilities?:{waterQuality?:boolean}}>("status");
        s={...s,waterQualityAvailable:info.capabilities?.waterQuality===true};await cache("snapshot",s);
        waterHeld=!s.waterQualityAvailable;
        if(waterHeld)pending=pending.filter(record=>record.kind!=="CALIDAD_AGUA");
      }
      // Keep each confirmed batch before requesting the next. A lost response retries the same IDs.
      for(let i=0;i<Math.max(pending.length,1);i+=100){
        const batch=pending.slice(i,i+100).map(({synced:_,pending:__,createdAt:___,...r})=>r);
        const r=await remote<{acknowledged:string[];records:Measurement[];units:Record<string,string>;capabilities?:{waterQuality?:boolean}}>("sync",{records:batch,includeWaterQuality:true});
        if(!Array.isArray(r.acknowledged)||!Array.isArray(r.records))throw new Error("Respuesta de sincronización incompleta.");
        const ack=new Set(r.acknowledged);
        if(batch.some(record=>!ack.has(record.id)))throw new Error("Drive no confirmó todas las mediciones. Se conservarán para reintentar.");
        latest=r.records.map(row=>({...recordSchema.parse(row),synced:true}));
        const unsent=s.records.filter(row=>!row.synced&&!ack.has(row.id));
        const rows=new Map(latest.map(row=>[row.id,row]));unsent.forEach(row=>rows.set(row.id,row));
        s={...s,records:[...rows.values()],units:r.units??s.units,lastSync:new Date().toISOString(),waterQualityAvailable:r.capabilities?.waterQuality===true};
        await cache("snapshot",s);written+=batch.length;
      }
      if(waterHeld)throw new Error("Calidad de agua sigue guardada en este celular. La conexión de Drive necesita actualizarse para recibir estos registros; las demás mediciones se sincronizaron.");
      return {...s,written,read:latest.length} as T;
    }
    case "invite":{
      if(b.name===undefined)return await remote<T>("invite");
      const name=normalizeAccessName(b.name);
      const status=await remote<{capabilities?:{accessManagement?:boolean}}>("status");
      if(!status.capabilities?.accessManagement)throw new Error("La conexión de Drive necesita actualizarse para crear accesos con nombre.");
      return await remote<T>("invite",{name,accessManagement:true});
    }
    case "accesses":{
      const result=await remote<{accesses:unknown[]}>("accesses");
      if(!Array.isArray(result.accesses))throw new Error("No se pudo leer la lista de accesos.");
      return {accesses:result.accesses.map(row=>managedAccessSchema.parse(row))} as T;
    }
    case "access_rename":case "access_cancel":case "access_revoke":{
      const id=String(b.id??"");if(!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id))throw new Error("Referencia de acceso inválida.");
      const result=await remote<{access:unknown}>(action,{id,...(action==="access_rename"?{name:normalizeAccessName(b.name)}:{})});
      return {access:managedAccessSchema.parse(result.access)} as T;
    }
    case "config":{
      const s=await localSnapshot();if(!s.owner)throw new Error("La conexión se configura desde tu dispositivo principal.");
      const entered=String(b.scriptUrl??s.scriptUrl??"");
      if(endpointUrl(entered)!==s.scriptUrl)throw new Error("Para cambiar de archivo debes cerrar este acceso y activar la nueva conexión.");
      const units=(b.units??s.units) as Record<string,string>;
      await remote("config",{units});
      const next={...s,units,...(b.geojson?{geojson:validateGeo(b.geojson)}:{})};await cache("snapshot",next);return next as T;
    }
    case "logout":{
      const s=await localSnapshot();if(s.records.some(r=>!r.synced))throw new Error("Sincroniza las mediciones pendientes con Drive antes de cerrar el acceso.");
      await remote("logout");await clearAccessState();return {ok:true} as T;
    }
    default:throw new Error("Operación desconocida.");
  }
}
