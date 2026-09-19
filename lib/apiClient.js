import { auth } from "@/lib/firebase";
export async function staffFetch(url,options={}){
 const user=auth.currentUser; if(!user) throw new Error("NO_AUTH");
 const token=await user.getIdToken();
 const headers={...(options.headers||{}),Authorization:`Bearer ${token}`};
 if(options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) headers["Content-Type"]="application/json";
 const r=await fetch(url,{...options,headers}); const ct=r.headers.get("content-type")||""; const data=ct.includes("application/json")?await r.json():await r.blob();
 if(!r.ok) throw new Error(data?.error||"เกิดข้อผิดพลาด"); return data;
}
