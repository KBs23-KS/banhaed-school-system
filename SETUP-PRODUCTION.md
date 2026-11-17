# Banhaed School System — Production Setup (อัปเดต 17 พฤศจิกายน 2569)

> **ก่อนเผยแพร่ระบบจริง:** อ่าน [ENV-CHECKLIST.md](ENV-CHECKLIST.md) และ [MIGRATION-2026-11-17.md](MIGRATION-2026-11-17.md)

## 1. GitHub และ Vercel
- Repository: `KBs23-KS/banhaed-school-system`
- Branch Production: `main`
- ก่อน Merge ตรวจ GitHub Actions `npm test` และ `npm run build` ให้ผ่าน
- Vercel มีสองโปรเจกต์: `banhaed-school-system` และ `banhaed-school-system-18pe` โปรดตรวจการใช้งานของแต่ละแห่ง

## 2. ค่าที่ต้องมีใน Vercel
- `FIREBASE_PROJECT_ID` — Project ID
- `FIREBASE_CLIENT_EMAIL` — Service Account client email (Secret)
- `FIREBASE_PRIVATE_KEY` — Service Account private key (Secret)
- `STUDENT_SESSION_SECRET` — Session signing key (Secret)
- `GOOGLE_DRIVE_FOLDER_ID` — โฟลเดอร์เก็บเอกสาร (เมื่อเปิดใช้เอกสาร)
- `BOOTSTRAP_SECRET` — ตั้งชั่วคราว **เฉพาะครั้งแรก** หากยังไม่มีผู้ดูแลระบบ

**ห้ามนำ Service Account JSON หรือรหัสผ่านไป Commit และห้ามส่งในแชต** หลังแก้ Environment Variables ต้อง Redeploy เพื่อให้ค่ามีผลกับ Deployment ใหม่

## 3. Firebase Authentication และ Admin
1. เปิด Firebase Authentication แบบ Email/Password
2. สร้าง Admin คนแรกผ่าน `/bootstrap` ด้วย `BOOTSTRAP_SECRET` (หากยังไม่เคยสร้าง)
3. ตั้งรหัสผ่าน Admin ใน Firebase Authentication และเข้าสู่ระบบด้วย Username `admin`
4. บัญชี Admin ที่มีอยู่เข้าสู่ระบบโดยตรงผ่าน Firebase Auth และจะ **ไม่ถูกรีเซ็ตรหัสผ่านหรือยกระดับ Role** ทุกครั้งที่ Login
5. ลบ `BOOTSTRAP_SECRET` หลังสร้าง Admin สำเร็จ และ Redeploy
6. Endpoint `/api/auto-admin` ถูกปิดโดยปริยาย เปิดได้เฉพาะกรณีเตรียม Admin ครั้งแรกโดยตั้ง `ENABLE_AUTO_ADMIN_BOOTSTRAP=true` ชั่วคราว พร้อม `ADMIN_PASSWORD` ที่ปลอดภัย และปิดอีกครั้งเมื่อเสร็จ

## 4. Firestore Rules
ตรวจสอบว่า Firestore Rules เป็นแบบไม่อนุญาตให้ Browser อ่าน/เขียนข้อมูลส่วนบุคคลโดยตรง และใช้งาน Server API ตามสิทธิ์แทน

## 5. Google Drive
เปิด Drive API, สร้างโฟลเดอร์ Private, ให้ Service Account มีสิทธิ์ตามจำเป็น แล้วตั้ง `GOOGLE_DRIVE_FOLDER_ID` ใน Vercel ทดสอบอ่าน/เขียนด้วยไฟล์ทดลองก่อน

## 6. ระบบนักเรียน
- นักเรียนใหม่: รหัสนักเรียน → รหัสเปิดใช้งานจาก Admin → ตั้งรหัสผ่านใหม่
- นักเรียนที่เปิดใช้บัญชีเดิมแล้ว: ใช้รหัสเดิมได้ชั่วคราว แต่ควรเปลี่ยนรหัสผ่าน
- งานทะเบียน: Import ไฟล์ `.xlsx` และตรวจผลก่อนใช้งานจริง
- ครูทั่วไป: ดูรายชื่อพื้นฐาน นักเรียนในห้องที่เป็นครูที่ปรึกษาจึงมีสิทธิ์ดูข้อมูลละเอียดและแก้ไขตามที่ได้รับอนุญาต

## 7. ขึ้นปีการศึกษา
- ทำ Preview และตรวจนักเรียนตกหล่นก่อน Commit
- ระบบสร้างข้อมูลสำรองสำหรับการกู้คืน; หากกู้คืนให้ใช้เมนู **Admin → ปีการศึกษา → กู้คืน**
- ก่อนทำกับข้อมูลจริง สำรอง Firestore ทั้งระบบจากบริการต้นทางก่อนเสมอ

## 8. ทดสอบก่อนเปิดใช้งาน
1. Admin Login และการจัดการบัญชี
2. Student Activation และ Legacy Login
3. Teacher / Homeroom / HR / Admin access
4. Excel Import/Export
5. Upload/Download Google Drive
6. Rollover + Restore บน Firebase test project
7. Desktop / Mobile และ Preview Deployment

**ต้องทดสอบบริการจริงแยกจากการผ่าน Next.js Build** เพราะ Build ไม่ยืนยันว่า Firebase/Drive Credentials พร้อมใช้งาน
