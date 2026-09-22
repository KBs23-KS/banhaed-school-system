"use client";
import { useEffect, useMemo, useState } from "react";
import StaffShell from "@/components/StaffShell";
import { staffFetch } from "@/lib/apiClient";
import UiIcon from "@/components/UiIcon";
import SecureImage from "@/components/SecureImage";

export default function MyRoomPage(){
  const [d,setD]=useState(null),[q,setQ]=useState(""),[status,setStatus]=useState(""),[sort,setSort]=useState("number");
  useEffect(()=>{staffFetch("/api/my-room").then(setD).catch(e=>setD({error:e.message,rooms:[],students:[]}))},[]);
  const students=d?.students||[];
  const rows=useMemo(()=>{
    let x=students.filter(s=>!q||[s.studentId,s.firstName,s.lastName,s.nickname].join(" ").toLowerCase().includes(q.toLowerCase()));
    if(status)x=x.filter(s=>(s.profileStatus||"not_started")===status);
    x=[...x].sort((a,b)=>sort==="name"?`${a.firstName}${a.lastName}`.localeCompare(`${b.firstName}${b.lastName}`,"th"):Number(a.currentEnrollment?.number||999)-Number(b.currentEnrollment?.number||999));
    return x;
  },[students,q,status,sort]);
  const complete=students.filter(s=>s.profileStatus==="complete").length;
  const incomplete=students.filter(s=>s.profileStatus==="incomplete").length;
  const notStarted=students.length-complete-incomplete;
  const emergency=students.filter(s=>s.emergency?.primary?.phone).length;
  const room=d?.rooms?.[0];
  return <StaffShell title="ห้องของฉัน">
    <section className="room-hero">
      <div><small>HOMEROOM</small><h1><UiIcon name="room" size={34}/> ห้องของฉัน</h1><p>{room?`ม.${room.grade}/${room.room} • ปีการศึกษา ${room.academicYear}`:"ห้องที่คุณได้รับมอบหมายเป็นครูที่ปรึกษา"}</p></div>
      <div className="room-hero-art"><b>ดูแลนักเรียนวันนี้<br/>สร้างอนาคตที่ดีกว่าในวันหน้า</b><small>โรงเรียนบ้านแฮดศึกษา</small></div>
    </section>

    {d?.error&&<div className="form-error">{d.error}</div>}
    <section className="room-stat-grid">
      <Stat icon="students" label="นักเรียนทั้งหมด" value={students.length} sub="คน" color="blue"/>
      <Stat icon="check" label="ข้อมูลครบถ้วน" value={complete} sub={`คน • ${students.length?Math.round(complete/students.length*100):0}%`} color="green"/>
      <Stat icon="clock" label="รออัปเดต" value={incomplete+notStarted} sub="คน" color="orange"/>
      <Stat icon="phone" label="ติดต่อฉุกเฉินพร้อม" value={emergency} sub={`คน • ${students.length?Math.round(emergency/students.length*100):0}%`} color="mint"/>
    </section>

    <section className="room-toolbar">
      <div className="table-search"><UiIcon name="search" size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="ค้นหาชื่อ หรือนักเรียน..."/></div>
      <select value={status} onChange={e=>setStatus(e.target.value)}><option value="">สถานะข้อมูลทั้งหมด</option><option value="complete">ครบถ้วน</option><option value="incomplete">ยังไม่ครบ</option><option value="not_started">ยังไม่เริ่ม</option></select>
      <select value={sort} onChange={e=>setSort(e.target.value)}><option value="number">เรียงตามเลขที่</option><option value="name">เรียงตามชื่อ</option></select>
      <a className="toolbar-btn green" href={room?`/api/admin/export-students?grade=${encodeURIComponent(room.grade)}&room=${encodeURIComponent(room.room)}`:"/api/admin/export-students"}><UiIcon name="download" size={17}/>ส่งออก Excel</a><button className="toolbar-btn soft-print" onClick={()=>window.print()}><UiIcon name="file" size={17}/>พิมพ์รายชื่อ</button>
    </section>

    <div className="room-main-grid">
      <section className="data-card room-table-card">
        <div className="data-card-head"><div><small>STUDENTS</small><h2>รายชื่อนักเรียนในห้อง</h2></div><span>ทั้งหมด {rows.length} คน</span></div>
        <div className="responsive-table-wrap"><table className="pretty-table"><thead><tr><th>รูป</th><th>รหัสนักเรียน</th><th>ชื่อ-สกุล</th><th>เลขที่</th><th>สถานะข้อมูล</th><th>ผู้ปกครอง</th><th>โทรศัพท์</th><th>การดำเนินการ</th></tr></thead><tbody>{rows.map((s,i)=>{const e=s.currentEnrollment||{};const phone=s.emergency?.primary?.phone||s.family?.guardian?.phone||s.phone||"—";return <tr key={s.studentId}><td data-label="รูป"><div className="table-avatar">{s.photoDocumentId?<SecureImage documentId={s.photoDocumentId} alt="รูปนักเรียน"/>:s.firstName?.[0]}</div></td><td data-label="รหัส">{s.studentId}</td><td data-label="ชื่อ"><b>{s.prefix}{s.firstName} {s.lastName}</b><small>{s.nickname?`(${s.nickname})`:""}</small></td><td data-label="เลขที่">{e.number??i+1}</td><td data-label="สถานะ"><StatusPill status={s.profileStatus}/></td><td data-label="ผู้ปกครอง">{s.family?.guardian?.name||"—"}</td><td data-label="โทรศัพท์">{phone}</td><td data-label="การดำเนินการ"><div className="table-actions"><a href={`/staff/students/${s.studentId}`} title="ดูข้อมูล"><UiIcon name="eye" size={16}/><span>ดูข้อมูล</span></a><a href={`/staff/students/${s.studentId}?edit=1`} title="แก้ไข"><UiIcon name="edit" size={16}/><span>แก้ไข</span></a></div></td></tr>})}</tbody></table></div>
        {!rows.length&&<div className="empty-state"><UiIcon name="students" size={38}/><b>ไม่พบนักเรียนตามเงื่อนไข</b><span>ลองเปลี่ยนคำค้นหาหรือตัวกรอง</span></div>}
      </section>
      <aside className="room-summary-card"><div className="data-card-head"><div><small>COMPLETION</small><h2>สรุปความครบถ้วน</h2></div></div><Progress label="ข้อมูลครบถ้วน" value={students.length?Math.round(complete/students.length*100):0} color="blue"/><Progress label="ข้อมูลยังไม่ครบ" value={students.length?Math.round(incomplete/students.length*100):0} color="orange"/><Progress label="ผู้ติดต่อฉุกเฉิน" value={students.length?Math.round(emergency/students.length*100):0} color="green"/><div className="room-quote">ดูแลนักเรียนวันนี้<br/>สร้างอนาคตที่ดีกว่าในวันหน้า</div></aside>
    </div>
  </StaffShell>
}
function Stat({icon,label,value,sub,color}){return <article className={`room-stat ${color}`}><span><UiIcon name={icon} size={24}/></span><div><small>{label}</small><b>{value}</b><em>{sub}</em></div></article>}
function StatusPill({status}){const s=status||"not_started";return <span className={`status-pill ${s}`}>{s==="complete"?"ครบถ้วน":s==="incomplete"?"รออัปเดต":"ยังไม่เริ่ม"}</span>}
function Progress({label,value,color}){return <div className="summary-progress"><div><span>{label}</span><b>{value}%</b></div><div className="summary-track"><i className={color} style={{width:`${value}%`}}/></div></div>}
