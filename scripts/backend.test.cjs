const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto'),path=require('node:path'),ts=require('typescript');
const ROOT=path.resolve(__dirname,'..');
function tsModule(file,requireFn=require,extras={}){const exports={};const context={exports,module:{exports},require:requireFn,Date,Intl,URL,URLSearchParams,Math,Number,String,Set,Map,JSON,console,Error,...extras};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(ROOT,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,context);return exports;}
const model=tsModule('src/lib/riego-model.ts'),access=tsModule('src/lib/access.ts');
const humedades=tsModule('src/lib/humedades.ts',name=>name==='./riego-model'?model:require(name),{crypto});
const compactacion=tsModule('src/lib/compactacion.ts',name=>name==='./riego-model'?model:require(name),{crypto});
const locations=tsModule('src/lib/locations.ts',name=>name==='./riego-model'?model:require(name));
const transport=tsModule('src/lib/drive-transport.ts',name=>name==='./access'?access:require(name));
const connection=tsModule('src/lib/connection.ts',name=>name==='../../package.json'?require('../package.json'):require(name));
const webReply=data=>({ok:true,status:200,headers:{get:()=> 'application/json'},text:async()=>JSON.stringify(data)});
const greeting='Riego: activa un dispositivo mediante un código o QR. Las mediciones requieren autorización.';
const greetingReply=()=>({ok:true,status:200,headers:{get:()=> 'text/plain'},text:async()=>greeting});
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
test('Una evaluación de humedad genera las profundidades de la sede con la misma fecha y ubicación',()=>{
 const context={date:base.date,lugar:base.lugar,fundo:base.fundo,modulo:base.modulo,lote:base.lote};
 const values={20:'0',40:'28,5',60:'100',80:'35'};
 for(const [lugar,expected] of [['OLMOS',[20,40,60]],['MOTUPE',[20,40,60,80]]]){
  const records=humedades.makeHumidityRecords({...context,lugar},values);
  assert.deepEqual(Array.from(records,r=>r.prof),expected);
  assert.equal(new Set(Array.from(records,r=>r.id)).size,expected.length);
  for(const r of records){assert.equal(r.kind,'HUMEDADES');assert.equal(r.date,context.date);assert.equal(r.lugar,lugar);assert.equal(r.fundo,context.fundo);assert.equal(r.modulo,context.modulo);assert.equal(r.lote,context.lote);assert(model.recordSchema.safeParse(r).success);}
  assert.deepEqual(Array.from(records,r=>r.humedad),expected.length===3?[0,28.5,100]:[0,28.5,100,35]);
 }
});
test('La evaluación rechaza datos incompletos o humedades inválidas antes de guardar; Olmos no exige 80 cm',()=>{
 const context={date:base.date,lugar:base.lugar,fundo:base.fundo,modulo:base.modulo,lote:base.lote},values={20:'28',40:'30',60:'32'};
 assert.equal(humedades.makeHumidityRecords(context,values).length,3);
 assert.throws(()=>humedades.makeHumidityRecords({...context,lugar:'MOTUPE'},values),/80 cm/);
 for(const key of ['date','lugar','fundo','modulo','lote'])assert.throws(()=>humedades.makeHumidityRecords({...context,[key]:''},values));
 for(const value of ['', ' ', '-1', '101', 'abc', 'Infinity'])assert.throws(()=>humedades.makeHumidityRecords(context,{...values,40:value}),/40 cm/);
 assert.throws(()=>humedades.makeHumidityRecords({...context,lugar:'OTRA SEDE'},values));
 assert.throws(()=>humedades.makeHumidityRecords({...context,date:'2026-02-30'},values));
});
test('El perfil completo se sincroniza en las columnas originales sin duplicarse al reintentar',()=>{
 const b=backend(),context={date:base.date,lugar:base.lugar,fundo:base.fundo,modulo:base.modulo,lote:base.lote},values={20:'28',40:'30',60:'32',80:'34'};
 const records=JSON.parse(JSON.stringify([...humedades.makeHumidityRecords(context,values),...humedades.makeHumidityRecords({...context,date:'2026-10-07',lugar:'MOTUPE'},values)]));
 const send=()=>b.call('sync',{token:b.owner.token,records});
 let result=send();assert(result.ok,result.error);assert.equal(result.acknowledged.length,7);assert.equal(b.sheets.HUMEDADES.values.length,8);
 for(let i=0;i<records.length;i++){
  const row=b.sheets.HUMEDADES.values[i+1],record=records[i];assert.equal(row.length,10);
  assert.equal(row[3].toISOString().slice(0,10),record.date);assert.deepEqual(row.slice(4,8),[record.lugar,record.fundo,record.modulo,record.lote]);assert.equal(row[8],record.prof);assert.equal(row[9],record.humedad);
 }
 result=send();assert(result.ok,result.error);assert.equal(b.sheets.HUMEDADES.values.length,8);
});
test('Con CHOLOCAL M08 seleccionado siguen disponibles sus 13 lotes y los módulos M07, M08 y M10',()=>{
 const rows=JSON.parse(fs.readFileSync(path.join(ROOT,'data/lotes-mapa.geojson'))).features.map(model.featureLocation);
 const values={date:base.date,lugar:'OLMOS',fundo:'CHOLOCAL',modulo:'M08',lote:'M08T01-14'};
 const catalog=[...rows,...rows.filter(r=>r.lote===values.lote)];
 assert.deepEqual(Array.from(locations.locationOptions(catalog,values,'modulo')),['M07','M08','M10']);
 const lots=Array.from(locations.locationOptions(catalog,values,'lote'));
 assert.equal(lots.length,13);assert(lots.includes('M08T01-14'));assert(lots.includes('M08T01-15'));assert(lots.includes('M08T04-25'));
 const cleared=locations.changeLocation(values,'lote','');
 assert.deepEqual(Array.from(locations.locationOptions(catalog,cleared,'modulo')),['M07','M08','M10']);
 assert.deepEqual(Array.from(locations.locationOptions(catalog,cleared,'lote')),lots);
});
test('Después de guardar se puede cambiar de lote o módulo sin modificar la evaluación anterior',()=>{
 const context={date:base.date,lugar:'OLMOS',fundo:'CHOLOCAL',modulo:'M08',lote:'M08T01-14'},values={20:'28',40:'30',60:'32'};
 const original=humedades.makeHumidityRecords(context,values),next=locations.changeLocation(context,'lote','M08T01-15');
 const second=humedades.makeHumidityRecords(next,values),b=backend();
 const result=b.call('sync',{token:b.owner.token,records:JSON.parse(JSON.stringify([...original,...second]))});
 assert(result.ok,result.error);assert.equal(b.sheets.HUMEDADES.values.length,7);
 assert(original.every(r=>r.lote==='M08T01-14'));assert(second.every(r=>r.lote==='M08T01-15'));assert.equal(context.lote,'M08T01-14');
 const changed=locations.changeLocation(next,'modulo','M07');assert.equal(changed.lote,'');assert.equal(changed.date,context.date);assert.equal(changed.fundo,'CHOLOCAL');
 assert.throws(()=>humedades.makeHumidityRecords(changed,values));
 const cleared=locations.changeLocation(next,'lote','');assert.equal(locations.changeLocation(cleared,'modulo','M10').modulo,'M10');
 const fundo=locations.changeLocation(next,'fundo','CHALLAPAMPA');assert.equal(fundo.modulo,'');assert.equal(fundo.lote,'');
 const sede=locations.changeLocation(next,'lugar','MOTUPE');assert.equal(sede.fundo,'');assert.equal(sede.modulo,'');assert.equal(sede.lote,'');assert.equal(sede.date,context.date);
});
test('Los selectores muestran alternativas aunque ya haya lote elegido y permiten quitarlo sin bloquear el módulo',()=>{
 const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
 const Fields=tsModule('src/components/location-fields.tsx',name=>name==='@/lib/locations'?locations:require(name)).default;
 const rows=JSON.parse(fs.readFileSync(path.join(ROOT,'data/lotes-mapa.geojson'))).features.map(model.featureLocation);
 const values={lugar:'OLMOS',fundo:'CHOLOCAL',modulo:'M08',lote:'M08T01-14'};
 const render=state=>renderToStaticMarkup(React.createElement(Fields,{rows,values:state,onChange(){}}));
 for(const state of [values,locations.changeLocation(values,'lote','')]){
  const html=render(state),module=html.match(/<select name="modulo"[^>]*>(.*?)<\/select>/)[0],lot=html.match(/<select name="lote"[^>]*>(.*?)<\/select>/)[0];
  assert(!module.includes('disabled'));assert(module.includes('value="M07"'));assert(module.includes('value="M10"'));
  assert(lot.includes('value="M08T01-15"'));assert(lot.includes('<option value=""'));assert(!html.includes('datalist'));
 }
});
test('Sede usa el selector del dispositivo y conserva ambas opciones sin un menú que bloquee la página',()=>{
 const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
 const Picker=tsModule('src/components/field-picker.tsx').default;
 for(const value of ['OLMOS','MOTUPE']){
  const html=renderToStaticMarkup(React.createElement(Picker,{label:'Sede',value,onChange(){},options:[{value:'OLMOS',label:'OLMOS'},{value:'MOTUPE',label:'MOTUPE'}]}));
  assert(html.includes('<select aria-label="Sede"'));assert(html.includes('value="OLMOS"'));assert(html.includes('value="MOTUPE"'));
  assert(html.includes(`value="${value}" selected=""`));assert(!html.includes('select-trigger'));assert(!html.includes('data-scroll-locked'));
 }
});
function compactionFixture(){
 const context={date:base.date,lugar:base.lugar,fundo:base.fundo,modulo:base.modulo,lote:base.lote};
 const values=compactacion.emptyCompactionValues();
 for(const [index,point] of compactacion.COMPACTION_POINTS.entries())values[point]={m1:String(index),m2:`${index+1},5`,m3:String(index+2)};
 return {context,values};
}
test('Compactación crea P1 a P6 con tres lecturas independientes y la misma fecha y ubicación',()=>{
 const {context,values}=compactionFixture(),records=compactacion.makeCompactionRecords(context,values);
 assert.deepEqual(Array.from(records,r=>r.puntos),['P1','P2','P3','P4','P5','P6']);
 assert.equal(new Set(Array.from(records,r=>r.id)).size,6);
 records.forEach((r,index)=>{
  assert.equal(r.kind,'COMPACTACION');assert(model.recordSchema.safeParse(r).success);
  for(const key of ['date','lugar','fundo','modulo','lote'])assert.equal(r[key],context[key]);
  assert.equal(r.m1,index);assert.equal(r.m2,index+1.5);assert.equal(r.m3,index+2);
 });
 values.P1.m1='99';assert.equal(records[0].m1,0);assert.equal(values.P2.m1,'1');
 const reset=compactacion.emptyCompactionValues();reset.P1.m1='10';assert.equal(reset.P2.m1,'');assert.equal(reset.P1.m2,'');
 const next=compactacion.emptyCompactionValues();assert.equal(next.P1.m1,'');
});
test('Compactación valida las 18 lecturas y todos los datos del lote antes de guardar',()=>{
 const {context,values}=compactionFixture();
 for(const point of compactacion.COMPACTION_POINTS)for(const reading of compactacion.COMPACTION_READINGS){
  for(const value of ['', ' ', '-1', 'abc', 'Infinity', 'NaN']){
   const invalid={...values,[point]:{...values[point],[reading]:value}};
   assert.throws(()=>compactacion.makeCompactionRecords(context,invalid),error=>error.message.includes(point)&&error.message.includes(reading.toUpperCase()));
  }
 }
 for(const key of ['date','lugar','fundo','modulo','lote'])assert.throws(()=>compactacion.makeCompactionRecords({...context,[key]:''},values));
 assert.throws(()=>compactacion.makeCompactionRecords({...context,date:'2026-02-30'},values));
 assert.throws(()=>compactacion.makeCompactionRecords(context,{...values,P6:undefined}),/M1.*P6/);
});
test('Los seis puntos conservan las columnas originales y no duplican ni cambian lo ya guardado al reintentar',()=>{
 const b=backend(),{context,values}=compactionFixture(),records=JSON.parse(JSON.stringify(compactacion.makeCompactionRecords(context,values)));
 const invoke=rows=>b.call('sync',{token:b.owner.token,records:rows});
 let result=invoke(records);assert(result.ok,result.error);
 assert.equal(b.sheets.COMPACTACION.values.length,7);
 assert.deepEqual(b.sheets.COMPACTACION.values[0],Array.from(model.HEADERS.COMPACTACION));
 b.sheets.COMPACTACION.values.slice(1).forEach((row,index)=>{
  assert.equal(row.length,12);assert.deepEqual(row.slice(0,3),[2026,10,41]);assert.equal(row[3].toISOString().slice(0,10),context.date);
  assert.deepEqual(row.slice(4,9),[context.lugar,context.fundo,context.modulo,context.lote,`P${index+1}`]);
  assert.deepEqual(row.slice(9),[index,index+1.5,index+2]);assert(b.notes.COMPACTACION[index+2].includes(records[index].id));
 });
 result=invoke(records);assert(result.ok,result.error);assert.equal(b.sheets.COMPACTACION.values.length,7);
 const conflict=invoke([{...records[0],id:crypto.randomUUID()},{...records[5],m3:999}]);
 assert.equal(conflict.ok,false);assert.equal(b.sheets.COMPACTACION.values.length,7);assert.equal(b.sheets.COMPACTACION.values[6][11],7);
 const second=compactacion.makeCompactionRecords({...context,lote:'OTRO LOTE'},values);
 result=invoke(JSON.parse(JSON.stringify(second)));assert(result.ok,result.error);assert.equal(b.sheets.COMPACTACION.values.length,13);
 assert.equal(b.sheets.COMPACTACION.values[1][7],context.lote);assert.equal(b.sheets.COMPACTACION.values[7][7],'OTRO LOTE');
 assert.equal(b.sheets.HUMEDADES.values.length,1);assert.equal(b.sheets.PRESIONES.values.length,1);
});
test('El formulario de compactación muestra seis puntos ordenados y 18 casillas con etiquetas y unidad',()=>{
 const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
 const Fields=tsModule('src/components/compaction-fields.tsx',name=>name==='@/lib/compactacion'?compactacion:require(name)).default;
 const {values}=compactionFixture(),render=(ready,unit)=>renderToStaticMarkup(React.createElement(Fields,{ready,unit,values,onChange(){}}));
 const html=render(true,'kg/cm²');assert.equal((html.match(/<input /g)||[]).length,18);assert.equal((html.match(/<fieldset /g)||[]).length,6);
 let previous=-1;
 for(let index=1;index<=6;index++){
  const position=html.indexOf(`<legend>Punto ${index} (P${index})</legend>`);assert(position>previous);previous=position;
  for(const reading of ['M1','M2','M3']){
   const label=`${reading} del punto P${index} (kg/cm²)`;
   const input=html.match(new RegExp(`<input [^>]*aria-label="${label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}"[^>]*>`))?.[0];
   assert(input,label);assert(input.includes('type="number"'));assert(input.includes('inputMode="decimal"'));assert(input.includes('step="any"'));assert(input.includes('min="0"'));assert(input.includes('required=""'));
  }
 }
 assert(!render(false).includes('<input'));assert(render(false).includes('Selecciona fecha'));
 assert(render(true).includes('aria-label="M1 del punto P1"'));
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
test('El acceso principal guarda el nombre; un código compartido no lo crea ni se consume al intentarlo',()=>{
 const b=backend(),initial=b.context.crearAccesoPropietario(),reads=b.reads;
 assert.equal(b.call('activate',{code:initial,principal:false}).code,'ACCESS_DENIED');
 assert.equal(b.call('activate',{code:initial,principal:true,name:' '}).ok,false);
 const principal=b.call('activate',{code:initial,principal:true,name:' Luis   Pineda '});
 assert(principal.ok,principal.error);assert.equal(principal.owner,true);assert.equal(principal.name,'Luis Pineda');
 assert.equal(b.call('status',{token:principal.token}).name,'Luis Pineda');
 assert.equal(b.call('activate',{code:initial,principal:true,name:'Otro nombre'}).ok,false);
 const invite=b.call('invite',{token:principal.token});assert(invite.ok);
 assert.equal(b.call('activate',{code:invite.code,principal:true,name:'Otra persona'}).code,'ACCESS_DENIED');
 const member=b.call('activate',{code:invite.code,principal:false});assert(member.ok,member.error);assert.equal(member.owner,false);
 assert.equal(b.call('invite',{token:member.token}).code,'ACCESS_DENIED');assert.equal(b.reads,reads);
});
test('Cliente rechaza un código compartido como principal y conserva el nombre después de activar',async()=>{
 const endpoint='https://script.google.com/macros/s/TEST/exec',state=new Map([['endpoint',endpoint]]);
 const geo=JSON.parse(fs.readFileSync(path.join(ROOT,'data/lotes-mapa.geojson')));let calls=0;
 const client=tsModule('src/lib/api.ts',name=>{
  if(name==='@capacitor/core')return {Capacitor:{isNativePlatform:()=>false}};
  if(name.endsWith('geojson?raw'))return {default:JSON.stringify(geo)};
  if(name==='./riego-model')return model;
  if(name==='./access')return access;
  if(name==='./drive-transport')return transport;
  if(name==='./connection')return connection;
  if(name==='./riego-offline')return {cached:async k=>state.get(k),cache:async(k,v)=>state.set(k,v),clearAccessState:async()=>{state.delete('session');state.delete('activated');}};
  return require(name);
 },{AbortSignal,fetch:async(url,options)=>{calls++;assert.equal(url,connection.RIEGO_ENDPOINT);if(options.method==='GET')return greetingReply();const p=JSON.parse(options.body);assert.equal(p.principal,true);assert.equal(p.name,'Luis Pineda');return webReply({ok:true,token:'a'.repeat(64),owner:true,name:p.name,units:{}});}});
 await assert.rejects(()=>client.api('activate',{code:'ABCDEFGH2345',principal:true,name:'Luis Pineda'}));assert.equal(calls,0);assert(!state.has('session'));
 await client.api('activate',{code:'A'.repeat(64),principal:true,name:' Luis   Pineda '});assert.equal(calls,2);
 const snapshot=await client.api('records');assert.equal(snapshot.owner,true);assert.equal(snapshot.profileName,'Luis Pineda');assert.equal(snapshot.geojson.features.length,254);
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
  if(name==='./drive-transport')return transport;
  if(name==='./connection')return connection;
  if(name==='./riego-offline')return {cached:async k=>state.get(k),cache:async(k,v)=>state.set(k,v),clearAccessState:async()=>{state.delete('session');state.delete('activated');}};
  return require(name);
 },{AbortSignal,fetch:async(_url,options)=>{calls++;if(calls===2)throw new Error('Sin conexión');const p=JSON.parse(options.body);return webReply({ok:true,acknowledged:p.records.map(r=>r.id),records:p.records,units:{}});}});
 await assert.rejects(()=>client.api('sync',{}));
 assert.equal(state.get('snapshot').records.filter(r=>r.synced).length,100);assert.equal(state.get('snapshot').records.filter(r=>!r.synced).length,50);
});

