"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { staffFetch } from "@/lib/apiClient";
import { usePathname } from "next/navigation";

const items=[
 ["/staff","ภาพรวม","home"],
 ["/staff/students","นักเรียน","students"],
 ["/staff/my-room","ห้องของฉัน","room"],
 ["/staff/personnel","บุคลากร","personnel"],
];
export default function StaffShell({children}){
 const [profile,setProfile]=useState(null),[loading,setLoading]=useState(true),[open,setOpen]=useState(false); const path=usePathname();
 useEffect(()=>onAuthStateChanged(auth,async user=>{ if(!user){location.href="/?login=staff";return;} try{const d=await staffFetch("/api/staff/me");setProfile(d.user);}catch{location.href="/?login=staff";}finally{setLoading(false);}}),[]);
 if(loading) return <main className="dash-loading">กำลังตรวจสอบสิทธิ์...</main>;
 const roles=profile?.roles||[]; const nav=[...items]; if(roles.includes("hr")) nav.push(["/staff/personnel?mode=hr","งานบุคคล","hr"]); if(roles.includes("admin")) nav.push(["/staff/admin","จัดการระบบ","admin"]);
 return <main className="app-shell">
  <aside className={`app-sidebar ${open?"open":""}`}>
   <div className="side-brand"><img src="/school-logo.png"/><div><b>โรงเรียนบ้านแฮดศึกษา</b><span>INFORMATION SYSTEM</span></div></div>
   <nav>{nav.map(([href,label])=><a key={href} href={href} className={(href==="/staff"?path===href:path.startsWith(href.split("?")[0]))?"active":""}>{label}</a>)}</nav>
   <div className="side-user"><small>เข้าสู่ระบบโดย</small><b>{profile?.displayName||profile?.email}</b><div>{roles.map(r=><span key={r}>{r}</span>)}</div></div>
   <button className="side-logout" onClick={()=>signOut(auth).then(()=>location.href="/")}>ออกจากระบบ</button>
  </aside>
  <section className="app-content"><header className="mobile-head"><button onClick={()=>setOpen(!open)}>☰</button><b>บ้านแฮดศึกษา</b><span>{profile?.displayName}</span></header>{children}</section>
 </main>
}
