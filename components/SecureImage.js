"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function SecureImage({ documentId, alt="", className="", student=false }){
  const [src,setSrc]=useState("");
  useEffect(()=>{
    if(!documentId)return;
    let objectUrl=""; let cancelled=false;
    async function load(user){
      try{
        const headers={};
        if(!student){ if(!user)return; headers.Authorization=`Bearer ${await user.getIdToken()}`; }
        const r=await fetch(`/api/files/content/${documentId}`,{headers});
        if(!r.ok||cancelled)return;
        const blob=await r.blob(); objectUrl=URL.createObjectURL(blob); if(!cancelled)setSrc(objectUrl);
      }catch{}
    }
    let off=()=>{};
    if(student)load(null); else off=onAuthStateChanged(auth,user=>load(user));
    return()=>{cancelled=true;off();if(objectUrl)URL.revokeObjectURL(objectUrl)};
  },[documentId,student]);
  return src?<img src={src} alt={alt} className={className}/>:null;
}
