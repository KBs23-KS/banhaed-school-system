"use client";
import { useEffect, useState } from "react";
import StaffShell from "@/components/StaffShell";
import { staffFetch } from "@/lib/apiClient";
import UiIcon from "@/components/UiIcon";
import SecureImage from "@/components/SecureImage";

const tabs=[
 ["personal","ส่วนตัว","person"],["address","ที่อยู่","map"],["family","ครอบครัว","heart"],["emergency","ฉุกเฉิน","phone"],["additional","ความสามารถ","star"],["learning","การเรียน/เป้าหมาย","book"]
];

export default function StudentDetail({params}){
 const [id,setId]=useState(""),[s,setS]=useState(null),[canEdit,setCanEdit]=useState(false),[edit,setEdit]=useState(false),[tab,setTab]=useState("personal"),[msg,setMsg]=useState("");
 useEffect(()=>{Promise.resolve(params).then(p=>{setId(p.id);staffFetch(`/api/students/${p.id}`).then(d=>{setS(d.student);setCanEdit(d.canEdit);setEdit(new URLSearchParams(location.search).get("edit")==="1"&&d.canEdit)}).catch(e=>setMsg(e.message))})},[params]);
 async function save(){try{await staffFetch(`/api/students/${id}`,{method:"PATCH",body:JSON.stringify(s)});setMsg("บันทึกข้อมูลแล้ว");setEdit(false)}catch(e){setMsg(e.message)}}
 function set(k,v){setS({...s,[k]:v})}
 function nested(section,k,v){setS({...s,[section]:{...(s[section]||{}),[k]:v}})}
 function deep(section,sub,k,v){setS({...s,[section]:{...(s[section]||{}),[sub]:{...(s[section]?.[sub]||{}),[k]:v}}})}
 if(!s)return <StaffShell title="ข้อมูลนักเรียน"><div className="content-loader">กำลังโหลดข้อมูล...</div></StaffShell>;
 const e=s.currentEnrollment||{};const name=`${s.prefix||""}${s.firstName||""} ${s.lastName||""}`.trim();
 return <StaffShell title="ข้อมูลนักเรียน">
   <div className="profile-breadcrumb"><a href="/staff/students">นักเรียนทั้งหมด</a><span>›</span><b>{name}</b></div>
   {msg&&<div className="toast-notice">{msg}<button onClick={()=>setMsg("")}>×</button></div>}
   <section className="student-profile-hero">
     <div className="profile-photo-large">{s.photoDocumentId?<SecureImage documentId={s.photoDocumentId} alt="รูปนักเรียน"/>:s.firstName?.[0]}</div>
     <div className="profile-hero-copy"><small>STUDENT PROFILE</small><h1>{name}</h1><p>รหัสนักเรียน {s.studentId} · ชั้น ม.{e.grade}/{e.room} · เลขที่ {e.number??"-"}</p><div className="profile-chip-row"><span className="chip blue">ข้อมูล {s.profileCompletion||0}%</span><span className={`chip ${s.profileStatus==="complete"?"green":"orange"}`}>{s.profileStatus==="complete"?"ข้อมูลครบถ้วน":"รออัปเดตข้อมูล"}</span></div></div>
     <div className="profile-hero-actions">{canEdit&&<button className="toolbar-btn soft" onClick={()=>setEdit(v=>!v)}><UiIcon name="edit" size={17}/>{edit?"ยกเลิกการแก้ไข":"แก้ไขข้อมูล"}</button>}{s.emergency?.primary?.phone&&<a className="toolbar-btn green" href={`tel:${s.emergency.primary.phone}`}><UiIcon name="phone" size={17}/>โทรฉุกเฉิน</a>}</div>
   </section>

   <div className="profile-tabs">{tabs.map(([k,l,icon])=><button key={k} className={tab===k?"active":""} onClick={()=>setTab(k)}><UiIcon name={icon} size={18}/>{l}</button>)}</div>
   <section className="profile-detail-card">
     {tab==="personal"&&<><SectionHead icon="person" title="ข้อมูลส่วนตัว"/><InfoGrid>{edit?<><Field label="ชื่อเล่น" value={s.nickname||""} onChange={v=>set("nickname",v)}/><Field label="เบอร์โทรศัพท์" value={s.phone||""} onChange={v=>set("phone",v)}/><Field label="เพศ" value={s.gender||""} onChange={v=>set("gender",v)}/><Field label="วันเดือนปีเกิด" value={s.birthDateBE||""} onChange={v=>set("birthDateBE",v)}/><Field label="เลขประจำตัวประชาชน" value={s.citizenId||""} onChange={v=>set("citizenId",v)}/></>:<><Info label="ชื่อ-นามสกุล" value={name}/><Info label="ชื่อเล่น" value={s.nickname}/><Info label="วันเดือนปีเกิด" value={s.birthDateBE}/><Info label="เพศ" value={s.gender}/><Info label="เบอร์โทรศัพท์" value={s.phone}/><Info label="เลขประจำตัวประชาชน" value={s.citizenId} copy/></>}</InfoGrid></>}
     {tab==="address"&&<><SectionHead icon="map" title="ที่อยู่และการเดินทาง"/><InfoGrid>{["houseNo","moo","village","subdistrict","district","province","postalCode"].map((k,i)=>edit?<Field key={k} label={["บ้านเลขที่","หมู่ที่","หมู่บ้าน/บ้าน","ตำบล","อำเภอ","จังหวัด","รหัสไปรษณีย์"][i]} value={s.address?.registered?.[k]||""} onChange={v=>deep("address","registered",k,v)}/>:<Info key={k} label={["บ้านเลขที่","หมู่ที่","หมู่บ้าน/บ้าน","ตำบล","อำเภอ","จังหวัด","รหัสไปรษณีย์"][i]} value={s.address?.registered?.[k]}/>) }{edit?<Field label="วิธีเดินทาง" value={s.address?.travelMethod||""} onChange={v=>nested("address","travelMethod",v)}/>:<Info label="วิธีเดินทาง" value={s.address?.travelMethod}/>}<Info label="ระยะทาง" value={s.address?.distance}/></InfoGrid></>}
     {tab==="family"&&<><SectionHead icon="heart" title="บิดา มารดา ผู้ปกครอง และครอบครัว"/><div className="profile-section-grid"><MiniProfile title="ผู้ปกครองหลัก" icon="person" items={[["ชื่อ",s.family?.guardian?.name],["ความสัมพันธ์",s.family?.guardian?.relationship],["โทรศัพท์",s.family?.guardian?.phone],["อาชีพ",s.family?.guardian?.occupation]]}/><MiniProfile title="ข้อมูลครอบครัว" icon="users" items={[["สถานะบิดามารดา",s.family?.parentStatus],["พี่น้องทั้งหมด",s.family?.siblingsTotal],["เป็นบุตรคนที่",s.family?.birthOrder]]}/></div></>}
     {tab==="emergency"&&<><SectionHead icon="phone" title="ผู้ติดต่อกรณีฉุกเฉิน"/><div className="emergency-grid"><EmergencyCard title="ผู้ติดต่ออันดับ 1" data={s.emergency?.primary} primary/><EmergencyCard title="ผู้ติดต่อสำรอง" data={s.emergency?.secondary}/></div></>}
     {tab==="additional"&&<><SectionHead icon="star" title="ความสามารถและข้อมูลเพิ่มเติม"/><TextInfo label="ความสามารถ/จุดเด่น" value={s.additional?.abilities}/><TextInfo label="กีฬา/กิจกรรม" value={s.additional?.sportsActivities}/><TextInfo label="งานอดิเรก/ความสนใจ" value={s.additional?.hobbies}/><TextInfo label="ข้อมูลที่อยากให้ครูทราบ" value={s.additional?.teacherNote}/></>}
     {tab==="learning"&&<><SectionHead icon="book" title="การเรียนและเป้าหมาย"/><InfoGrid><Info label="วิชาที่ชอบ" value={(s.learning?.favoriteSubjects||[]).join?.(", ")||s.learning?.favoriteSubjects}/><Info label="วิชาที่ต้องการความช่วยเหลือ" value={(s.learning?.needHelpSubjects||[]).join?.(", ")||s.learning?.needHelpSubjects}/><Info label="เป้าหมายหลังจบ" value={s.learning?.postGraduationGoal}/><Info label="สาย/สาขาที่สนใจ" value={s.learning?.desiredField}/></InfoGrid><TextInfo label="เรื่องที่อยากให้ครูช่วยเหลือ" value={s.learning?.teacherHelp}/></>}
     {edit&&<div className="profile-save-row"><button className="soft-secondary" onClick={()=>setEdit(false)}>ยกเลิก</button><button className="soft-primary" onClick={save}><UiIcon name="check" size={17}/>บันทึกการแก้ไข</button></div>}
   </section>
 </StaffShell>
}
function SectionHead({icon,title}){return <div className="section-head-line"><span><UiIcon name={icon}/></span><div><small>STUDENT INFORMATION</small><h2>{title}</h2></div></div>}
function InfoGrid({children}){return <div className="info-grid">{children}</div>}
function Info({label,value,copy=false}){return <div className="info-item"><span>{label}</span><b>{value||"—"}</b>{copy&&value&&<button onClick={()=>navigator.clipboard?.writeText(value)}>คัดลอก</button>}</div>}
function Field({label,value,onChange}){return <label className="modern-field"><span>{label}</span><input value={value||""} onChange={e=>onChange(e.target.value)}/></label>}
function MiniProfile({title,icon,items}){return <article className="mini-profile"><span className="mini-profile-icon"><UiIcon name={icon}/></span><h3>{title}</h3>{items.map(([l,v])=><p key={l}><span>{l}</span><b>{v||"—"}</b></p>)}</article>}
function EmergencyCard({title,data,primary}) {return <article className={`emergency-card ${primary?"primary":""}`}><div><span><UiIcon name="phone"/></span><h3>{title}</h3></div><b>{data?.name||"—"}</b><p>{data?.relationship||"ไม่ระบุความสัมพันธ์"}</p>{data?.phone?<a href={`tel:${data.phone}`}>{data.phone}</a>:<span>ยังไม่มีเบอร์โทร</span>}</article>}
function TextInfo({label,value}){return <div className="text-info"><span>{label}</span><p>{value||"—"}</p></div>}
