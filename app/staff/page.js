"use client";
import { useEffect, useState } from "react";
import StaffShell from "@/components/StaffShell";
import { staffFetch } from "@/lib/apiClient";
import UiIcon from "@/components/UiIcon";

export default function StaffDashboard(){
  const [d,setD]=useState(null);
  useEffect(()=>{staffFetch("/api/dashboard").then(setD).catch(()=>setD({counts:{},currentAcademicYear:"2569"}))},[]);
  const counts=d?.counts||{};
  const cards=[
    ["ห้องเรียนที่ปรึกษา",counts.myRoom??"—","ห้องของฉัน","room","blue"],
    ["นักเรียนทั้งหมด",counts.students??"—","ข้อมูลนักเรียน","students","green"],
    ["ข้อมูลไม่ครบ",counts.incomplete??"—","รายการที่ควรติดตาม","file","purple"],
    ["บุคลากร",counts.personnel??"—","บุคลากรในระบบ","personnel","orange"],
  ];
  return <StaffShell title="ภาพรวมระบบ">
    <section className="staff-hero-banner hybrid-banner">
      <div className="staff-hero-copy"><small>BANHAEDSUKSA SCHOOL INFORMATION SYSTEM</small><h1>ภาพรวมระบบโรงเรียน</h1><p>ศูนย์กลางข้อมูลนักเรียน ห้องเรียน บุคลากร และงานบริหารในที่เดียว</p><span>ข้อมูลที่เป็นระบบ ช่วยให้การดูแลนักเรียนและการทำงานของโรงเรียนมีประสิทธิภาพยิ่งขึ้น</span></div>
      <div className="staff-hero-art"/>
    </section>

    <section className="staff-stat-grid">
      {cards.map(([label,value,sub,icon,color])=><article key={label} className={`staff-stat-card ${color}`}><span className="stat-icon"><UiIcon name={icon} size={24}/></span><div><small>{label}</small><b>{value}</b><em>{sub}</em></div></article>)}
    </section>

    <section className="dashboard-grid-2">
      <article className="dashboard-panel quick-panel">
        <div className="panel-heading"><div><small>QUICK ACCESS</small><h2>เมนูที่ใช้งานบ่อย</h2></div><span>เข้าถึงงานสำคัญได้รวดเร็ว</span></div>
        <div className="quick-grid">
          <a href="/staff/my-room"><span className="quick-icon blue"><UiIcon name="room"/></span><b>ห้องของฉัน</b><small>รายชื่อและสถานะข้อมูลนักเรียน</small></a>
          <a href="/staff/students"><span className="quick-icon cyan"><UiIcon name="students"/></span><b>ค้นหานักเรียน</b><small>ดูข้อมูลนักเรียนทั้งโรงเรียน</small></a>
          <a href="/staff/personnel"><span className="quick-icon green"><UiIcon name="personnel"/></span><b>ข้อมูลบุคลากร</b><small>ประวัติและข้อมูลบุคลากร</small></a>
          <a href="/staff/admin"><span className="quick-icon purple"><UiIcon name="upload"/></span><b>นำเข้า Excel</b><small>เพิ่มข้อมูลแบบกลุ่ม</small></a>
          <a href="/staff/admin"><span className="quick-icon orange"><UiIcon name="settings"/></span><b>จัดการระบบ</b><small>บัญชี ห้องเรียน ปีการศึกษา</small></a>
          <a href="/staff/personnel?mode=hr"><span className="quick-icon pink"><UiIcon name="briefcase"/></span><b>งานบุคคล</b><small>ติดตามข้อมูลและเอกสารบุคลากร</small></a>
        </div>
      </article>

      <article className="dashboard-panel system-panel">
        <div className="panel-heading"><div><small>SYSTEM STATUS</small><h2>สถานะการเชื่อมต่อ</h2></div><span className="connected-pill">● พร้อมใช้งาน</span></div>
        <div className="system-health">
          <div><span><UiIcon name="shield"/></span><div><b>Firebase Authentication</b><small>บัญชีครูและบุคลากร</small></div><i>พร้อม</i></div>
          <div><span><UiIcon name="cloud"/></span><div><b>Cloud Firestore</b><small>ฐานข้อมูลหลักของระบบ</small></div><i>พร้อม</i></div>
          <div><span><UiIcon name="folder"/></span><div><b>Google Drive</b><small>รูปภาพและเอกสาร</small></div><i>ตั้งค่าใน Vercel</i></div>
          <div><span><UiIcon name="file"/></span><div><b>Excel Import / Export</b><small>รองรับไฟล์ .xlsx</small></div><i>พร้อม</i></div>
        </div>
      </article>
    </section>

    <section className="dashboard-panel activity-panel">
      <div className="panel-heading"><div><small>WORKFLOW</small><h2>รายการที่ควรตรวจสอบ</h2></div></div>
      <div className="activity-row"><span className="activity-icon green"><UiIcon name="check"/></span><div><b>ตรวจสอบความครบถ้วนของนักเรียนในห้องที่ปรึกษา</b><small>ติดตามนักเรียนที่ยังกรอกข้อมูลไม่ครบ</small></div><a href="/staff/my-room">เปิดห้องของฉัน →</a></div>
      <div className="activity-row"><span className="activity-icon blue"><UiIcon name="phone"/></span><div><b>ตรวจสอบผู้ติดต่อกรณีฉุกเฉิน</b><small>ให้ข้อมูลเบอร์โทรศัพท์เป็นปัจจุบันเพื่อการติดต่อที่รวดเร็ว</small></div><a href="/staff/students">ค้นหานักเรียน →</a></div>
    </section>
  </StaffShell>
}
