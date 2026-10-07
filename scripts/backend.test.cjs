const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto'),path=require('node:path'),ts=require('typescript');
const ROOT=path.resolve(__dirname,'..');
function tsModule(file,requireFn=require,extras={}){const exports={};const context={exports,module:{exports},require:requireFn,Date,Intl,URL,URLSearchParams,Math,Number,String,Set,Map,JSON,console,Error,...extras};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(ROOT,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context);return exports;}
const model=tsModule('src/lib/riego-model.ts'),access=tsModule('src/lib/access.ts');
const base={id:'11111111-1111-4111-8111-111111111111',kind:'HUMEDADES',date:'2026-10-06',lugar:'OLMOS',fundo:'CHALLAPAMPA',modulo:'M13',lote:'M13T04-87',prof:20,humedad:28};
function backend(){
 const props={},notes={},formats={},sheets={};let reads=0,held=false;
 for(const [kind,head] of Object.entries(model.HEADERS)){
  const values=[Array.from(head)];notes[kind]={};formats[kind]={};
  sheets[kind]={values,getLastRow:()=>values.length,getRange(row,col,count=1,width=1){return {
   getValues(){return Array.from({length:count},(_,i)=>Array.from({length:width},(_,j)=>values[row-1+i]?.[col-1+j]??''));},
   getDisplayValues(){return this.getValues().map(r=>r.map(v=>v instanceof Date?v.toISOString().slice(0,10):String(v)));},
   getNumberFormats(){return Array.from({length:count},(_,i)=>Array.from({length:width},(_,j)=>formats[kind][`${row+i},${col+j}`]??'0.00'));},
   getNotes(){return Array.from({length:count},(_,i)=>[notes[kind][row+i]??'']);},
   setNotes(list){list.forEach((r,i)=>notes[kind][row+i]=r[0]);return this;},
   setValues(list){list.forEach((v,i)=>{values[row-1+i]??=[];v.forEach((cell,j)=>values[row-1+i][col-1+j]=cell);});return this;},
   setNumberFormat(f){formats[kind][`${row},${col}`]=f;return this;},setNote(n){notes[kind][row]=n;return this;}
  };}};
 }
 const properties={setProperty:(k,v)=>{props[k]=v;return properties;},getProperty:k=>props[k]??null,deleteProperty:k=>{delete props[k];return properties;},getProperties:()=>({...props})};
 const book={getSheetByName:k=>sheets[k],getSpreadsheetTimeZone:()=> 'America/Lima',getId:()=> '1JgvxAAqxLuPGjLkBoj6XpHl3f8n_8Q9ouavMOb8BRfA'};
 const context={console:{log(){}},Date,Math,JSON,Number,String,Array,isFinite,isNaN,PropertiesService:{getScriptProperties:()=>properties},SpreadsheetApp:{openById:id=>{assert.equal(id,book.getId());reads++;return book;},flush(){}},Utilities:{getUuid:()=>crypto.randomUUID(),DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(_algorithm,text)=>[...crypto.createHash('sha256').update(String(text)).digest()],formatDate:d=>d.toISOString().slice(0,10)},LockService:{getScriptLock:()=>({waitLock(){assert(!held);held=true;},hasLock:()=>held,releaseLock(){held=false;}})},ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({text,setMimeType(){return this;}})}};
 vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(ROOT,'apps-script/Riego.gs'),'utf8'),context);
 context.configurarRiego();const initial=context.crearAccesoPropietario();
 const call=(action,body={})=>JSON.parse(context.doPost({postData:{contents:JSON.stringify({action,...body})}}).text);
 const owner=call('activate',{code:initial});assert(owner.ok,owner.error);
 return {call,owner,initial,props,sheets,notes,formats,context,get reads(){return reads;}};
}
test('Fechas reales, cambio de semana ISO, cero y humedad de 0 a 100%',()=>{
 assert.equal(model.isoWeek('2026-12-31'),53);assert.equal(model.isoWeek('2027-01-01'),53);assert.equal(model.isoWeek('2027-01-04'),1);
 assert(model.recordSchema.safeParse({...base,prof:0,humedad:0}).success);
 assert(!model.recordSchema.safeParse({...base,date:'2026-02-30'}).success);
 assert(!model.recordSchema.safeParse({...base,humedad:101}).success);
 assert(!model.recordSchema.safeParse({...base,prof:undefined}).success);
});
test('GeoJSON original: 254 identidades únicas y coincidencia de ubicación completa',()=>{
 const bytes=fs.readFileSync(path.join(ROOT,'data/lotes-mapa.geojson'));
 const blobHash=crypto.createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`),bytes])).digest('hex');
 assert.equal(blobHash,'fb6d005ae6994a0aca9c0c4f54f4194cea6a83e0');
 const geo=model.validateGeo(JSON.parse(bytes));assert.equal(geo.features.length,254);
 const locations=geo.features.map(model.featureLocation);assert.equal(locations.filter(l=>l.lugar==='OLMOS').length,166);assert.equal(locations.filter(l=>l.lugar==='MOTUPE').length,88);
 assert.equal(new Set(locations.map(l=>[l.lugar,l.fundo,l.modulo,l.lote].join('|'))).size,254);
 const f=geo.features[0],loc=model.featureLocation(f);assert(model.matchesFeature({...base,...loc},f));assert(!model.matchesFeature({...base,...loc,fundo:'OTRO'},f));
 assert.equal(model.mean([0,20,40]),20);assert.equal(model.mean([]),null);
});
test('QR limita el servidor a Apps Script HTTPS y conserva el código',()=>{
 const endpoint='https://script.google.com/macros/s/TEST_DEPLOYMENT/exec';
 const link=access.accessLink(endpoint,'ABCDEFGH2345');assert.equal(access.parseAccess(link).endpoint,endpoint);assert.equal(access.parseAccess(link).code,'ABCDEFGH2345');
 assert.throws(()=>access.parseAccess('https://evil.example/#codigo=ABCDEFGH2345&servidor=https://evil.example/exec'));
 assert.throws(()=>access.endpointUrl('https://script.google.com.evil.example/macros/s/a/exec'));
 assert.throws(()=>access.endpointUrl('http://script.google.com/macros/s/a/exec'));
});
test('Sin token no se leen ni escriben las hojas; el código inicial se usa una vez',()=>{
 const b=backend(),reads=b.reads;
 const denied=b.call('sync',{records:[base]});assert.equal(denied.code,'ACCESS_DENIED');assert.equal(b.reads,reads);
 assert.equal(b.call('activate',{code:b.initial}).ok,false);assert.equal(b.call('status',{token:b.owner.token}).owner,true);
});
test('Código temporal: un dispositivo, sin permiso de entregar códigos, con caducidad y revocación',()=>{
 const b=backend(),invite=b.call('invite',{token:b.owner.token});assert(invite.ok);assert.equal(invite.code.length,12);
 const device=b.call('activate',{code:invite.code});assert(device.ok);assert.equal(device.owner,false);
 assert.equal(b.call('activate',{code:invite.code}).ok,false);assert.equal(b.call('invite',{token:device.token}).code,'ACCESS_DENIED');
 const next=b.call('invite',{token:b.owner.token});const hash=b.context.hash_(next.code);b.props['INVITE_'+hash]=JSON.stringify({expiresAt:0});assert.equal(b.call('activate',{code:next.code}).ok,false);
 assert(b.call('logout',{token:device.token}).ok);assert.equal(b.call('status',{token:device.token}).code,'ACCESS_DENIED');
});
test('Sincronizar dos veces no duplica y los conflictos no agregan una fila',()=>{
 const b=backend(),invoke=records=>b.call('sync',{token:b.owner.token,records});
 let r=invoke([base]);assert(r.ok,r.error);assert.equal(r.records[0].humedad,28);assert.equal(b.sheets.HUMEDADES.values.length,2);
 r=invoke([base]);assert(r.ok,r.error);assert.equal(b.sheets.HUMEDADES.values.length,2);
 const other={...base,id:'22222222-2222-4222-8222-222222222222'};
 assert.equal(invoke([other,{...base,humedad:29}]).ok,false);assert.equal(b.sheets.HUMEDADES.values.length,2);
 assert.equal(invoke([{...other,date:'2026-02-30'}]).ok,false);
 assert.equal(invoke([other,{...other,humedad:29}]).ok,false);assert.equal(b.sheets.HUMEDADES.values.length,2);
});
test('Tres hojas, porcentajes nativos y notas previas; se conservan todas las columnas',()=>{
 const b=backend();b.sheets.HUMEDADES.values.push([2026,10,41,new Date('2026-10-06T17:00:00Z'),'MOTUPE','FRANCO','M02','M02T01L01',40,.35]);b.formats.HUMEDADES['2,10']='0.00%';b.notes.HUMEDADES[2]='Nota original';
 const {humedad,prof,...common}=base;
 const pressure={...common,id:'22222222-2222-4222-8222-222222222222',kind:'PRESIONES',lado:'IZQUIERDO',presion:0};
 const compact={...common,id:'33333333-3333-4333-8333-333333333333',kind:'COMPACTACION',puntos:'P1',m1:0,m2:2,m3:3};
 const r=b.call('sync',{token:b.owner.token,records:[pressure,compact]});assert(r.ok,r.error);assert.equal(r.records.length,3);assert.equal(r.records.find(r=>r.kind==='HUMEDADES').humedad,35);assert(b.notes.HUMEDADES[2].startsWith('Nota original\nRIEGO_ID:'));
 assert.equal(b.sheets.PRESIONES.values[1].length,10);assert.equal(b.sheets.COMPACTACION.values[1].length,12);
 for(const [kind,head] of Object.entries(model.HEADERS))assert.deepEqual(b.sheets[kind].values[0],Array.from(head));
});
test('Cliente conserva los registros de un lote confirmado cuando falla el lote siguiente',async()=>{
 const endpoint='https://script.google.com/macros/s/TEST/exec',state=new Map();
 state.set('session',{endpoint,token:'a'.repeat(64),owner:true});state.set('endpoint',endpoint);
 const records=Array.from({length:150},(_,i)=>({...base,id:crypto.randomUUID(),synced:false}));
 const geo=JSON.parse(fs.readFileSync(path.join(ROOT,'data/lotes-mapa.geojson')));
 state.set('snapshot',{records,geojson:geo,owner:true,sourceConnected:true,lastSync:'',units:{},scriptUrl:endpoint});
 let calls=0;
 const client=tsModule('src/lib/api.ts',name=>{
  if(name==='@capacitor/core')return {Capacitor:{isNativePlatform:()=>false}};
  if(name.endsWith('geojson?raw'))return {default:JSON.stringify(geo)};
  if(name==='./riego-model')return model;
  if(name==='./access')return access;
  if(name==='./riego-offline')return {cached:async k=>state.get(k),cache:async(k,v)=>state.set(k,v),clearAccessState:async()=>{state.delete('session');state.delete('activated');}};
  return require(name);
 },{AbortSignal,fetch:async(_url,options)=>{calls++;if(calls===2)throw new Error('Sin conexión');const p=JSON.parse(options.body);return {ok:true,json:async()=>({ok:true,acknowledged:p.records.map(r=>r.id),records:p.records,units:{}})};}});
 await assert.rejects(()=>client.api('sync',{}));
 assert.equal(state.get('snapshot').records.filter(r=>r.synced).length,100);assert.equal(state.get('snapshot').records.filter(r=>!r.synced).length,50);
});
