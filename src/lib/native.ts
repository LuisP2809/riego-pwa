import {Capacitor} from "@capacitor/core";
import {CapacitorBarcodeScanner} from "@capacitor/barcode-scanner";
import {Filesystem,Directory,Encoding} from "@capacitor/filesystem";
import {Share} from "@capacitor/share";

export async function scanAccess():Promise<string>{
  const result=await CapacitorBarcodeScanner.scanBarcode({hint:0,scanInstructions:"Apunta al QR de Riego",scanText:"Escanear QR",scanButton:false,web:{showCameraSelection:true},cancelButtonAccessibilityLabel:"Cancelar"});
  return result.ScanResult;
}
export async function shareQr(dataUrl:string,link:string){
  if(Capacitor.isNativePlatform()){
    const file=await Filesystem.writeFile({path:"Acceso_Riego.png",data:dataUrl.split(",")[1],directory:Directory.Cache});
    await Share.share({title:"Acceso a Riego",text:link,files:[file.uri],dialogTitle:"Compartir acceso"});
  }else{
    const a=document.createElement("a");a.href=dataUrl;a.download="Acceso_Riego.png";a.click();
  }
}
export async function shareText(filename:string,text:string){
  if(Capacitor.isNativePlatform()){
    const file=await Filesystem.writeFile({path:filename,data:text,directory:Directory.Cache,encoding:Encoding.UTF8});
    await Share.share({title:filename,files:[file.uri]});
  }else{
    const url=URL.createObjectURL(new Blob([text],{type:"text/plain;charset=utf-8"}));
    const a=document.createElement("a");a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
  }
}
