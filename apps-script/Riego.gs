// Riego Android y PWA. Publica como aplicación web ejecutada por ti.
// Los accesos se validan antes de leer o escribir. Nunca publiques tu código inicial.
const RIEGO_FILE='1JgvxAAqxLuPGjLkBoj6XpHl3f8n_8Q9ouavMOb8BRfA';
const RIEGO_HEADERS={
 HUMEDADES:['AÑO','MES','SEMANA','FECHA','LUGAR','FUNDO','MODULO','LOTE','PROF','%HUMEDAD'],
 COMPACTACION:['AÑO','MES','SEMANA','FECHA','LUGAR','FUNDO','MODULO','LOTE','PUNTOS','M1','M2','M3'],
 PRESIONES:['AÑO','MES','SEMANA','FECHA','LUGAR','FUNDO','MODULO','LOTE','LADO','PRESION FINAL'],
 CALIDAD_AGUA:['AÑO','MES','SEMANA','FECHA','LUGAR','FILTRADO','PH','C.E','Na','Ca']
};
const RIEGO_WATER_FILTERS={OLMOS:['FILTRADO PESQUERA','FILTRADO CHOLOCAL'],MOTUPE:['FRANCO','CHOLOQUE','PALACIOS','CHOC CHOC','ANDINA']};
function hoja_(book,kind){const name=kind==='CALIDAD_AGUA'?'CALIDAD AGUA':kind,s=book.getSheetByName(name);if(!s)throw new Error('Falta la hoja '+name);const e=RIEGO_HEADERS[kind],a=s.getRange(1,1,1,e.length).getDisplayValues()[0];if(e.some(function(h,i){return a[i].trim()!==h;}))throw new Error('Columnas distintas en '+name);return s;}
function filtradoAgua_(r){const site=String(r.lugar||'').trim().toUpperCase(),value=String(r.filtrado||'').trim().toUpperCase().replace(/\s+/g,' '),allowed=RIEGO_WATER_FILTERS[site]||[];if(allowed.indexOf(value)<0)throw new Error('Selecciona un filtrado de la sede elegida.');return value;}
function idNota_(note){const m=String(note||'').match(/RIEGO_ID:([a-f0-9-]{36})/);return m?m[1]:'';}
function fecha_(v,tz){if(v instanceof Date&&!isNaN(v.getTime()))return Utilities.formatDate(v,tz,'yyyy-MM-dd');const s=String(v).trim();if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;const m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);if(m)return m[3]+'-'+('0'+m[2]).slice(-2)+'-'+('0'+m[1]).slice(-2);throw new Error('Fecha inválida: '+s);}
function num_(v,label,percentFormat){const raw=String(v).trim();if(!raw)throw new Error('Falta '+label);const n=typeof v==='number'?v:Number(raw.replace('%','').replace(',','.'));if(!isFinite(n)||n<0)throw new Error('Valor inválido: '+label);return percentFormat&&typeof v==='number'?n*100:n;}
function leer_(book,includeWaterQuality){
 const out=[];
 Object.keys(RIEGO_HEADERS).forEach(function(kind){
  if(kind==='CALIDAD_AGUA'&&!includeWaterQuality)return;
  const sheet=hoja_(book,kind),count=sheet.getLastRow()-1;if(count<1)return;
  const range=sheet.getRange(2,1,count,RIEGO_HEADERS[kind].length),values=range.getValues(),display=range.getDisplayValues(),formats=range.getNumberFormats(),notes=sheet.getRange(2,1,count,1).getNotes();
  values.forEach(function(v,i){
   if(v.every(function(cell){return cell==='';}))return;
   if(v.slice(3,kind==='CALIDAD_AGUA'?6:8).some(function(cell){return cell==='';}))throw new Error(kind+', fila '+(i+2)+': falta fecha o ubicación');
   let id=idNota_(notes[i][0]);if(!id){id=Utilities.getUuid();notes[i][0]=(notes[i][0]?notes[i][0]+'\n':'')+'RIEGO_ID:'+id;}
   const r={id:id,kind:kind,date:fecha_(v[3],book.getSpreadsheetTimeZone()),lugar:String(v[4])};
   if(kind==='CALIDAD_AGUA'){
    r.lugar=r.lugar.trim().toUpperCase();r.filtrado=String(v[5]);r.filtrado=filtradoAgua_(r);
    r.ph=num_(v[6],'PH');r.ce=num_(v[7],'C.E');r.na=num_(v[8],'Na');r.ca=num_(v[9],'Ca');
   }else{
    r.fundo=String(v[5]);r.modulo=String(v[6]);r.lote=String(v[7]);
    if(kind==='HUMEDADES'){r.prof=num_(v[8],'PROF');r.humedad=num_(v[9],'%HUMEDAD',formats[i][9].indexOf('%')>=0);if(r.humedad>100)throw new Error(kind+', fila '+(i+2)+': humedad mayor a 100%');}
    if(kind==='PRESIONES'){r.lado=String(display[i][8]);r.presion=num_(v[9],'PRESION FINAL');if(!r.lado.trim())throw new Error(kind+', fila '+(i+2)+': falta LADO');}
    if(kind==='COMPACTACION'){r.puntos=String(display[i][8]);r.m1=num_(v[9],'M1');r.m2=num_(v[10],'M2');r.m3=num_(v[11],'M3');if(!r.puntos.trim())throw new Error(kind+', fila '+(i+2)+': falta PUNTOS');}
   }
   out.push(r);
  });sheet.getRange(2,1,count,1).setNotes(notes);
 });return out;
}
function semana_(v){const d=new Date(v+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7));return Math.ceil((((d-new Date(Date.UTC(d.getUTCFullYear(),0,1)))/86400000)+1)/7);}
function validar_(r){
 if(!r||!RIEGO_HEADERS[r.kind]||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(r.id)||!/^\d{4}-\d{2}-\d{2}$/.test(r.date))throw new Error('Registro inválido');
 const fields=r.kind==='CALIDAD_AGUA'?['lugar','filtrado']:['lugar','fundo','modulo','lote'];
 fields.forEach(function(key){if(!String(r[key]||'').trim())throw new Error('Falta '+key);});
 const nums=r.kind==='HUMEDADES'?['prof','humedad']:r.kind==='PRESIONES'?['presion']:r.kind==='COMPACTACION'?['m1','m2','m3']:['ph','ce','na','ca'];
 nums.forEach(function(key){if(typeof r[key]!=='number'||!isFinite(r[key])||r[key]<0)throw new Error('Valor inválido: '+key);});
 if(r.kind==='HUMEDADES'&&r.humedad>100)throw new Error('Humedad mayor a 100%');
 if(r.kind==='PRESIONES'&&!String(r.lado||'').trim())throw new Error('Falta lado');
 if(r.kind==='COMPACTACION'&&!String(r.puntos||'').trim())throw new Error('Falta puntos');
 if(r.kind==='CALIDAD_AGUA')filtradoAgua_(r);
}
function texto_(v){v=String(v);return /^[=+@-]/.test(v)?"'"+v:v;}
function respuesta_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}

