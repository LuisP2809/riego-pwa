import {z} from "zod";

export const ACCESS_STATUS_LABELS={pending:"Pendiente",active:"Activo",cancelled:"Cancelado",revoked:"Retirado",expired:"Vencido",closed:"Cerrado"} as const;
export const managedAccessSchema=z.object({
  id:z.string().uuid(),kind:z.enum(["invitation","device"]),name:z.string().max(80),
  status:z.enum(["pending","active","cancelled","revoked","expired","closed"]),
  createdAt:z.number().finite().nonnegative(),activatedAt:z.number().finite().nonnegative(),expiresAt:z.number().finite().nonnegative(),
});
export type ManagedAccess=z.infer<typeof managedAccessSchema>;
export type AccessFilter="all"|"pending"|"active"|"inactive";
export const accessReference=(id:string)=>id.slice(0,8).toUpperCase();
export const accessName=(access:ManagedAccess)=>access.name||"Sin nombre — acceso anterior";
export function normalizeAccessName(value:unknown):string{
  const name=String(value??"").trim().replace(/\s+/g," ");
  if(name.length<2||name.length>80)throw new Error("Escribe un nombre de 2 a 80 caracteres para este acceso.");
  return name;
}
export function filterAccesses(rows:ManagedAccess[],filter:AccessFilter,query:string):ManagedAccess[]{
  const text=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  const search=text(query.trim());
  return rows.filter(row=>(filter==="all"||row.status===filter||(filter==="inactive"&&!["pending","active"].includes(row.status)))&&(!search||text(`${accessName(row)} ${accessReference(row.id)}`).includes(search)));
}