test('Android envía JSON como texto y lee la respuesta de Google con GET sin reenviar credenciales',async()=>{
 const endpoint='https://script.google.com/macros/s/TEST/exec',content='https://script.googleusercontent.com/macros/echo?user_content_key=RESULT';
 const payload={action:'activate',code:'A'.repeat(64),principal:true,name:'Luis Pineda'},calls=[];
 const result=await transport.postDriveNative(endpoint,payload,{request:async options=>{
  calls.push(options);
  if(calls.length===1)return {status:302,headers:{Location:content},url:endpoint,data:'Moved'};
  return {status:200,headers:{'Content-Type':'application/json'},url:content,data:{ok:true,owner:true,token:'a'.repeat(64)}};
 }});
 assert.equal(result.ok,true);assert.equal(calls.length,2);
 assert.equal(calls[0].method,'POST');assert.equal(calls[0].url,endpoint);assert.equal(calls[0].data,JSON.stringify(payload));assert.equal(calls[0].headers['Content-Type'],'text/plain;charset=UTF-8');assert.equal(calls[0].disableRedirects,true);
 assert.equal(calls[1].method,'GET');assert.equal(calls[1].url,content);assert(!('data' in calls[1]));assert(!JSON.stringify(calls[1]).includes(payload.code));
});
test('La redirección dentro de la misma implementación conserva el POST; el resultado se lee una vez',async()=>{
 const endpoint='https://script.google.com/macros/s/TEST/exec',calls=[];
 const result=await transport.postDriveNative(endpoint,{action:'status',token:'a'.repeat(64)},{request:async options=>{
  calls.push(options);
  if(calls.length===1)return {status:302,headers:{location:'/macros/u/0/s/TEST/exec'},url:endpoint,data:''};
  if(calls.length===2)return {status:303,headers:{LOCATION:'https://script.googleusercontent.com/macros/echo?user_content_key=RESULT'},url:options.url,data:''};
  return {status:200,headers:{'content-type':'application/json'},url:options.url,data:'\uFEFF{"ok":true,"owner":true}'};
 }});
 assert.equal(result.ok,true);assert.equal(calls.length,3);assert.deepEqual(calls.map(o=>o.method),['POST','POST','GET']);assert.equal(calls[0].data,calls[1].data);assert(!('data' in calls[2]));
});
test('Android rechaza destinos externos y páginas de inicio de sesión antes de enviarles datos',async()=>{
 const endpoint='https://script.google.com/macros/s/TEST/exec';
 for(const destination of ['https://accounts.google.com/signin','https://script.googleusercontent.com.evil.example/macros/echo','http://script.googleusercontent.com/macros/echo','https://script.google.com/macros/s/OTHER/exec','https://user:secret@script.googleusercontent.com/macros/echo']){
  let calls=0;
  await assert.rejects(()=>transport.postDriveNative(endpoint,{action:'activate',code:'A'.repeat(64)},{request:async()=>{calls++;return {status:302,headers:{Location:destination},url:endpoint,data:''};}}));
  assert.equal(calls,1);
 }
});
test('Un fallo leyendo el resultado nunca vuelve a enviar un código de activación de un solo uso',async()=>{
 const calls=[],endpoint='https://script.google.com/macros/s/TEST/exec';
 await assert.rejects(()=>transport.postDriveNative(endpoint,{action:'activate',code:'A'.repeat(64)},{request:async options=>{
  calls.push(options);if(calls.length===1)return {status:302,headers:{location:'https://script.googleusercontent.com/macros/echo?user_content_key=RESULT'},url:endpoint,data:''};
  throw new Error('Se perdió la conexión al leer el resultado');
 }}));
 assert.equal(calls.length,2);assert.equal(calls.filter(o=>o.method==='POST').length,1);
});
test('Las respuestas no válidas indican su tipo sin copiar su contenido privado al error',()=>{
 const meta={status:200,url:'https://script.googleusercontent.com/macros/echo?user_content_key=PRIVATE_KEY',contentType:'text/html;charset=utf-8'};
 for(const body of ['<!doctype html><html><body>PRIVATE_TOKEN</body></html>','',null,[],{other:'PRIVATE_TOKEN'}]){
  assert.throws(()=>transport.parseDriveReply(body,meta),error=>{assert(!error.message.includes('PRIVATE_TOKEN'));assert(!error.message.includes('PRIVATE_KEY'));assert(error.message.includes('HTTP 200'));return true;});
 }
 assert.equal(transport.parseDriveReply('{"ok":false,"code":"ACCESS_DENIED"}',{status:200}).code,'ACCESS_DENIED');
 assert.equal(transport.parseDriveReply(JSON.stringify(JSON.stringify({ok:true})),{status:200}).ok,true);
});
test('Android limita los saltos de redirección y rechaza un Location ausente',async()=>{
 const endpoint='https://script.google.com/macros/s/TEST/exec';let calls=0;
 await assert.rejects(()=>transport.postDriveNative(endpoint,{action:'status'},{request:async()=>{calls++;return {status:302,headers:{Location:endpoint},url:endpoint,data:''};}}));assert.equal(calls,5);
 await assert.rejects(()=>transport.postDriveNative(endpoint,{action:'status'},{request:async()=>({status:302,headers:{},url:endpoint,data:''})}));
});
test('La activación nativa conserva nombre y sesión después de leer la redirección de Google',async()=>{
 const endpoint=connection.RIEGO_ENDPOINT,state=new Map([['endpoint','https://script.google.com/macros/s/OTHER/exec']]),calls=[];
 const geo=JSON.parse(fs.readFileSync(path.join(ROOT,'data/lotes-mapa.geojson')));
 const client=tsModule('src/lib/api.ts',name=>{
  if(name==='@capacitor/core')return {Capacitor:{isNativePlatform:()=>true},CapacitorHttp:{request:async options=>{
   calls.push(options);
   if(options.url===endpoint&&options.method==='GET')return {status:302,headers:{Location:'https://script.googleusercontent.com/macros/echo?user_content_key=GREETING'},url:endpoint,data:''};
   if(options.url.endsWith('user_content_key=GREETING'))return {status:200,headers:{'Content-Type':'text/plain'},url:options.url,data:greeting};
   if(options.method==='POST')return {status:302,headers:{Location:'https://script.googleusercontent.com/macros/echo?user_content_key=RESULT'},url:endpoint,data:''};
   const p=JSON.parse(calls[2].data);assert.equal(p.action,'activate');assert.equal(p.principal,true);assert.equal(p.name,'Luis Pineda');
   return {status:200,headers:{'Content-Type':'application/json'},url:options.url,data:JSON.stringify({ok:true,token:'a'.repeat(64),owner:true,name:p.name,units:{}})};
  }}};
  if(name.endsWith('geojson?raw'))return {default:JSON.stringify(geo)};
  if(name==='./riego-model')return model;if(name==='./access')return access;if(name==='./drive-transport')return transport;
  if(name==='./connection')return connection;
  if(name==='./riego-offline')return {cached:async k=>state.get(k),cache:async(k,v)=>state.set(k,v),clearAccessState:async()=>{state.delete('session');state.delete('activated');}};
  return require(name);
 });
 await client.api('activate',{code:'A'.repeat(64),principal:true,name:' Luis   Pineda '});
 assert.equal(calls.length,4);assert.deepEqual(calls.map(o=>o.method),['GET','GET','POST','GET']);assert(calls.filter(o=>o.method==='GET').every(o=>!('data' in o)));assert.equal(calls[2].url,endpoint);assert.equal(state.get('endpoint'),endpoint);assert.equal(state.get('session').token,'a'.repeat(64));assert.equal(state.get('activated'),true);
 const snapshot=await client.api('records');assert.equal(snapshot.owner,true);assert.equal(snapshot.profileName,'Luis Pineda');assert.equal(snapshot.geojson.features.length,254);
});