function hash_(value){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(value),Utilities.Charset.UTF_8).map(function(n){return ('0'+(n&255).toString(16)).slice(-2);}).join('');}
function token_(){return Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'');}
function configurarRiego(){
 const props=PropertiesService.getScriptProperties(),book=SpreadsheetApp.openById(RIEGO_FILE);
 Object.keys(RIEGO_HEADERS).forEach(function(k){hoja_(book,k);});
 props.setProperty('RIEGO_SPREADSHEET_ID',RIEGO_FILE);
 if(!props.getProperty('RIEGO_UNITS'))props.setProperty('RIEGO_UNITS',JSON.stringify({prof:'',compactacion:'',presion:''}));
 crearAccesoPropietario();
 console.log('Las cuatro hojas se verificaron. Implementa como aplicación web: ejecutar como tú, acceso Cualquier usuario.');
}
function verificarCalidadAgua(){
 const props=PropertiesService.getScriptProperties(),book=SpreadsheetApp.openById(props.getProperty('RIEGO_SPREADSHEET_ID')||RIEGO_FILE);
 hoja_(book,'CALIDAD_AGUA');console.log('CALIDAD AGUA verificada: AÑO, MES, SEMANA, FECHA, LUGAR, FILTRADO, PH, C.E, Na, Ca. Los accesos existentes se conservan.');
}
function crearAccesoPropietario(){
 const code=token_().toUpperCase(),props=PropertiesService.getScriptProperties();
 props.setProperty('RIEGO_INITIAL_HASH',hash_(code));
 props.setProperty('RIEGO_INITIAL_EXPIRY',String(Date.now()+86400000));
 console.log('Código inicial para TU dispositivo. Se usa una vez y vence en 24 horas:\n'+code);
 return code;
}
function units_(props){return JSON.parse(props.getProperty('RIEGO_UNITS')||'{}');}
function negar_(message){const e=new Error(message||'Acceso no autorizado');e.accessDenied=true;throw e;}
function session_(props,p){
 if(typeof p.token!=='string'||!/^[a-f0-9]{64}$/.test(p.token))negar_();
 const key='DEVICE_'+hash_(p.token),raw=props.getProperty(key);
 if(!raw)negar_('Este dispositivo ya no tiene acceso. Solicita un nuevo código.');
 const device=JSON.parse(raw);if(device.revokedAt)negar_('El dispositivo principal retiró este acceso. Solicita un nuevo código.');if(device.closedAt)negar_('Este acceso se cerró. Solicita un nuevo código.');if(device.expiresAt<=Date.now())negar_('El acceso del dispositivo venció.');
 return {key:key,owner:device.owner===true,name:String(device.name||''),accessId:String(device.id||'')};
}
function nombreAcceso_(value,required){const name=String(value||'').trim().replace(/\s+/g,' ');if(name.length>80||(required&&name.length<2))throw new Error('Escribe un nombre de 2 a 80 caracteres para este acceso.');return name;}
function activar_(props,p){
 const code=String(p.code||'').replace(/\s+/g,'').toUpperCase(),now=Date.now(),hash=hash_(code);
 let owner=false,inviteKey='',invite=null;
 if(/^[A-F0-9]{64}$/.test(code)&&props.getProperty('RIEGO_INITIAL_HASH')===hash&&Number(props.getProperty('RIEGO_INITIAL_EXPIRY'))>now)owner=true;
 else{
  if(!/^[A-Z0-9]{12}$/.test(code))negar_('Código inválido o vencido.');
  inviteKey='INVITE_'+hash;const raw=props.getProperty(inviteKey);invite=raw?JSON.parse(raw):null;
  if(!invite||invite.cancelledAt||invite.expiresAt<=now)negar_('Código inválido, vencido o utilizado.');
 }
 if(p.principal===true&&!owner)negar_('Para crear el acceso principal necesitas la clave inicial de configuración.');
 if(p.principal===false&&owner)negar_('Usa Crear mi acceso principal para configurar tu dispositivo.');
 const name=nombreAcceso_(invite&&invite.name?invite.name:p.name,false);
 if(name.length>80||(p.principal===true&&name.length<2))throw new Error('Escribe tu nombre y apellidos.');
 const token=token_(),id=invite&&invite.id?invite.id:Utilities.getUuid();props.setProperty('DEVICE_'+hash_(token),JSON.stringify({id:id,owner:owner,name:name,createdAt:now,invitedAt:invite?invite.createdAt||0:0,expiresAt:now+366*86400000}));
 if(owner){props.deleteProperty('RIEGO_INITIAL_HASH');props.deleteProperty('RIEGO_INITIAL_EXPIRY');}else props.deleteProperty(inviteKey);
 return {ok:true,token:token,owner:owner,name:name,accessId:id,units:units_(props)};
}
function invitacion_(props,p){
 const name=nombreAcceso_(p&&p.name,p&&p.accessManagement===true);
 const all=props.getProperties(),now=Date.now();let active=0;
 Object.keys(all).filter(function(k){return k.indexOf('INVITE_')===0;}).forEach(function(k){const v=JSON.parse(all[k]);if(!v.cancelledAt&&v.expiresAt>now)active++;});
 if(active>=100)throw new Error('Ya hay 100 códigos sin utilizar. Espera a que venzan.');
 const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,token_(),Utilities.Charset.UTF_8),alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
 let code='';for(let i=0;i<12;i++)code+=alphabet[(bytes[i]&255)%alphabet.length];
 const expiresAt=now+86400000,id=Utilities.getUuid();props.setProperty('INVITE_'+hash_(code),JSON.stringify({id:id,name:name,createdAt:now,expiresAt:expiresAt}));
 return {ok:true,id:id,name:name,code:code,expiresAt:expiresAt};
}
// Access IDs are public references; token and invitation hashes stay in Script Properties.
// Existing sessions are assigned IDs under the script lock without replacing their tokens.
function accesoPublico_(key,value,now){
 const invitation=key.indexOf('INVITE_')===0;
 const status=invitation?(value.cancelledAt?'cancelled':value.expiresAt<=now?'expired':'pending'):(value.revokedAt?'revoked':value.closedAt?'closed':value.expiresAt<=now?'expired':'active');
 return {id:value.id,kind:invitation?'invitation':'device',name:String(value.name||''),status:status,createdAt:invitation?value.createdAt||0:value.invitedAt||value.createdAt||0,activatedAt:invitation?0:value.createdAt||0,expiresAt:value.expiresAt||0};
}
function accesos_(props){
 const all=props.getProperties(),rows=[],now=Date.now();
 Object.keys(all).filter(function(key){return /^(DEVICE|INVITE)_[a-f0-9]{64}$/.test(key);}).forEach(function(key){
  const value=JSON.parse(all[key]);if(value.owner===true)return;
  if(!value.id){value.id=Utilities.getUuid();props.setProperty(key,JSON.stringify(value));}
  rows.push(accesoPublico_(key,value,now));
 });
 rows.sort(function(a,b){return (b.activatedAt||b.createdAt)-(a.activatedAt||a.createdAt)||a.id.localeCompare(b.id);});
 return {ok:true,accesses:rows,capabilities:{accessManagement:true}};
}
function buscarAcceso_(props,id){
 if(typeof id!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id))throw new Error('Referencia de acceso inválida.');
 const all=props.getProperties(),keys=Object.keys(all).filter(function(key){return /^(DEVICE|INVITE)_[a-f0-9]{64}$/.test(key);});
 for(let i=0;i<keys.length;i++){const value=JSON.parse(all[keys[i]]);if(value.id===id)return {key:keys[i],value:value};}
 throw new Error('Este acceso ya no está disponible. Actualiza la lista.');
}
function gestionarAcceso_(props,p,session){
 const entry=buscarAcceso_(props,p.id),value=entry.value,invitation=entry.key.indexOf('INVITE_')===0;
 if(value.owner===true||entry.key===session.key)throw new Error('El acceso principal se conserva; no se puede retirar desde esta lista.');
 if(p.action==='access_rename')value.name=nombreAcceso_(p.name,true);
 else if(p.action==='access_cancel'){if(!invitation)throw new Error('El QR ya fue activado. Actualiza la lista para retirar el acceso del dispositivo.');value.cancelledAt=value.cancelledAt||Date.now();}
 else if(p.action==='access_revoke'){if(invitation)throw new Error('Este QR está pendiente. Usa Cancelar QR.');value.revokedAt=value.revokedAt||Date.now();}
 else throw new Error('Operación de acceso desconocida.');
 props.setProperty(entry.key,JSON.stringify(value));
 return {ok:true,access:accesoPublico_(entry.key,value,Date.now())};
}
function verificarGestionAccesos(){
 const all=PropertiesService.getScriptProperties().getProperties();let devices=0;
 Object.keys(all).filter(function(key){return /^DEVICE_[a-f0-9]{64}$/.test(key);}).forEach(function(key){if(JSON.parse(all[key]).owner!==true)devices++;});
 console.log('Gestión de accesos preparada: nombres, lista, cancelar QR y retirar acceso. '+devices+' dispositivos compartidos existentes se conservan. No se crearon códigos ni se retiraron accesos.');
}
function configuracion_(props,p){
 const units=p.units||{},out={};['prof','compactacion','presion'].forEach(function(k){const value=String(units[k]||'').trim();if(value.length>30)throw new Error('Unidad demasiado larga');out[k]=value;});
 props.setProperty('RIEGO_UNITS',JSON.stringify(out));return {ok:true,units:out};
}
function sync_(props,p){
 if(!Array.isArray(p.records)||p.records.length>100)throw new Error('Envía hasta 100 mediciones por solicitud.');
 p.records.forEach(function(r){validar_(r);const d=new Date(r.date+'T12:00:00Z');if(!isFinite(d.getTime())||d.toISOString().slice(0,10)!==r.date)throw new Error('Fecha inválida');['lugar','fundo','modulo','lote','lado','puntos','filtrado'].forEach(function(k){if(r[k]!=null&&String(r[k]).length>100)throw new Error('Campo demasiado largo');});});
 const book=SpreadsheetApp.openById(props.getProperty('RIEGO_SPREADSHEET_ID')),ids={};
 leer_(book,true).forEach(function(r){ids[r.id]=r;});
 // Validate every conflict before appending rows, so a bad batch cannot partly append.
 const proposed={};p.records.forEach(function(r){const existing=ids[r.id]||proposed[r.id];if(existing&&Object.keys(existing).some(function(k){return String(existing[k])!==String(r[k]);}))throw new Error('El registro '+r.id+' ya existe con otros valores en Drive.');proposed[r.id]=r;});
 const acknowledged=[];
 p.records.forEach(function(r){
  if(ids[r.id]){acknowledged.push(r.id);return;}
  const s=hoja_(book,r.kind),next=s.getLastRow()+1,values=[Number(r.date.slice(0,4)),Number(r.date.slice(5,7)),semana_(r.date),new Date(r.date+'T12:00:00-05:00'),texto_(r.lugar)];
  if(r.kind==='CALIDAD_AGUA')values.push(texto_(filtradoAgua_(r)),r.ph,r.ce,r.na,r.ca);
  else values.push(texto_(r.fundo),texto_(r.modulo),texto_(r.lote));
  if(r.kind==='HUMEDADES')values.push(r.prof,r.humedad);
  if(r.kind==='PRESIONES')values.push(texto_(r.lado),r.presion);
  if(r.kind==='COMPACTACION')values.push(texto_(r.puntos),r.m1,r.m2,r.m3);
  s.getRange(next,1).setNote('RIEGO_ID:'+r.id);s.getRange(next,1,1,values.length).setValues([values]);s.getRange(next,4).setNumberFormat('dd/mm/yyyy');
  if(r.kind==='HUMEDADES')s.getRange(next,10).setNumberFormat('0.00');
  ids[r.id]=r;acknowledged.push(r.id);
 });
 SpreadsheetApp.flush();return {ok:true,acknowledged:acknowledged,records:leer_(book,p.includeWaterQuality===true),units:units_(props),capabilities:{waterQuality:true}};
}
function doPost(e){
 let lock;
 try{
  if(!e||!e.postData||e.postData.contents.length>250000)throw new Error('Solicitud inválida');
  const p=JSON.parse(e.postData.contents),props=PropertiesService.getScriptProperties();
  if(p.action==='activate'){
   lock=LockService.getScriptLock();lock.waitLock(30000);return respuesta_(activar_(props,p));
  }
  const session=session_(props,p);
  if(p.action==='status')return respuesta_({ok:true,owner:session.owner,name:session.name,accessId:session.accessId,capabilities:{waterQuality:true,accessManagement:true}});
  if(['invite','config','accesses','access_rename','access_cancel','access_revoke'].indexOf(p.action)>=0&&!session.owner)negar_('Este dispositivo no puede entregar accesos ni cambiar la conexión.');
  if(['sync','invite','config','logout','accesses','access_rename','access_cancel','access_revoke'].indexOf(p.action)<0)throw new Error('Operación desconocida');
  lock=LockService.getScriptLock();lock.waitLock(30000);
  // Recheck after acquiring the lock, including expiration or revocation during the wait.
  session_(props,p);
  if(p.action==='sync')return respuesta_(sync_(props,p));
  if(p.action==='invite')return respuesta_(invitacion_(props,p));
  if(p.action==='accesses')return respuesta_(accesos_(props));
  if(['access_rename','access_cancel','access_revoke'].indexOf(p.action)>=0)return respuesta_(gestionarAcceso_(props,p,session));
  if(p.action==='config')return respuesta_(configuracion_(props,p));
  const device=JSON.parse(props.getProperty(session.key));device.closedAt=Date.now();props.setProperty(session.key,JSON.stringify(device));return respuesta_({ok:true});
 }catch(error){return respuesta_({ok:false,error:String(error.message||error),code:error.accessDenied?'ACCESS_DENIED':'REQUEST_ERROR'});}
 finally{if(lock&&lock.hasLock())lock.releaseLock();}
}
function doGet(){return ContentService.createTextOutput('Riego: activa un dispositivo mediante un código o QR. Las mediciones requieren autorización.');}
