import {useState, useEffect, type FormEvent} from "react";
import {ArrowLeft, ArrowRight, Droplets, QrCode, UserRound} from "lucide-react";
import {APP_VERSION,RIEGO_ENDPOINT,RIEGO_FILE_LABEL} from "@/lib/connection";

export type ActivationInput = {endpoint: string; code: string; principal: boolean; name?: string};
type Props = {
  sharedEntry: number;
  endpoint: string;
  code: string;
  busy: boolean;
  online: boolean;
  problem: string;
  onEndpoint: (value: string) => void;
  onCode: (value: string) => void;
  onActivate: (input: ActivationInput) => Promise<void>;
  onScan: () => Promise<void>;
  onClearProblem: () => void;
};

export default function RiegoOnboarding(props: Props) {
  const [screen, setScreen] = useState<"welcome" | "profile" | "connection" | "member">(() => props.code ? "member" : "welcome");
  const [name, setName] = useState("");
  const [manualConnection, setManualConnection] = useState(false);
  useEffect(() => {if (props.sharedEntry > 0) setScreen("member");}, [props.sharedEntry]);
  function go(next: typeof screen) {props.onClearProblem(); props.onCode(""); setScreen(next);}
  function submit(event: FormEvent) {
    event.preventDefault();
    if (screen === "profile") {setScreen("connection"); return;}
    if (screen === "member" && !props.endpoint && !props.code.includes("://")) setManualConnection(true);
    void props.onActivate({endpoint: screen === "connection" ? RIEGO_ENDPOINT : props.endpoint, code: props.code, principal: screen === "connection", ...(screen === "connection" ? {name: name.trim()} : {})});
  }
  return <div className="activation"><main className="activation-card">
    {screen !== "welcome" && <button type="button" className="onboarding-back" disabled={props.busy} onClick={() => go(screen === "connection" ? "profile" : "welcome")}><ArrowLeft size={17}/>Volver</button>}
    <div className="brandmark"><Droplets size={30}/></div>
    {screen === "welcome" ? <>
      <p className="eyebrow">BIENVENIDO</p><h1>Riego</h1>
      <p>Configura primero tu acceso principal. Desde ahí podrás dar acceso a tu equipo.</p>
      <button type="button" className="primary full" onClick={() => go("profile")}><UserRound size={19}/>Crear mi acceso principal</button>
      <button type="button" className="text-button onboarding-member" onClick={() => go("member")}>Tengo un código o QR</button>
    </> : screen === "profile" ? <>
      <p className="eyebrow">PASO 1 DE 2</p><h1>Tu acceso principal</h1>
      <p>Empieza con tus datos. Este será el dispositivo desde el que crearás los demás accesos.</p>
      <form onSubmit={submit}>
        <label className="field"><span>Nombre y apellidos</span><input value={name} onChange={event => setName(event.target.value)} placeholder="Escribe tu nombre" autoComplete="name" minLength={2} maxLength={80} required autoFocus/></label>
        <button className="primary full" disabled={name.trim().length < 2}>Continuar<ArrowRight size={18}/></button>
      </form>
    </> : screen === "connection" ? <>
      <p className="eyebrow">PASO 2 DE 2</p><h1>Activa tu acceso</h1>
      <p><strong>{name.trim()}</strong>, la conexión de tu archivo ya está preparada. Pega tu clave inicial para crear tu acceso principal.</p>
      <div className="prepared-connection"><strong>{RIEGO_FILE_LABEL}</strong><span>Humedades · Compactación · Presiones</span></div>
      <form onSubmit={submit} className="onboarding-fields">
        <label className="field"><span>Clave inicial de configuración</span><input type="password" value={props.code} onChange={event => props.onCode(event.target.value)} placeholder="Pega tu clave inicial" autoComplete="off" spellCheck={false} maxLength={80} required/><small>Esta clave crea tu acceso principal. Los códigos para tu equipo se generan después.</small></label>
        <button className="primary full" disabled={props.busy || !props.online}>{props.busy ? "Creando tu acceso…" : "Crear mi acceso y entrar"}</button>
      </form>
    </> : <>
      <p className="eyebrow">ACCESO COMPARTIDO</p><h1>Entra a Riego</h1>
      <p>Usa el acceso que te entregó el dispositivo principal.</p>
      <button type="button" className="primary full" onClick={() => void props.onScan()} disabled={props.busy || !props.online}><QrCode size={19}/>Escanear mi QR</button>
      <div className="onboarding-divider"><span>o ingresa tu acceso</span></div>
      <form onSubmit={submit}>
        <label className="field"><span>Código o enlace recibido</span><input value={props.code} onChange={event => props.onCode(event.target.value)} placeholder="Código de 12 caracteres" autoComplete="off" spellCheck={false} required/></label>
        <details className="connection-details" open={manualConnection} onToggle={event => setManualConnection(event.currentTarget.open)}><summary>Ingresar solo con el código</summary>
          <label className="field"><span>Enlace compartido</span><input type="url" value={props.endpoint} onChange={event => props.onEndpoint(event.target.value)} placeholder="Pega el enlace que te compartieron" autoComplete="off"/></label>
          <p className="small">El QR y el enlace de acceso completan este dato automáticamente.</p>
        </details>
        <button className="secondary full" disabled={props.busy || !props.online}>{props.busy ? "Ingresando…" : "Entrar con mi acceso"}</button>
      </form>
    </>}
    {!props.online && screen !== "welcome" && <p className="onboarding-note">La primera activación requiere internet.</p>}
    {props.problem && screen !== "welcome" && <p role="alert" className="error-note">{props.problem}</p>}
    <footer className="onboarding-version">Riego {APP_VERSION}</footer>
  </main></div>;
}
