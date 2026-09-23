"use client";
import { useEffect, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import UiIcon from "@/components/UiIcon";

function SchoolBrand({compact=false}){
  return <div className={`landing-brand ${compact?"compact":""}`}>
    <img src="/school-logo.png" alt="ตราโรงเรียนบ้านแฮดศึกษา"/>
    <div><b>โรงเรียนบ้านแฮดศึกษา</b><span>“เรียนดี กีฬาเยี่ยม เปี่ยมคุณธรรม นำชุมชนพัฒนา”</span></div>
  </div>;
}

function LoginFrame({type,onBack,children}){
  const student=type==="student";
  return <main className={`login-scene ${student?"student-login":"staff-login"}`}>
    <div className="login-scene-bg"/>
    <div className="login-page-wrap">
      <button className="back-home" onClick={onBack}><UiIcon name="back" size={18}/>กลับหน้าแรก</button>
      <SchoolBrand compact/>
      <section className="login-window">
        <div className={`login-art ${student?"student":"staff"}`}>
          <div className="login-art-image"/>
          <div className="login-art-copy">
            <div className="login-role-icon"><UiIcon name={student?"room":"students"} size={31}/></div>
            <h1>{student?"ระบบข้อมูลนักเรียน":"ระบบสำหรับครูและบุคลากร"}</h1>
            <p>{student?"อัปเดตข้อมูลส่วนตัวของคุณให้ครบถ้วนและเป็นปัจจุบัน":"เข้าถึงข้อมูลนักเรียน บุคลากร และงานบริหารตามสิทธิ์ที่ได้รับ"}</p>
          </div>
          <div className="hand-note">{student?"“ทุกวันคือโอกาสสร้างอนาคตที่ยิ่งใหญ่”":"“ครูคือพลังสำคัญของการเปลี่ยนแปลง”"}</div>
        </div>
        <div className="login-form-panel">{children}</div>
      </section>
      <div className="login-values"><span>◉ เรียนดี</span><span>♥ กีฬาเยี่ยม</span><span>◆ เปี่ยมคุณธรรม</span><span>✦ นำชุมชนพัฒนา</span></div>
    </div>
  </main>;
}

function StudentLogin({onBack}){
  const [studentId,setStudentId]=useState("");
  const [dob,setDob]=useState("");
  const [student,setStudent]=useState(null);
  const [step,setStep]=useState("lookup");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  async function lookup(e){
    e.preventDefault(); setLoading(true); setError("");
    try{
      const r=await fetch("/api/student/lookup",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({studentId})});
      const d=await r.json(); if(!r.ok) throw new Error(d.error);
      setStudent(d.student); setStep(d.student.activated?"login":"confirm");
    }catch(e){setError(e.message||"ไม่สามารถตรวจสอบรหัสนักเรียนได้");} finally{setLoading(false);}
  }
  async function authenticate(e){
    e.preventDefault(); setLoading(true); setError("");
    try{
      const endpoint=step==="activate"?"/api/student/activate":"/api/student/login";
      const r=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({studentId,dob})});
      const d=await r.json(); if(!r.ok) throw new Error(d.error);
      location.href="/student";
    }catch(e){setError(e.message||"เข้าสู่ระบบไม่สำเร็จ");setLoading(false);}
  }
  return <LoginFrame type="student" onBack={onBack}>
    <div className="login-form-head"><small>STUDENT PORTAL</small><h2>{step==="lookup"?"เข้าสู่ระบบนักเรียน":step==="confirm"?"ยืนยันข้อมูลของฉัน":"กรอกวันเดือนปีเกิด"}</h2><p>{step==="lookup"?"ครั้งแรกใช้เพียงรหัสนักเรียน ระบบจะแสดงข้อมูลให้ยืนยัน":"ข้อมูลของคุณจะถูกจัดเก็บอย่างปลอดภัย"}</p></div>
    {step==="lookup"&&<form className="pretty-form" onSubmit={lookup}>
      <label>รหัสนักเรียน<div className="input-with-icon"><UiIcon name="person" size={18}/><input value={studentId} onChange={e=>setStudentId(e.target.value)} placeholder="เช่น 06368" autoFocus/></div></label>
      {error&&<div className="form-error">{error}</div>}
      <button className="big-login blue" disabled={loading}>{loading?"กำลังตรวจสอบ...":"ตรวจสอบรหัสนักเรียน"}<UiIcon name="arrow"/></button>
      <div className="login-helper"><UiIcon name="shield" size={18}/><span><b>เข้าใช้งานครั้งแรก</b><small>ระบบจะให้คุณยืนยันชื่อ ชั้น ห้อง และเลขที่ก่อนตั้งวันเกิด 8 หลัก</small></span></div>
    </form>}
    {step==="confirm"&&student&&<div className="confirm-card">
      <div className="confirm-avatar">{student.firstName?.[0]||"น"}</div>
      <small>ตรวจสอบว่าเป็นข้อมูลของคุณ</small>
      <h3>{student.prefix}{student.firstName} {student.lastName}</h3>
      <p>ชั้น ม.{student.grade}/{student.room} · เลขที่ {student.number||"-"}</p>
      <button className="big-login blue" onClick={()=>setStep("activate")}>นี่คือข้อมูลของฉัน<UiIcon name="check"/></button>
      <button className="text-button" onClick={()=>{setStep("lookup");setStudent(null)}}>ไม่ใช่ข้อมูลของฉัน</button>
    </div>}
    {(step==="login"||step==="activate")&&<form className="pretty-form" onSubmit={authenticate}>
      <div className="selected-user"><div className="selected-avatar">{student?.firstName?.[0]||"น"}</div><div><b>{student?.prefix}{student?.firstName} {student?.lastName}</b><span>รหัสนักเรียน {studentId}</span></div></div>
      <label>วันเดือนปีเกิด 8 หลัก<div className="input-with-icon"><UiIcon name="calendar" size={18}/><input value={dob} onChange={e=>setDob(e.target.value.replace(/\D/g,"").slice(0,8))} inputMode="numeric" placeholder="เช่น 05012553" autoFocus/></div></label>
      {step==="activate"&&<div className="login-helper"><UiIcon name="shield" size={18}/><span><b>เปิดใช้งานครั้งแรก</b><small>วันเดือนปีเกิดจะใช้เป็นรหัสผ่านสำหรับการเข้าสู่ระบบครั้งถัดไป</small></span></div>}
      {error&&<div className="form-error">{error}</div>}
      <button className="big-login blue" disabled={loading}>{loading?"กำลังดำเนินการ...":step==="activate"?"บันทึกและเริ่มใช้งาน":"เข้าสู่ระบบ"}<UiIcon name="arrow"/></button>
      <button type="button" className="text-button" onClick={()=>{setStep("lookup");setStudent(null);setDob("")}}>เปลี่ยนรหัสนักเรียน</button>
    </form>}
  </LoginFrame>;
}

