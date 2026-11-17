"use client";
import { useEffect, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, firebasePreviewLocked } from "@/lib/firebase";
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

function StudentLogin({onBack}) {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [activationCode, setActivationCode] = useState("");
  const [step, setStep] = useState("lookup");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function lookup(event) {
    event.preventDefault(); if(firebasePreviewLocked){setError("Preview ยังไม่ได้เชื่อม Firebase สำหรับทดสอบ กรุณาติดต่อผู้ดูแลระบบ");return;} setLoading(true); setError("");
    try {
      const r = await fetch("/api/student/lookup", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({studentId})});
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "ไม่พบข้อมูลนักเรียน");
      setStep(data.student.activated ? "login" : "activate");
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function authenticate(event) {
    event.preventDefault(); if(firebasePreviewLocked){setError("ระบบทดสอบยังไม่พร้อมใช้งาน");return;} setLoading(true); setError("");
    try {
      if (step === "activate" && password !== confirmPassword) throw new Error("รหัสผ่านสองช่องไม่ตรงกัน");
      const endpoint = step === "activate" ? "/api/student/activate" : "/api/student/login";
      const r = await fetch(endpoint, {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({studentId,password,activationCode})});
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "เข้าสู่ระบบไม่สำเร็จ");
      location.href = "/student";
    } catch (e) { setError(e.message); setLoading(false); }
  }
  return <LoginFrame type="student" onBack={onBack}>
    <div className="login-form-head"><small>STUDENT PORTAL</small><h2>{step === "lookup" ? "เข้าสู่ระบบนักเรียน" : step === "activate" ? "เปิดใช้งานครั้งแรก" : "กรอกรหัสผ่าน"}</h2><p>{step === "lookup" ? "ใช้รหัสนักเรียนของคุณเพื่อตรวจสอบบัญชี" : step === "activate" ? "ต้องใช้รหัสเปิดใช้งานจากโรงเรียนก่อนตั้งรหัสผ่าน" : "กรอกรหัสผ่านที่คุณตั้งไว้เพื่อเข้าสู่ระบบ"}</p></div>
    {step === "lookup" && <form className="pretty-form" onSubmit={lookup}>
      <label>รหัสนักเรียน<div className="input-with-icon"><UiIcon name="person" size={18}/><input value={studentId} onChange={e=>setStudentId(e.target.value)} placeholder="รหัสประจำตัวนักเรียน" autoFocus required/></div></label>
      {error && <div className="form-error">{error}</div>}
      <button className="big-login blue" disabled={loading}>{loading ? "กำลังตรวจสอบ..." : "ตรวจสอบรหัสนักเรียน"}<UiIcon name="arrow"/></button>
      <div className="login-helper"><UiIcon name="shield" size={18}/><span><b>เปิดใช้งานครั้งแรก</b><small>ขอรับรหัสเปิดใช้งานเฉพาะตัวจากงานทะเบียนหรือผู้ดูแลระบบ</small></span></div>
    </form>}
    {(step === "login" || step === "activate") && <form className="pretty-form" onSubmit={authenticate}>
      <div className="selected-user"><div className="selected-avatar">น</div><div><b>รหัสนักเรียน {studentId}</b><span>{step === "activate" ? "เปิดใช้งานบัญชีใหม่" : "บัญชีที่เปิดใช้งานแล้ว"}</span></div></div>
      {step === "activate" && <label>รหัสเปิดใช้งานจากโรงเรียน<div className="input-with-icon"><UiIcon name="shield" size={18}/><input value={activationCode} onChange={e=>setActivationCode(e.target.value.trim().toUpperCase())} placeholder="รหัส 18 ตัวอักษร" autoComplete="one-time-code" required/></div></label>}
      <label>{step === "activate" ? "ตั้งรหัสผ่านใหม่ (อย่างน้อย 10 ตัว มีตัวอักษรและตัวเลข)" : "รหัสผ่าน"}<div className="input-with-icon"><UiIcon name="shield" size={18}/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={step === "activate" ? "new-password" : "current-password"} required/></div></label>
      {step === "activate" && <label>ยืนยันรหัสผ่านใหม่<div className="input-with-icon"><UiIcon name="shield" size={18}/><input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} autoComplete="new-password" required/></div></label>}
      {step === "login" && <div className="login-helper"><UiIcon name="shield" size={18}/><span><small>บัญชีเดิมที่ยังไม่ได้เปลี่ยนรหัสผ่าน สามารถใช้วันเดือนปีเกิด 8 หลักได้ชั่วคราว แล้วเปลี่ยนรหัสผ่านในหน้าข้อมูลของฉัน</small></span></div>}
      {error && <div className="form-error">{error}</div>}
      <button className="big-login blue" disabled={loading}>{loading ? "กำลังดำเนินการ..." : step === "activate" ? "เปิดใช้และเข้าสู่ระบบ" : "เข้าสู่ระบบ"}<UiIcon name="arrow"/></button>
      <button type="button" className="text-button" onClick={()=>{setStep("lookup");setPassword("");setActivationCode("");setConfirmPassword("");setError("")}}>เปลี่ยนรหัสนักเรียน</button>
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
    e.preventDefault();if(firebasePreviewLocked){setError("Preview ยังไม่ได้เชื่อม Firebase สำหรับทดสอบ");return;}setLoading(true);setError("");
    try {
      const entered=username.trim().toLowerCase();
      const normalized=entered.split("@")[0];
      if(!/^[a-z0-9_-]{3,32}$/.test(normalized)) throw new Error("กรุณากรอกชื่อผู้ใช้งานให้ถูกต้อง");
      const candidateEmails=normalized==="admin"
        ? [...new Set([entered.includes("@")?entered:"admin@banhaed.local","admin@banhaed.local","admin@banhaed.ac.th"])]
        : [entered.includes("@")?entered:`${normalized}@banhaed.local`];
      let signedIn=false;
      for(const candidate of candidateEmails){
        try{await signInWithEmailAndPassword(auth,candidate,password);signedIn=true;break;}
        catch(error){if(candidate===candidateEmails[candidateEmails.length-1]) throw error;}
      }
      if(!signedIn)throw new Error("เข้าสู่ระบบไม่สำเร็จ");
      if(typeof auth.authStateReady==="function")await auth.authStateReady();
      await auth.currentUser?.getIdToken(true);
      location.href="/staff";
    }catch(error){
      setError(error?.message==="กรุณากรอกชื่อผู้ใช้งานให้ถูกต้อง"?error.message:"ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      setLoading(false);
    }
  }
  return <LoginFrame type="staff" onBack={onBack}>
    <div className="login-form-head"><small>STAFF PORTAL</small><h2>เข้าสู่ระบบครูและบุคลากร</h2><p>ใช้บัญชีที่ผู้ดูแลระบบโรงเรียนกำหนดให้ • Admin ใช้ username: admin</p></div>
    <form className="pretty-form" onSubmit={submit}>
      <label>ชื่อผู้ใช้<div className="input-with-icon"><UiIcon name="person" size={18}/><input value={username} onChange={e=>setUsername(e.target.value)} placeholder="เช่น admin หรือ somchai" autoComplete="username"/></div></label>
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
    {firebasePreviewLocked && <div role="status" className="form-error" style={{position:"relative",zIndex:3,margin:"12px auto",maxWidth:760,textAlign:"center"}}>เว็บไซต์เวอร์ชันทดสอบ: ยังไม่ตั้งค่า Firebase สำหรับทดสอบ การเข้าสู่ระบบถูกปิดเพื่อความปลอดภัย</div>}

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
