import type {HttpOptions,HttpResponse} from "@capacitor/core";
import {endpointUrl} from "./access";

type ReplyMeta={status:number;url?:string;contentType?:string};
type NativeReply={data:unknown;meta:ReplyMeta};
type NativeHttp={request:(options:HttpOptions)=>Promise<HttpResponse>};
export class DriveProtocolError extends Error {}

function header(headers:Record<string,string>,name:string){
  const key=Object.keys(headers).find(k=>k.toLowerCase()===name.toLowerCase());
  return key?headers[key]:"";
}
function details(meta:ReplyMeta){
  let host="";try{host=meta.url?new URL(meta.url).hostname:"";}catch{}
  const type=meta.contentType?.split(";")[0].trim().slice(0,80)||"sin tipo de contenido";
  return `HTTP ${meta.status}, ${type}${host?", "+host:""}`;
}
export function parseDriveReply(raw:unknown,meta:ReplyMeta):unknown{
  let data=raw;
  for(let i=0;i<2&&typeof data==="string";i++){
    const text=data.replace(/^\uFEFF/,"").trim();
    if(!text)throw new DriveProtocolError(`Google devolvió una respuesta vacía (${details(meta)}).`);
    if(/^Riego: activa un dispositivo/.test(text))throw new DriveProtocolError("Google devolvió la bienvenida del enlace en lugar de procesar la solicitud. Actualiza la APK y usa el enlace que termina en /exec.");
    if(/<!doctype\s+html|<html[\s>]|<body[\s>]/i.test(text))throw new DriveProtocolError(`Google devolvió una página web, no los datos de Riego (${details(meta)}). Comprueba que el enlace sea de tu conexión y esté publicado para Cualquier usuario.`);
    try{data=JSON.parse(text);}catch{throw new DriveProtocolError(`Google devolvió un formato que Riego no reconoce (${details(meta)}).`);}
  }
  if(!data||typeof data!=="object"||Array.isArray(data)||typeof (data as {ok?:unknown}).ok!=="boolean")throw new DriveProtocolError(`Google no confirmó la operación de Riego (${details(meta)}). Comprueba el enlace de conexión.`);
  return data;
}
export function parseDriveGreeting(raw:unknown,meta:ReplyMeta):void{
  if(typeof raw!=="string"||!/^Riego: activa un dispositivo mediante un código o QR\./.test(raw.replace(/^\uFEFF/,"").trim()))throw new DriveProtocolError(`El enlace no respondió como la conexión de Riego (${details(meta)}). La clave inicial no se envió. [RIEGO_CONNECTION]`);
}
function redirectTarget(location:string,current:string,endpoint:string){
  let target:URL;try{target=new URL(location,current);}catch{throw new DriveProtocolError("Google devolvió una redirección sin un enlace válido.");}
  if(target.hostname==="accounts.google.com")throw new DriveProtocolError("Google pide iniciar sesión para acceder a la conexión. La implementación de Riego debe ejecutarse como su propietario y permitir Cualquier usuario.");
  if(target.protocol!=="https:"||target.username||target.password||target.port||target.hash)throw new DriveProtocolError("La conexión devolvió una redirección no autorizada.");
  const id=new URL(endpoint).pathname.split("/")[3];
  const sameDeployment=target.hostname==="script.google.com"&&new RegExp("^/macros(?:/u/\\d+)?/s/"+id+"/exec$").test(target.pathname);
  const content=target.hostname==="script.googleusercontent.com"&&target.pathname==="/macros/echo";
  if(!sameDeployment&&!content)throw new DriveProtocolError("La conexión devolvió una redirección fuera del servicio de Riego.");
  return {url:target.href,content};
}
async function nativeRequest(endpoint:string,http:NativeHttp,payload?:Record<string,unknown>):Promise<NativeReply>{
  const original=endpointUrl(endpoint);
  let url=original,method=payload?"POST":"GET",readingResult=false;
  const body=payload?JSON.stringify(payload):undefined;
  for(let hop=0;hop<5;hop++){
    const response=await http.request({url,method,headers:method==="POST"?{"Content-Type":"text/plain;charset=UTF-8","Accept":"application/json"}:{"Accept":"application/json"},...(method==="POST"?{data:body}:{}),connectTimeout:20000,readTimeout:45000,responseType:"text",disableRedirects:true});
    const headers=response.headers??{};
    if([301,302,303,307,308].includes(response.status)){
      const location=header(headers,"location");
      if(!location)throw new DriveProtocolError("Google devolvió una redirección sin indicar dónde leer la respuesta.");
      const next=redirectTarget(location,url,original);
      // Google serves the result at a one-time URL. Read it with GET, without
      // forwarding the activation code or session token. Never retry the POST
      // when reading that result fails: activation codes are single-use.
      if(readingResult&&!next.content)throw new DriveProtocolError("Google redirigió la respuesta fuera de su servicio de contenido.");
      url=next.url;if(next.content){method="GET";readingResult=true;}
      continue;
    }
    const meta={status:response.status,url:response.url||url,contentType:header(headers,"content-type")};
    if(response.status<200||response.status>=300)throw new DriveProtocolError(`Google no pudo atender la conexión (${details(meta)}).`);
    return {data:response.data,meta};
  }
  throw new DriveProtocolError("Google redirigió la conexión demasiadas veces. Comprueba la publicación de Riego.");
}
export async function postDriveNative(endpoint:string,payload:Record<string,unknown>,http:NativeHttp):Promise<unknown>{
  const response=await nativeRequest(endpoint,http,payload);
  return parseDriveReply(response.data,response.meta);
}
export async function verifyDriveNative(endpoint:string,http:NativeHttp):Promise<void>{
  const response=await nativeRequest(endpoint,http);
  parseDriveGreeting(response.data,response.meta);
}
