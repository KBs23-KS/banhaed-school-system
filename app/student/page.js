"use client";
import { useEffect, useMemo, useState } from "react";
import UiIcon from "@/components/UiIcon";
import SecureImage from "@/components/SecureImage";
import { compressSquareImage } from "@/lib/imageClient";

const tabs=[
  ["personal","ข้อมูลส่วนตัว","person","blue"],
  ["address","ที่อยู่","home","green"],
  ["family","ครอบครัว","heart","pink"],
  ["emergency","ฉุกเฉิน","phone","red"],
  ["additional","ความสามารถ","star","orange"],
  ["learning","การเรียน/เป้าหมาย","book","purple"],
];
const empty={address:{registered:{},current:{}},family:{guardian:{},father:{},mother:{}},emergency:{primary:{},secondary:{}},additional:{},learning:{}};

export default function StudentPage(){
  const [s,setS]=useState(null),[tab,setTab]=useState("overview"),[msg,setMsg]=useState(""),[busy,setBusy]=useState(false),[menu,setMenu]=useState(false),[photoBusy,setPhotoBusy]=useState(false);
  async function load(){const r=await fetch("/api/student/profile");if(!r.ok){location.href="/?login=student";return;}const d=await r.json();setS({...empty,...d.student,address:{registered:{},current:{},...(d.student.address||{})},family:{guardian:{},father:{},mother:{},...(d.student.family||{})},emergency:{primary:{},secondary:{},...(d.student.emergency||{})},additional:d.student.additional||{},learning:d.student.learning||{}})}
  useEffect(()=>{load()},[]);
  async function save(){setBusy(true);setMsg("");const r=await fetch("/api/student/profile",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(s)});const d=await r.json();setBusy(false);setMsg(r.ok?`บันทึกข้อมูลเรียบร้อย • ความครบถ้วน ${d.profileCompletion}%`:d.error||"บันทึกไม่สำเร็จ");if(r.ok)setS(v=>({...v,profileCompletion:d.profileCompletion,profileStatus:d.profileCompletion===100?"complete":"incomplete"}))}
  function set(k,v){setS({...s,[k]:v})}
  function nested(section,k,v){setS({...s,[section]:{...(s[section]||{}),[k]:v}})}
  function deep(section,sub,k,v){setS({...s,[section]:{...(s[section]||{}),[sub]:{...(s[section]?.[sub]||{}),[k]:v}}})}
  async function uploadPhoto(file){if(!file)return;setPhotoBusy(true);setMsg("");try{const compressed=await compressSquareImage(file);const form=new FormData();form.append("file",compressed);form.append("kind","student_photo");const r=await fetch("/api/files/upload",{method:"POST",body:form});const d=await r.json();if(!r.ok)throw new Error(d.error);setS(v=>({...v,photoDocumentId:d.document.id}));setMsg("อัปเดตรูปประจำตัวแล้ว");}catch(e){setMsg(e.message||"อัปโหลดรูปไม่สำเร็จ")}finally{setPhotoBusy(false)}}
  if(!s)return <main className="screen-loader"><div className="loader-orb"/><p>กำลังโหลดข้อมูลของฉัน...</p></main>;
  const e=s.currentEnrollment||{};
  const name=`${s.prefix||""}${s.firstName||""} ${s.lastName||""}`.trim();
  const completion=s.profileCompletion||0;
  const completedCount=tabs.filter(([key])=>groupDone(key,s)).length;

  return <main className="student-layout">
    <aside className={`student-sidebar ${menu?"is-open":""}`}>
      <div className="student-side-profile"><div className="student-side-avatar">{s.photoDocumentId?<SecureImage documentId={s.photoDocumentId} student alt="รูปนักเรียน"/>:(s.firstName?.[0]||"น")}</div><div><b>{name}</b><span>รหัส {s.studentId}</span></div></div>
      <nav>
        <button className={tab==="overview"?"active":""} onClick={()=>{setTab("overview");setMenu(false)}}><UiIcon name="home"/>หน้าหลัก</button>
        {tabs.map(([key,label,icon])=><button key={key} className={tab===key?"active":""} onClick={()=>{setTab(key);setMenu(false)}}><UiIcon name={icon}/>{label}</button>)}
      </nav>
      <div className="student-progress-side"><div><span>ความครบถ้วน</span><b>{completion}%</b></div><div className="meter"><i style={{width:`${completion}%`}}/></div><small>ครบ {completedCount} จาก 6 หมวด</small></div>
      <button className="student-logout" onClick={async()=>{await fetch("/api/student/logout",{method:"POST"});location.href="/"}}><UiIcon name="logout"/>ออกจากระบบ</button>
    </aside>
    <section className="student-main">
      <header className="student-topbar"><button className="student-menu-btn" onClick={()=>setMenu(v=>!v)}><UiIcon name="menu"/></button><div className="student-top-brand"><img src="/school-logo.png"/><div><b>โรงเรียนบ้านแฮดศึกษา</b><span>ระบบข้อมูลนักเรียน</span></div></div><div className="student-top-actions"><span><UiIcon name="calendar" size={16}/>ปีการศึกษา 2569</span><button><UiIcon name="bell" size={18}/></button></div></header>
      <div className="student-page-wrap">
        {msg&&<div className="toast-notice">{msg}<button onClick={()=>setMsg("")}>×</button></div>}
        {tab==="overview"?<StudentOverview s={s} setTab={setTab} uploadPhoto={uploadPhoto} photoBusy={photoBusy}/>:<StudentForm tab={tab} s={s} set={set} nested={nested} deep={deep} save={save} busy={busy} setMsg={setMsg}/>} 
      </div>
    </section>
    {menu&&<button className="student-backdrop" onClick={()=>setMenu(false)}/>}
  </main>
}