test('Comprobar la conexión usa GET sin clave y permite una redirección dentro de la implementación',async()=>{
 const endpoint='https://script.google.com/macros/s/TEST/exec',calls=[];
 await transport.verifyDriveNative(endpoint,{request:async options=>{
  calls.push(options);
  if(calls.length===1)return {status:302,headers:{Location:'/macros/u/0/s/TEST/exec'},url:endpoint,data:''};
  if(calls.length===2)return {status:302,headers:{Location:'https://script.googleusercontent.com/macros/echo?user_content_key=GREETING'},url:options.url,data:''};
  return {status:200,headers:{'Content-Type':'text/plain'},url:options.url,data:'\uFEFF'+greeting};
 }});
 assert.equal(calls.length,3);assert(calls.every(o=>o.method==='GET'&&!('data' in o)));
});

function activationClient(nativeRequest,state=new Map()){
 const geo=JSON.parse(fs.readFileSync(path.join(ROOT,'data/lotes-mapa.geojson')));
 return tsModule('src/lib/api.ts',name=>{
  if(name==='@capacitor/core')return {Capacitor:{isNativePlatform:()=>true},CapacitorHttp:{request:nativeRequest}};
  if(name.endsWith('geojson?raw'))return {default:JSON.stringify(geo)};
  if(name==='./riego-model')return model;if(name==='./access')return access;if(name==='./drive-transport')return transport;if(name==='./connection')return connection;
  if(name==='./riego-offline')return {cached:async k=>state.get(k),cache:async(k,v)=>state.set(k,v),clearAccessState:async()=>{state.delete('session');state.delete('activated');}};
  return require(name);
 });
}
test('La activación no envía ni consume una clave cuando la conexión responde con otro servicio',async()=>{
 const state=new Map(),calls=[];
 const client=activationClient(async options=>{calls.push(options);return {status:200,headers:{'Content-Type':'application/json'},url:options.url,data:{ok:false,private:'PRIVATE_TOKEN'}};},state);
 await assert.rejects(()=>client.api('activate',{principal:true,name:'Luis Pineda',code:'A'.repeat(64)}),e=>e.message.includes('[RIEGO_CONNECTION]')&&!e.message.includes('PRIVATE_TOKEN'));
 assert.equal(calls.length,1);assert.equal(calls[0].method,'GET');assert.equal(calls[0].url,connection.RIEGO_ENDPOINT);assert(!('data' in calls[0]));assert(!state.has('session'));assert(!state.has('activated'));
});
test('Una comprobación de red fallida tampoco envía la clave ni guarda una sesión',async()=>{
 const state=new Map(),calls=[];
 const client=activationClient(async options=>{calls.push(options);throw new Error('Network error');},state);
 await assert.rejects(()=>client.api('activate',{principal:true,name:'Luis Pineda',code:'A'.repeat(64)}),/RIEGO_CONNECTION/);
 assert.equal(calls.length,1);assert.equal(calls[0].method,'GET');assert(!state.has('session'));
});
test('Un rechazo sin explicación muestra versión y operación sin exponer la clave',async()=>{
 const state=new Map(),calls=[];
 const client=activationClient(async options=>{calls.push(options);return {status:200,headers:{'Content-Type':options.method==='GET'?'text/plain':'application/json'},url:options.url,data:options.method==='GET'?greeting:{ok:false}};},state);
 await assert.rejects(()=>client.api('activate',{principal:true,name:'Luis Pineda',code:'A'.repeat(64)}),e=>e.message.includes(connection.APP_VERSION)&&e.message.includes('activate')&&e.message.includes('[RIEGO_REPLY_REJECTED]')&&!e.message.includes('A'.repeat(64)));
 assert.equal(calls.length,2);assert.equal(calls[1].method,'POST');assert(!state.has('session'));
});

