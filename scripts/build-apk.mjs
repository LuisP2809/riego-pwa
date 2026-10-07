import {spawn} from "node:child_process";
const release=process.argv[2]==="release";
if(release&&!process.env.RIEGO_KEYSTORE_PATH)throw new Error("La firma Android debe suministrarse fuera del repositorio.");
const child=spawn(process.platform==="win32"?"gradlew.bat":"./gradlew",[release?"assembleRelease":"assembleDebug","--no-daemon"],{cwd:new URL("../android/",import.meta.url),stdio:"inherit",shell:process.platform==="win32"});
const code=await new Promise((resolve,reject)=>{child.on("error",reject);child.on("close",resolve);});
if(code!==0)throw new Error(`La compilación Android terminó con código ${code}.`);