function StudentOverview({s,setTab,uploadPhoto,photoBusy}){
  const e=s.currentEnrollment||{};const completion=s.profileCompletion||0;
  const cards=[
    ["personal","ข้อมูลส่วนตัว","person","blue"],["family","ครอบครัว","home","green"],["emergency","ฉุกเฉิน","phone","red"],["learning","การศึกษา","room","cyan"],["additional","กิจกรรม","heart","orange"],["address","ที่อยู่","map","purple"],
  ];
  return <>
    <section className="student-welcome-banner">
      <div className="welcome-avatar">{s.photoDocumentId?<SecureImage documentId={s.photoDocumentId} student alt="รูปนักเรียน"/>:s.firstName?.[0]}<label className="photo-edit-badge" title="เปลี่ยนรูป">{photoBusy?"…":"＋"}<input type="file" accept="image/*" capture="user" hidden disabled={photoBusy} onChange={e=>uploadPhoto(e.target.files?.[0])}/></label></div>
      <div className="welcome-text"><small>สวัสดีครับ/ค่ะ</small><h1>{s.prefix}{s.firstName} {s.lastName}</h1><p>รหัสนักเรียน <b>{s.studentId}</b> · ชั้น ม.{e.grade}/{e.room} · เลขที่ {e.number??"-"}</p></div>
      <div className="welcome-note">“ทุกก้าวเล็กๆ<br/>คืออนาคตที่ยิ่งใหญ่” 🌱</div>
    </section>
    <section className="student-category-cards">
      {cards.map(([key,label,icon,color])=>{const done=groupDone(key,s);return <button key={key} className={`student-category-card ${color}`} onClick={()=>setTab(key)}><span className="cat-icon"><UiIcon name={icon} size={25}/></span><span className="cat-copy"><b>{label}</b><small>{done?"ครบถ้วน 100%":"กรอกข้อมูลต่อ"}</small></span><i className={done?"done":"todo"}>{done?"✓":"→"}</i></button>})}
    </section>
    <div className="student-overview-grid">
      <section className="student-news-card"><div className="section-title-row"><div><small>ANNOUNCEMENTS</small><h2>ข่าวประชาสัมพันธ์</h2></div><span>อัปเดตล่าสุด</span></div><div className="news-list"><article><i>1</i><div><b>เปิดตรวจสอบข้อมูลนักเรียน ปีการศึกษา 2569</b><span>กรุณาตรวจสอบข้อมูลส่วนตัวให้ครบถ้วน</span></div><time>19 ก.ย.</time></article><article><i>2</i><div><b>ประชาสัมพันธ์กิจกรรมของโรงเรียน</b><span>ติดตามข่าวสารและกิจกรรมผ่านระบบนี้</span></div><time>16 ก.ย.</time></article><article><i>3</i><div><b>ตรวจสอบเบอร์ติดต่อฉุกเฉิน</b><span>เพื่อให้ครูติดต่อผู้ปกครองได้อย่างรวดเร็ว</span></div><time>12 ก.ย.</time></article></div></section>
      <section className="student-progress-card"><div className="section-title-row"><div><small>PROFILE PROGRESS</small><h2>ความครบถ้วนของข้อมูล</h2></div></div><div className="big-progress"><div className="progress-ring" style={{"--progress":completion}}><span>{completion}%</span></div><div><b>{completion===100?"ยอดเยี่ยม! ข้อมูลครบแล้ว":"อีกนิดเดียว ข้อมูลจะครบถ้วน"}</b><p>ข้อมูลที่ครบช่วยให้ครูดูแลและติดต่อคุณได้สะดวกขึ้น</p><button onClick={()=>setTab("personal")}>ตรวจสอบข้อมูล →</button></div></div></section>
    </div>
  </>
}

