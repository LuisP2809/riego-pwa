export function endpointUrl(value:string):string {
  const url=new URL(value.trim());
  if(url.protocol!=="https:"||url.hostname!=="script.google.com"||!/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url.pathname)||url.search||url.hash)throw new Error("Usa el enlace de Apps Script que termina en /exec.");
  return url.href;
}
export function parseAccess(value:string):{code:string;endpoint?:string} {
  const raw=value.trim();
  try {
    const data=new URL(raw);
    if(data.protocol!=="riego:"&&data.protocol!=="https:")throw new Error();
    const params=data.hash?new URLSearchParams(data.hash.slice(1)):data.searchParams;
    const code=params.get("codigo")??"",server=params.get("servidor");
    if(!/^[A-Z0-9]{12}$/.test(code))throw new Error();
    return {code,...(server?{endpoint:endpointUrl(server)}:{})};
  }catch{
    const code=raw.replace(/\s+/g,"").toUpperCase();
    if(!/^[A-Z0-9]{12}$/.test(code))throw new Error("El QR no contiene un acceso válido de Riego.");
    return {code};
  }
}
export function accessLink(endpoint:string,code:string):string {
  const params=new URLSearchParams({servidor:endpointUrl(endpoint),codigo:code});
  return `riego://activate?${params}`;
}
