const CACHE="riego-android-pwa-v0.1.1";
self.addEventListener("install",event=>event.waitUntil(self.skipWaiting()));
self.addEventListener("activate",event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith("riego-android-pwa-")&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener("message",event=>{
 if(event.data?.type==="CACHE_SHELL")event.waitUntil((async()=>{
  const c=await caches.open(CACHE);
  for(const value of event.data.urls??[]){const url=new URL(value,self.location.href);if(url.origin===self.location.origin)try{await c.add(url.href);}catch{}}
 })());
});
self.addEventListener("fetch",event=>{
 const r=event.request,url=new URL(r.url);
 if(r.method!=="GET"||url.origin!==self.location.origin)return;
 event.respondWith((async()=>{const c=await caches.open(CACHE);try{const response=await fetch(r);if(response.ok)await c.put(r,response.clone());return response;}catch{const cached=await c.match(r);if(cached)return cached;if(r.mode==="navigate"){const root=await c.match(new URL("./",self.location.href).href);if(root)return root;}throw new Error("Sin conexión");}})());
});