test('Cliente y Apps Script: verificar, activar el principal y dar acceso a un segundo dispositivo',async()=>{
 const b=backend(),initial=b.context.crearAccesoPropietario(),ownerState=new Map(),memberState=new Map([['endpoint',connection.RIEGO_ENDPOINT]]),calls=[];
 const http=async options=>{
  calls.push(options);
  if(options.method==='GET')return {status:200,headers:{'Content-Type':'text/plain'},url:options.url,data:b.context.doGet().text};
  return {status:200,headers:{'Content-Type':'application/json'},url:options.url,data:b.context.doPost({postData:{contents:options.data}}).text};
 };
 const principal=activationClient(http,ownerState);
 await principal.api('activate',{principal:true,name:'Luis Pineda',code:initial});
 assert.equal(ownerState.get('session').owner,true);assert.equal(ownerState.get('session').name,'Luis Pineda');assert(!b.props.RIEGO_INITIAL_HASH);
 const invite=await principal.api('invite');
 const member=activationClient(http,memberState);
 await member.api('activate',{principal:false,code:invite.code});
 assert.equal(memberState.get('session').owner,false);assert.equal((await member.api('status')).ok,true);
 await assert.rejects(()=>member.api('invite'),/no puede entregar accesos/);
 assert.equal(calls.filter(o=>o.method==='GET').length,2);assert(calls.filter(o=>o.method==='GET').every(o=>!('data' in o)));
});
