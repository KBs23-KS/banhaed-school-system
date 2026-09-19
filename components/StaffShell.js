"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { staffFetch } from "@/lib/apiClient";
import UiIcon from "@/components/UiIcon";

const baseNav = [
  ["/staff", "ภาพรวม", "home"],
  ["/staff/students", "นักเรียนทั้งหมด", "students"],
  ["/staff/my-room", "ห้องของฉัน", "room"],
  ["/staff/personnel", "ข้อมูลบุคลากร", "personnel"],
];

export default function StaffShell({ children, title = "" }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const off = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        location.href = "/?login=staff";
        return;
      }
      try {
        const d = await staffFetch("/api/staff/me");
        setProfile(d.user);
      } catch {
        location.href = "/?login=staff";
      } finally {
        setLoading(false);
      }
    });
    return off;
  }, []);

  if (loading) return <main className="screen-loader"><div className="loader-orb"/><p>กำลังตรวจสอบสิทธิ์ผู้ใช้งาน...</p></main>;

  const roles = profile?.roles || [];
  const nav = [...baseNav];
  if (roles.includes("hr")) nav.push(["/staff/personnel?mode=hr", "งานบุคคล", "briefcase"]);
  if (roles.includes("admin")) nav.push(["/staff/admin", "จัดการระบบ", "settings"]);

  function active(href) {
    const path = href.split("?")[0];
    return path === "/staff" ? pathname === "/staff" : pathname.startsWith(path);
  }

  return (
    <main className="staff-layout">
      <aside className={`staff-sidebar ${open ? "is-open" : ""}`}>
        <div className="staff-brand">
          <div className="staff-logo-wrap"><img src="/school-logo.png" alt="ตราโรงเรียนบ้านแฮดศึกษา"/></div>
          <div><b>โรงเรียนบ้านแฮดศึกษา</b><span>ระบบข้อมูลนักเรียนและบุคลากร</span></div>
        </div>

        <nav className="staff-nav">
          {nav.map(([href,label,icon]) => (
            <a key={href} href={href} className={active(href) ? "active" : ""} onClick={()=>setOpen(false)}>
              <span className="nav-icon"><UiIcon name={icon} size={20}/></span><span>{label}</span>
            </a>
          ))}
        </nav>

        <div className="sidebar-quote">
          <span>“</span>
          <p>คนดี มีความรู้<br/>อยู่ร่วมกันอย่างมีความสุข</p>
          <i>โรงเรียนบ้านแฮดศึกษา</i>
        </div>

        <div className="staff-user-card">
          <div className="staff-avatar">{(profile?.displayName || profile?.email || "ค").slice(0,1)}</div>
          <div className="staff-user-text"><small>เข้าสู่ระบบโดย</small><b>{profile?.displayName || profile?.email}</b><span>{roles.join(" • ") || "staff"}</span></div>
        </div>
        <button className="sidebar-logout" onClick={()=>signOut(auth).then(()=>location.href="/")}><UiIcon name="logout" size={18}/>ออกจากระบบ</button>
      </aside>

      <section className="staff-content">
        <header className="staff-topbar">
          <button className="sidebar-toggle" onClick={()=>setOpen(v=>!v)} aria-label="เปิดเมนู"><UiIcon name="menu"/></button>
          <div className="staff-topbar-search"><UiIcon name="search" size={18}/><input placeholder="ค้นหานักเรียน บุคลากร หรือเมนู..."/></div>
          <div className="staff-top-actions">
            <span className="year-pill"><UiIcon name="calendar" size={16}/>ปีการศึกษา 2569</span>
            <button className="icon-btn"><UiIcon name="bell" size={19}/><i>3</i></button>
            <div className="top-profile"><div className="top-avatar">{(profile?.displayName || "ค").slice(0,1)}</div><div><b>{profile?.displayName || "ผู้ใช้งาน"}</b><span>{roles.includes("admin") ? "ผู้ดูแลระบบ" : roles.includes("hr") ? "งานบุคคล" : "ครูผู้สอน"}</span></div></div>
          </div>
        </header>

        <div className="staff-mobile-title"><b>{title || "ระบบข้อมูลโรงเรียน"}</b><span>{profile?.displayName}</span></div>
        <div className="staff-page">{children}</div>
      </section>
      {open && <button className="sidebar-backdrop" aria-label="ปิดเมนู" onClick={()=>setOpen(false)}/>}
    </main>
  );
}