function StudentForm({tab,s,set,nested,deep,save,busy,setMsg}){
  const info={personal:["ข้อมูลส่วนตัว","ข้อมูลพื้นฐานของนักเรียน ใช้สำหรับงานทะเบียนและการติดต่อ","person"],address:["ที่อยู่และการเดินทาง","ที่อยู่ตามทะเบียนบ้าน ที่อยู่ปัจจุบัน และข้อมูลการเดินทาง","map"],family:["บิดา มารดา ผู้ปกครอง และครอบครัว","ข้อมูลผู้ปกครองหลักและข้อมูลครอบครัว","heart"],emergency:["ผู้ติดต่อกรณีฉุกเฉิน","บุคคลที่โรงเรียนสามารถติดต่อได้อย่างรวดเร็ว","phone"],additional:["ความสามารถและข้อมูลเพิ่มเติม","ความถนัด กิจกรรม และเรื่องที่อยากให้ครูทราบ","star"],learning:["การเรียนและเป้าหมาย","วิชาที่สนใจ เป้าหมาย และสิ่งที่ต้องการให้ครูช่วยเหลือ","book"]}[tab];
  return <section className="student-form-shell">
    <div className="form-page-head"><span><UiIcon name={info[2]} size={28}/></span><div><small>ข้อมูลของฉัน</small><h1>{info[0]}</h1><p>{info[1]}</p></div></div>
    <section className="soft-form-card">
      {tab==="personal"&&<div className="form-grid modern">{[["คำนำหน้า","prefix"],["ชื่อ","firstName"],["นามสกุล","lastName"],["ชื่อเล่น","nickname"],["เลขประจำตัวประชาชน 13 หลัก","citizenId"],["วันเดือนปีเกิด 8 หลัก","birthDateBE"],["เพศ","gender"],["เบอร์โทรศัพท์","phone"]].map(([l,k])=><Field key={k} label={l} value={s[k]||""} disabled={["prefix","firstName","lastName"].includes(k)} onChange={v=>set(k,v)}/>)}</div>}
      {tab==="address"&&<><h3 className="form-subhead">ที่อยู่ตามทะเบียนบ้าน</h3><div className="form-grid modern">{[["บ้านเลขที่","houseNo"],["หมู่ที่","moo"],["ชื่อหมู่บ้าน/บ้าน","village"],["ถนน","road"],["ตำบล","subdistrict"],["อำเภอ","district"],["จังหวัด","province"],["รหัสไปรษณีย์","postalCode"]].map(([l,k])=><Field key={k} label={l} value={s.address?.registered?.[k]||""} onChange={v=>deep("address","registered",k,v)}/>)}</div><h3 className="form-subhead">การเดินทาง</h3><div className="form-grid modern"><SelectField label="วิธีเดินทาง" value={s.address?.travelMethod||""} onChange={v=>nested("address","travelMethod",v)} options={["เดิน","จักรยาน","รถจักรยานยนต์","ผู้ปกครองมาส่ง","รถรับส่ง","รถโดยสาร","อื่นๆ"]}/><Field label="ระยะทางโดยประมาณ" value={s.address?.distance||""} onChange={v=>nested("address","distance",v)}/><Field wide label="จุดสังเกต/รายละเอียดการเดินทางไปบ้าน" value={s.address?.landmark||""} onChange={v=>nested("address","landmark",v)}/></div></>}
      {tab==="family"&&<><h3 className="form-subhead">ผู้ปกครองหลัก</h3><div className="form-grid modern"><Field label="ชื่อ-นามสกุลผู้ปกครอง" value={s.family?.guardian?.name||""} onChange={v=>deep("family","guardian","name",v)}/><Field label="ความสัมพันธ์" value={s.family?.guardian?.relationship||""} onChange={v=>deep("family","guardian","relationship",v)}/><Field label="เบอร์โทรศัพท์" value={s.family?.guardian?.phone||""} onChange={v=>deep("family","guardian","phone",v)}/><Field label="อาชีพ" value={s.family?.guardian?.occupation||""} onChange={v=>deep("family","guardian","occupation",v)}/><Field label="สถานที่ทำงาน" value={s.family?.guardian?.workplace||""} onChange={v=>deep("family","guardian","workplace",v)}/></div><h3 className="form-subhead">ข้อมูลครอบครัว</h3><div className="form-grid modern"><SelectField label="สถานะบิดามารดา" value={s.family?.parentStatus||""} onChange={v=>nested("family","parentStatus",v)} options={["อยู่ด้วยกัน","แยกกันอยู่","หย่าร้าง","บิดาเสียชีวิต","มารดาเสียชีวิต","อื่นๆ"]}/><Field label="จำนวนพี่น้องทั้งหมด" value={s.family?.siblingsTotal||""} onChange={v=>nested("family","siblingsTotal",v)}/><Field label="เป็นบุตรคนที่" value={s.family?.birthOrder||""} onChange={v=>nested("family","birthOrder",v)}/></div></>}
      {tab==="emergency"&&<><h3 className="form-subhead">ผู้ติดต่ออันดับ 1</h3><div className="form-grid modern"><Field label="ชื่อ-นามสกุล" value={s.emergency?.primary?.name||""} onChange={v=>deep("emergency","primary","name",v)}/><Field label="ความสัมพันธ์" value={s.emergency?.primary?.relationship||""} onChange={v=>deep("emergency","primary","relationship",v)}/><Field label="เบอร์โทรศัพท์" value={s.emergency?.primary?.phone||""} onChange={v=>deep("emergency","primary","phone",v)}/></div><h3 className="form-subhead">ผู้ติดต่อสำรอง</h3><div className="form-grid modern"><Field label="ชื่อ-นามสกุล" value={s.emergency?.secondary?.name||""} onChange={v=>deep("emergency","secondary","name",v)}/><Field label="ความสัมพันธ์" value={s.emergency?.secondary?.relationship||""} onChange={v=>deep("emergency","secondary","relationship",v)}/><Field label="เบอร์โทรศัพท์" value={s.emergency?.secondary?.phone||""} onChange={v=>deep("emergency","secondary","phone",v)}/></div></>}
      {tab==="additional"&&<div className="stack-modern"><TextAreaField label="ความสามารถ/จุดเด่น" value={s.additional?.abilities||""} onChange={v=>nested("additional","abilities",v)} placeholder="เช่น กีฬา ดนตรี ศิลปะ วิชาการ คอมพิวเตอร์..."/><TextAreaField label="กีฬา/กิจกรรมที่สนใจ" value={s.additional?.sportsActivities||""} onChange={v=>nested("additional","sportsActivities",v)}/><TextAreaField label="งานอดิเรก/ความสนใจ" value={s.additional?.hobbies||""} onChange={v=>nested("additional","hobbies",v)}/><TextAreaField label="มีข้อมูลอะไรเกี่ยวกับตัวคุณที่อยากให้ครูทราบหรือไม่?" value={s.additional?.teacherNote||""} onChange={v=>nested("additional","teacherNote",v)}/></div>}
      {tab==="learning"&&<div className="stack-modern"><Field wide label="วิชาที่ชอบ (คั่นด้วย ,)" value={(s.learning?.favoriteSubjects||[]).join?.(", ")||s.learning?.favoriteSubjects||""} onChange={v=>nested("learning","favoriteSubjects",v.split(",").map(x=>x.trim()).filter(Boolean))}/><Field wide label="วิชาที่ต้องการความช่วยเหลือ (คั่นด้วย ,)" value={(s.learning?.needHelpSubjects||[]).join?.(", ")||s.learning?.needHelpSubjects||""} onChange={v=>nested("learning","needHelpSubjects",v.split(",").map(x=>x.trim()).filter(Boolean))}/><SelectField label="เป้าหมายหลังจบ" value={s.learning?.postGraduationGoal||""} onChange={v=>nested("learning","postGraduationGoal",v)} options={["ศึกษาต่อ","ทำงาน","ยังไม่แน่ใจ","อื่นๆ"]}/><Field wide label="สาย/สาขาที่สนใจ" value={s.learning?.desiredField||""} onChange={v=>nested("learning","desiredField",v)}/><TextAreaField label="มีเรื่องใดที่อยากให้ครูช่วยเหลือหรือให้คำแนะนำเป็นพิเศษไหม?" value={s.learning?.teacherHelp||""} onChange={v=>nested("learning","teacherHelp",v)}/></div>}
      <div className="modern-form-actions"><button className="soft-secondary" onClick={()=>setMsg("ข้อมูลยังไม่ส่งขึ้นระบบจนกว่าจะกดบันทึกข้อมูล")}>บันทึกไว้ก่อน</button><button className="soft-primary" disabled={busy} onClick={save}>{busy?"กำลังบันทึก...":"บันทึกข้อมูล"}<UiIcon name="check" size={18}/></button></div>
    </section>
  </section>
}

