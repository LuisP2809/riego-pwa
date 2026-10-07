import type { Measurement } from "./riego-model";
const DB_NAME="riego-campo-v1";
async function database():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>{req.result.createObjectStore("state");req.result.createObjectStore("queue",{keyPath:"id"});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
async function transaction<T>(store:string,mode:IDBTransactionMode,task:(store:IDBObjectStore)=>IDBRequest<T>):Promise<T>{const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction(store,mode);const req=task(tx.objectStore(store));tx.oncomplete=()=>{db.close();resolve(req.result);};tx.onerror=()=>{db.close();reject(tx.error);};tx.onabort=()=>{db.close();reject(tx.error);};});}
export const cached=<T>(key:string)=>transaction<T|undefined>("state","readonly",s=>s.get(key));
export const cache=(key:string,value:unknown)=>transaction("state","readwrite",s=>s.put(value,key));
export const queued=()=>transaction<Measurement[]>("queue","readonly",s=>s.getAll());
export const enqueue=(r:Measurement)=>transaction("queue","readwrite",s=>s.put(r));
export async function enqueueBatch(records:Measurement[]):Promise<void>{
 const db=await database();
 await new Promise<void>((resolve,reject)=>{
  const tx=db.transaction("queue","readwrite"),store=tx.objectStore("queue");
  tx.oncomplete=()=>{db.close();resolve();};
  tx.onerror=()=>{db.close();reject(tx.error);};
  tx.onabort=()=>{db.close();reject(tx.error??new Error("No se pudieron guardar las mediciones."));};
  try{records.forEach(record=>store.put(record));}
  catch(error){tx.abort();db.close();reject(error);}
 });
}
export async function acknowledge(ids:string[]){const db=await database();await new Promise<void>((resolve,reject)=>{const tx=db.transaction("queue","readwrite");ids.forEach(id=>tx.objectStore("queue").delete(id));tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};});}
export async function clearCached(){await transaction("state","readwrite",s=>s.clear());}
export async function clearAccessState(){
 const db=await database();await new Promise<void>((resolve,reject)=>{
  const tx=db.transaction("state","readwrite"),s=tx.objectStore("state");
  ["session","activated"].forEach(k=>s.delete(k));
  tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};
 });
}
