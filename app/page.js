\
"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

function Icon({ name, size = 22 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const icons = {
    student: (
      <svg {...common}>
        <path d="m3 10 9-5 9 5-9 5-9-5Z" />
        <path d="M7 12.5v4.2c2.6 1.8 7.4 1.8 10 0v-4.2" />
        <path d="M21 10v6" />
      </svg>
    ),
    staff: (
      <svg {...common}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M16 3.5a4 4 0 0 1 0 7.8" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      </svg>
    ),
    shield: (
      <svg {...common}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    cloud: (
      <svg {...common}>
        <path d="M17.5 19H7a5 5 0 1 1 1.4-9.8A6.5 6.5 0 0 1 21 11.5 3.5 3.5 0 0 1 17.5 19Z" />
      </svg>
    ),
    search: (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    ),
    phone: (
      <svg {...common}>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z" />
      </svg>
    ),
    arrow: (
      <svg {...common}>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </svg>
    ),
    back: (
      <svg {...common}>
        <path d="M19 12H5" />
        <path d="m11 18-6-6 6-6" />
      </svg>
    ),
    eye: (
      <svg {...common}>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  };

  return icons[name] || null;
}

function LoginView({ type, onBack }) {
  const isStudent = type === "student";
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="login-page">
      <div className="login-shell">
        <section className="login-brand">
          <button className="back-btn" onClick={onBack}>
            <Icon name="back" size={20} />
            กลับหน้าหลัก
          </button>

          <div className="brand-lockup">
            <div className="logo-wrap small">
              <Image
                src="/school-logo.png"
                alt="ตราโรงเรียนบ้านแฮดศึกษา"
                width={92}
                height={92}
                priority
              />
            </div>
            <div>
              <p className="eyebrow">BANHAEDSUKSA SCHOOL</p>
              <h1>โรงเรียนบ้านแฮดศึกษา</h1>
              <p>ระบบข้อมูลนักเรียนและบุคลากร</p>
            </div>
          </div>

          <div className="login-copy">
            <span className="login-icon">
              <Icon name={isStudent ? "student" : "staff"} size={28} />
            </span>
            <h2>{isStudent ? "เข้าสู่ระบบนักเรียน" : "เข้าสู่ระบบครูและบุคลากร"}</h2>
            <p>
              {isStudent
                ? "เข้าถึงข้อมูลส่วนตัว อัปเดตประวัติ และตรวจสอบความครบถ้วนของข้อมูล"
                : "เข้าถึงข้อมูลนักเรียน ห้องเรียน บุคลากร งานบุคคล และการจัดการระบบตามสิทธิ์"}
            </p>
          </div>

          <div className="login-security">
            <Icon name="shield" size={20} />
            <div>
              <b>ข้อมูลได้รับการจัดการตามสิทธิ์ผู้ใช้งาน</b>
              <span>ระบบจะแสดงเฉพาะเมนูและข้อมูลที่บัญชีของคุณได้รับอนุญาต</span>
            </div>
          </div>
        </section>

        <section className="login-card">
          <div className="login-card-head">
            <span className={`role-dot ${isStudent ? "blue" : "green"}`} />
            <div>
              <p>{isStudent ? "STUDENT PORTAL" : "STAFF PORTAL"}</p>
              <h3>{isStudent ? "เข้าสู่ระบบด้วยรหัสนักเรียน" : "เข้าสู่ระบบด้วยบัญชีบุคลากร"}</h3>
            </div>
          </div>

          <form onSubmit={(e) => e.preventDefault()}>
            <label>
              {isStudent ? "รหัสนักเรียน" : "ชื่อผู้ใช้"}
              <input
                autoComplete="username"
                placeholder={isStudent ? "กรอกรหัสนักเรียน" : "กรอก Username"}
              />
            </label>

            <label>
              {isStudent ? "วันเดือนปีเกิด 8 หลัก" : "รหัสผ่าน"}
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder={isStudent ? "เช่น 05012553" : "กรอกรหัสผ่าน"}
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="แสดงหรือซ่อนรหัสผ่าน"
                >
                  <Icon name="eye" size={19} />
                </button>
              </div>
            </label>

            {isStudent ? (
              <div className="helper-box">
                <b>เข้าใช้งานครั้งแรก?</b>
                <span>
                  กรอกรหัสนักเรียนก่อน ระบบจะแสดงชื่อ ชั้น ห้อง และเลขที่ให้ยืนยันตัวตน
                </span>
              </div>
            ) : (
              <div className="helper-box">
                <b>ลืมรหัสผ่าน?</b>
                <span>ติดต่อผู้ดูแลระบบของโรงเรียนเพื่อขอรีเซ็ตรหัสผ่าน</span>
              </div>
            )}

            <button className="login-submit" type="submit">
              เข้าสู่ระบบ
              <Icon name="arrow" size={19} />
            </button>
          </form>

          <p className="dev-note">
            หน้านี้เป็น UI พร้อมเชื่อม Firebase Authentication / Firestore ในขั้นถัดไป
          </p>
        </section>
      </div>
    </main>
  );
}

export default function Home() {
  const [view, setView] = useState("home");

  const year = useMemo(() => new Date().getFullYear() + 543, []);

  if (view === "student" || view === "staff") {
    return <LoginView type={view} onBack={() => setView("home")} />;
  }

  return (
    <main className="portal">
      <div className="noise" />
      <header className="topbar">
        <div className="topbar-inner">
          <div className="mini-brand">
            <div className="mini-logo">
              <Image
                src="/school-logo.png"
                alt="ตราโรงเรียนบ้านแฮดศึกษา"
                width={42}
                height={42}
                priority
              />
            </div>
            <div>
              <b>โรงเรียนบ้านแฮดศึกษา</b>
              <span>BANHAEDSUKSA SCHOOL</span>
            </div>
          </div>

          <div className="topbar-actions">
            <span className="system-online">
              <i /> ระบบพร้อมใช้งาน
            </span>
            <span className="academic-year">ปีการศึกษา {year}</span>
          </div>
        </div>
      </header>

      <section className="hero-section">
        <div className="hero-glow one" />
        <div className="hero-glow two" />

        <div className="hero-inner">
          <div className="hero-copy">
            <div className="school-badge">
              <div className="logo-wrap">
                <Image
                  src="/school-logo.png"
                  alt="ตราโรงเรียนบ้านแฮดศึกษา"
                  width={118}
                  height={118}
                  priority
                />
              </div>
              <div>
                <p className="eyebrow">BANHAEDSUKSA SCHOOL</p>
                <h1>โรงเรียนบ้านแฮดศึกษา</h1>
                <p className="motto">
                  เรียนดี กีฬาเยี่ยม เปี่ยมคุณธรรม นำชุมชนพัฒนา
                </p>
              </div>
            </div>

            <div className="hero-title">
              <span className="section-chip">SCHOOL INFORMATION SYSTEM</span>
              <h2>
                ระบบข้อมูลโรงเรียน
                <br />
                <em>ที่ใช้งานง่าย ปลอดภัย และเป็นระบบ</em>
              </h2>
              <p>
                ศูนย์กลางข้อมูลนักเรียน ครูและบุคลากร ห้องเรียน
                และงานบริหารบุคคลในระบบเดียว รองรับทั้งคอมพิวเตอร์ แท็บเล็ต และมือถือ
              </p>
            </div>

            <div className="trust-row">
              <div>
                <Icon name="shield" size={20} />
                <span>
                  <b>Role-based Access</b>
                  <small>ควบคุมสิทธิ์ตามบทบาท</small>
                </span>
              </div>
              <div>
                <Icon name="cloud" size={20} />
                <span>
                  <b>Cloud Ready</b>
                  <small>Firebase + Google Drive</small>
                </span>
              </div>
              <div>
                <Icon name="search" size={20} />
                <span>
                  <b>ค้นหาง่าย</b>
                  <small>เข้าถึงข้อมูลได้รวดเร็ว</small>
                </span>
              </div>
            </div>
          </div>

          <aside className="entry-panel">
            <div className="entry-head">
              <div>
                <p>เข้าสู่ระบบ</p>
                <h3>เลือกประเภทผู้ใช้งาน</h3>
              </div>
              <span className="secure-pill">
                <Icon name="shield" size={16} />
                Secure
              </span>
            </div>

            <button className="entry-card student" onClick={() => setView("student")}>
              <span className="entry-icon">
                <Icon name="student" size={28} />
              </span>
              <span className="entry-text">
                <small>STUDENT</small>
                <b>นักเรียน</b>
                <em>กรอกและแก้ไขข้อมูลส่วนตัว</em>
              </span>
              <span className="entry-arrow">
                <Icon name="arrow" size={20} />
              </span>
            </button>

            <button className="entry-card staff" onClick={() => setView("staff")}>
              <span className="entry-icon">
                <Icon name="staff" size={28} />
              </span>
              <span className="entry-text">
                <small>STAFF</small>
                <b>ครูและบุคลากร</b>
                <em>ข้อมูลนักเรียน • บุคลากร • งานบุคคล</em>
              </span>
              <span className="entry-arrow">
                <Icon name="arrow" size={20} />
              </span>
            </button>

            <div className="quick-help">
              <Icon name="phone" size={18} />
              <div>
                <b>ต้องการความช่วยเหลือ?</b>
                <span>ติดต่อผู้ดูแลระบบของโรงเรียน</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="feature-strip">
        <div>
          <span>01</span>
          <b>ข้อมูลนักเรียน</b>
          <p>โปรไฟล์ ครอบครัว การเดินทาง ฉุกเฉิน ความสามารถ และเป้าหมาย</p>
        </div>
        <div>
          <span>02</span>
          <b>ห้องของฉัน</b>
          <p>ค้นหา ตรวจสอบความครบถ้วน และจัดการข้อมูลนักเรียนประจำชั้น</p>
        </div>
        <div>
          <span>03</span>
          <b>ข้อมูลบุคลากร</b>
          <p>ประวัติการศึกษา วิทยฐานะ ใบอนุญาต เครื่องราชฯ และการอบรม</p>
        </div>
        <div>
          <span>04</span>
          <b>บริหารระบบ</b>
          <p>ห้องเรียน ปีการศึกษา สิทธิ์ผู้ใช้งาน นำเข้า ส่งออก และประวัติการแก้ไข</p>
        </div>
      </section>

      <footer>
        <div>
          <b>โรงเรียนบ้านแฮดศึกษา</b>
          <span>ระบบข้อมูลนักเรียนและบุคลากร</span>
        </div>
        <small>© {year} Banhaedsuksa School Information System</small>
      </footer>
    </main>
  );
}