function Field({label,value,onChange,disabled=false,wide=false}){return <label className={`modern-field ${wide?"wide":""}`}><span>{label}</span><input value={value??""} disabled={disabled} onChange={e=>onChange?.(e.target.value)}/></label>}
function SelectField({label,value,onChange,options=[]}){return <label className="modern-field"><span>{label}</span><select value={value||""} onChange={e=>onChange(e.target.value)}><option value="">เลือกข้อมูล</option>{options.map(x=><option key={x}>{x}</option>)}</select></label>}
function TextAreaField({label,value,onChange,placeholder=""}){return <label className="modern-field wide"><span>{label}</span><textarea rows={4} value={value||""} placeholder={placeholder} onChange={e=>onChange(e.target.value)}/></label>}
function groupDone(key,s){
  if(key==="personal")return !!(s.citizenId&&s.nickname&&s.birthDateBE&&s.gender&&(s.phone||s.noPhone));
  if(key==="address")return !!(s.address?.registered?.houseNo&&s.address?.registered?.district&&s.address?.registered?.province&&s.address?.travelMethod);
  if(key==="family")return !!(s.family?.guardian?.name&&s.family?.guardian?.phone);
  if(key==="emergency")return !!(s.emergency?.primary?.name&&s.emergency?.primary?.phone);
  if(key==="additional")return !!s.additional?.abilities;
  if(key==="learning")return !!((s.learning?.favoriteSubjects||[]).length&&s.learning?.postGraduationGoal);
  return false;
}
