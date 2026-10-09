import {readFile,writeFile,copyFile,mkdir} from "node:fs/promises";
const root=new URL("../",import.meta.url);
const pkg=JSON.parse(await readFile(new URL("package.json",root),"utf8"));
const [major,minor,patch]=pkg.version.split(".").map(Number);
if([major,minor,patch].some(n=>!Number.isInteger(n)||n<0||n>999))throw new Error("Versión Android inválida");
const vars=new URL("android/variables.gradle",root);
await writeFile(vars,(await readFile(vars,"utf8")).replace(/minSdkVersion\s*=\s*\d+/,"minSdkVersion = 26"));
const gradle=new URL("android/app/build.gradle",root);
let text=await readFile(gradle,"utf8");
text=text.replace(/versionCode\s+\d+/,`versionCode ${major*1000000+minor*1000+patch}`).replace(/versionName\s+"[^"]+"/,`versionName "${pkg.version}"`);
// Sign release builds only with credentials supplied outside the repository.
if(!text.includes("RIEGO_KEYSTORE_PATH"))text+=`\nif (System.getenv('RIEGO_KEYSTORE_PATH')) {\n    android.signingConfigs.create('riegoRelease') {\n        storeFile file(System.getenv('RIEGO_KEYSTORE_PATH'))\n        storePassword System.getenv('RIEGO_KEYSTORE_PASSWORD')\n        keyAlias System.getenv('RIEGO_KEY_ALIAS')\n        keyPassword System.getenv('RIEGO_KEY_PASSWORD')\n    }\n    android.buildTypes.release.signingConfig = android.signingConfigs.riegoRelease\n}\n`;
if(!text.includes('riegoStableDebug'))text+=`\n// riegoStableDebug: certificate for development builds only.\nandroid.signingConfigs.debug {\n    storeFile rootProject.file('../scripts/android-debug.keystore')\n    storePassword 'android'\n    keyAlias 'androiddebugkey'\n    keyPassword 'android'\n}\n`;
await writeFile(gradle,text);
const manifest=new URL("android/app/src/main/AndroidManifest.xml",root);
let xml=await readFile(manifest,"utf8");
if(!xml.includes('android:scheme="riego"'))xml=xml.replace("</activity>",`    <intent-filter>\n                <action android:name="android.intent.action.VIEW" />\n                <category android:name="android.intent.category.DEFAULT" />\n                <category android:name="android.intent.category.BROWSABLE" />\n                <data android:scheme="riego" android:host="activate" />\n            </intent-filter>\n        </activity>`);
xml=xml.replace(/android:allowBackup="true"/, 'android:allowBackup="false"');
const activity=xml.match(/<activity\b[\s\S]*?>/)?.[0];
if(!activity)throw new Error("No se encontró la actividad de Riego");
const resizedActivity=activity.includes('android:windowSoftInputMode=')
    ?activity.replace(/android:windowSoftInputMode="[^"]*"/, 'android:windowSoftInputMode="adjustResize"')
    :activity.replace(/>$/, '\n            android:windowSoftInputMode="adjustResize">');
xml=xml.replace(activity,resizedActivity);
await writeFile(manifest,xml);
// Keep the branded launcher legible inside Android's circular and rounded masks.
const res=new URL("android/app/src/main/res/",root);
for(const name of ["mipmap-mdpi","mipmap-hdpi","mipmap-xhdpi","mipmap-xxhdpi","mipmap-xxxhdpi"]){
 await mkdir(new URL(name+"/",res),{recursive:true});
 for(const icon of ["ic_launcher.png","ic_launcher_round.png"])await copyFile(new URL("public/icon-512.png",root),new URL(name+"/"+icon,res));
 await copyFile(new URL("public/icon-foreground.png",root),new URL(name+"/ic_launcher_foreground.png",res));
}
await writeFile(new URL("values/ic_launcher_background.xml",res),'<?xml version="1.0" encoding="utf-8"?><resources><color name="ic_launcher_background">#143f32</color></resources>');
await copyFile(new URL("public/icon-foreground.png",root),new URL("drawable/riego_logo.png",res));
await writeFile(new URL("drawable/riego_splash.xml",res),`<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@color/ic_launcher_background" />
    <item android:width="108dp" android:height="108dp" android:gravity="center"><bitmap android:src="@drawable/riego_logo" android:gravity="fill" /></item>
</layer-list>`);
const styles=new URL("values/styles.xml",res);
let theme=await readFile(styles,"utf8");
theme=theme.replace(/<style name="AppTheme.NoActionBarLaunch"[\s\S]*?<\/style>/,`<style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
        <item name="android:background">@drawable/riego_splash</item>
        <item name="windowSplashScreenBackground">@color/ic_launcher_background</item>
        <item name="windowSplashScreenAnimatedIcon">@mipmap/ic_launcher_foreground</item>
        <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>
    </style>`);
await writeFile(styles,theme);
console.log(`Android preparado: Riego ${pkg.version}, Android 8 o posterior.`);