function StaffLogin({onBack}){
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [show,setShow]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  async function submit(e){
    e.preventDefault();setLoading(true);setError("");
    try{
      const email=username.includes("@")?username.trim():`${username.trim().toLowerCase()}@banhaed.local`;
      await signInWithEmailAndPassword(auth,email,password); location.href="/staff";
    }catch{setError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");setLoading(false);}
  }
  return <LoginFrame type="staff" onBack={onBack}>
    <div className="login-form-head"><small>STAFF PORTAL</small><h2>เข้าสู่ระบบครูและบุคลากร</h2><p>ใช้บัญชีที่ผู้ดูแลระบบโรงเรียนกำหนดให้</p></div>
    <form className="pretty-form" onSubmit={submit}>
      <label>ชื่อผู้ใช้<div className="input-with-icon"><UiIcon name="person" size={18}/><input value={username} onChange={e=>setUsername(e.target.value)} placeholder="เช่น somchai" autoComplete="username"/></div></label>
      <label>รหัสผ่าน<div className="input-with-icon"><UiIcon name="shield" size={18}/><input value={password} onChange={e=>setPassword(e.target.value)} type={show?"text":"password"} placeholder="กรอกรหัสผ่าน" autoComplete="current-password"/><button type="button" className="peek-btn" onClick={()=>setShow(v=>!v)}><UiIcon name="eye" size={18}/></button></div></label>
      {error&&<div className="form-error">{error}</div>}
      <button className="big-login green" disabled={loading}>{loading?"กำลังเข้าสู่ระบบ...":"เข้าสู่ระบบ"}<UiIcon name="arrow"/></button>
      <div className="login-helper"><UiIcon name="shield" size={18}/><span><b>ลืมรหัสผ่าน?</b><small>ติดต่อผู้ดูแลระบบเพื่อรีเซ็ตรหัสผ่านของคุณ</small></span></div>
    </form>
  </LoginFrame>;
}

export default function Home(){
  const [view,setView]=useState("home");
  useEffect(()=>{const q=new URLSearchParams(location.search).get("login");if(q==="student"||q==="staff")setView(q)},[]);
  if(view==="student")return <StudentLogin onBack={()=>setView("home")}/>;
  if(view==="staff")return <StaffLogin onBack={()=>setView("home")}/>;

  return <main className="bh-home">
    <div className="bh-home-bg" aria-hidden="true"/>
    <div className="bh-home-tint" aria-hidden="true"/>

    <section className="bh-home-main">
      <header className="bh-home-heading">
        <div className="bh-school-name">โรงเรียนบ้านแฮดศึกษา</div>
        <div className="bh-welcome-line">
          <span className="bh-accent bh-accent-left" aria-hidden="true"/><h1>ยินดีต้อนรับ</h1><span className="bh-accent bh-accent-right" aria-hidden="true"/>
        </div>
        <h2>เข้าสู่ระบบข้อมูลนักเรียนและบุคลากร</h2>
        <div className="bh-motto">“เรียนดี กีฬาเยี่ยม เปี่ยมคุณธรรม นำชุมชนพัฒนา”</div>
      </header>

      <div className="bh-login-grid">
        <article className="bh-login-card bh-student-card">
          <div className="bh-card-art"><img src="/art/home-students.png" alt="นักเรียน"/></div>
          <div className="bh-card-content">
            <div className="bh-card-title"><span className="bh-role-icon student"><UiIcon name="room" size={31}/></span><h3>นักเรียน</h3></div>
            <p>กรอกและแก้ไขข้อมูลส่วนตัว<br/>ตรวจสอบข้อมูลของตนเองได้ตลอดเวลา</p>
            <button className="bh-enter-button student" onClick={()=>setView("student")}><span>เข้าสู่ระบบนักเรียน</span><UiIcon name="arrow" size={23}/></button>
          </div>
        </article>

        <article className="bh-login-card bh-staff-card">
          <div className="bh-card-art"><img src="/art/home-staff.png" alt="ครูและบุคลากร"/></div>
          <div className="bh-card-content">
            <div className="bh-card-title"><span className="bh-role-icon staff"><UiIcon name="students" size={31}/></span><h3>ครูและบุคลากร</h3></div>
            <p>จัดการข้อมูลนักเรียน ข้อมูลบุคลากร<br/>และงานบุคคล</p>
            <button className="bh-enter-button staff" onClick={()=>setView("staff")}><span>เข้าสู่ระบบครู</span><UiIcon name="arrow" size={23}/></button>
          </div>
        </article>
      </div>
    </section>

    <div className="bh-wave" aria-hidden="true">
      <svg viewBox="0 0 1600 190" preserveAspectRatio="none">
        <path d="M0,28 C340,132 1260,132 1600,28 L1600,190 L0,190 Z" fill="rgba(226,241,255,.74)"/>
        <path d="M0,40 C360,116 1240,116 1600,40 L1600,190 L0,190 Z" fill="rgba(239,248,255,.92)"/>
        <path d="M0,52 C355,105 1245,105 1600,52 L1600,190 L0,190 Z" fill="#ffffff"/>
      </svg>
    </div>

    <section className="bh-feature-row" aria-label="จุดเด่นของระบบ">
      <div className="bh-feature"><span className="bh-feature-icon blue"><UiIcon name="book" size={30}/></span><div><b>ส่งเสริมการเรียนรู้</b><small>พัฒนาศักยภาพนักเรียนให้ก้าวไกล</small></div></div>
      <div className="bh-feature"><span className="bh-feature-icon green"><UiIcon name="users" size={30}/></span><div><b>พัฒนาบุคลากร</b><small>ยกระดับคุณภาพการศึกษาอย่างต่อเนื่อง</small></div></div>
      <div className="bh-feature"><span className="bh-feature-icon navy"><UiIcon name="heart" size={30}/></span><div><b>โรงเรียนและชุมชน</b><small>สร้างความร่วมมือเพื่อสังคมที่เข้มแข็ง</small></div></div>
    </section>

    <span className="bh-leaf bh-leaf-left" aria-hidden="true"/>
    <span className="bh-leaf bh-leaf-right" aria-hidden="true"/>
  </main>;
}
