# Banhaed School System v2.0 — Production Setup

โค้ดรวมพร้อม Deploy แล้ว เหลือค่าลับและสิทธิ์ของบัญชี Google ที่เจ้าของระบบต้องตั้งเอง

## A. อัปโค้ดขึ้น GitHub / Vercel

1. อัปโหลดไฟล์ทั้งหมดใน ZIP นี้ทับ repository `KBs23-KS/banhaed-school-system`
2. Commit เข้า branch `main`
3. Vercel จะ Redeploy อัตโนมัติ
4. ถ้า Build ผ่าน หน้าแรกแบบใหม่จะขึ้นทันที

## B. Vercel Environment Variables

ไปที่ Vercel > Project > Settings > Environment Variables แล้วเพิ่ม:

- `FIREBASE_PROJECT_ID` = `banhaed-school-system-43dc6`
- `FIREBASE_CLIENT_EMAIL` = `client_email` จาก Firebase Service Account
- `FIREBASE_PRIVATE_KEY` = `private_key` จาก Firebase Service Account
- `STUDENT_SESSION_SECRET` = สุ่มอย่างน้อย 32 ตัวอักษร
- `BOOTSTRAP_SECRET` = รหัสชั่วคราวสำหรับสร้าง Admin คนแรก
- `GOOGLE_DRIVE_FOLDER_ID` = Folder ID ของโฟลเดอร์ Google Drive หลัก

หลังแก้ Environment Variables ให้ Redeploy

**ห้าม Commit private key / service-account JSON ลง GitHub**

## C. Firestore Rules

Firebase Console > Firestore Database > Rules

คัดลอก `firestore.rules` แล้ว Publish

โค้ดชุดนี้ตั้งใจให้ข้อมูลหลักผ่าน Next.js Server APIs เท่านั้น

## D. สร้าง Admin คนแรก

หลังใส่ Firebase Admin secrets และ Redeploy:

1. เปิด `https://โดเมนของคุณ/bootstrap`
2. กรอก `BOOTSTRAP_SECRET`
3. กำหนด Username / Password / ชื่อ Admin
4. สร้างสำเร็จแล้วให้ลบ `BOOTSTRAP_SECRET` ออกจาก Vercel
5. Redeploy อีกครั้ง

## E. Google Drive

1. เปิด Google Drive API ใน Google Cloud project เดียวกับ Firebase
2. สร้างโฟลเดอร์หลัก เช่น `ระบบข้อมูลโรงเรียนบ้านแฮดศึกษา`
3. Share โฟลเดอร์ให้ `FIREBASE_CLIENT_EMAIL` เป็น **Editor**
4. คัดลอก Folder ID จาก URL มาใส่ `GOOGLE_DRIVE_FOLDER_ID`
5. Redeploy

ไฟล์ควรคงเป็น Private ไม่ตั้ง `Anyone with the link`

ระบบรองรับ:
- รูปนักเรียน: compress เป็น JPG ก่อนอัปโหลด
- เอกสารบุคลากร / เอกสารอื่น: ไม่เกิน 8 MB ต่อไฟล์
- ไฟล์ Drive อ่านผ่าน secure server proxy ตาม session/role

## F. นำเข้านักเรียน

Admin > จัดการระบบ > นำเข้า Excel

คอลัมน์ขั้นต่ำ:

`รหัสนักเรียน | คำนำหน้า | ชื่อ | นามสกุล | ชั้น | ห้อง | เลขที่`

เลขประจำตัวประชาชน **ไม่ต้องนำเข้า** นักเรียนกรอกเอง

## G. สร้างห้องและครูที่ปรึกษา

1. Admin > ห้องเรียน: เพิ่มห้องประจำปีการศึกษา
2. Admin > บัญชีผู้ใช้: สร้างครู
3. ติ๊กห้องที่ครูรับผิดชอบได้หลายห้อง
4. Homeroom assignment ถูกเก็บแยกจาก roles

## H. ฟังก์ชันใน v2.0

- Homepage / Student Login / Staff Login ดีไซน์ใหม่
- Student first-login: รหัสนักเรียน → ยืนยันตัว → DOB 8 หลัก
- Student dashboard + 6 หมวด + completion
- Student photo → Google Drive
- Staff Firebase Authentication
- Staff Dashboard
- Student schoolwide search
- ห้องของฉัน + filters + completion summary
- Student profile 6 tabs + edit permission สำหรับ homeroom/Admin
- Personnel directory + 5 management groups
- HR mode
- Personnel 8-category profile shell
- Google Drive document upload
- Admin user / role / homeroom management
- Classroom management
- Excel import
- Academic year rollover preview + commit
- Audit logs ใน API งานสำคัญ
- Responsive desktop / tablet / mobile

## I. การทดสอบก่อนเปิดใช้จริง

ทดสอบอย่างน้อย:

1. Admin login
2. สร้างครู 1 คน + ตั้งครูที่ปรึกษา
3. Import นักเรียนทดสอบ 5–10 คน
4. Student first login / login ครั้งถัดไป
5. Student save ครบทั้ง 6 หมวด
6. ครูเห็นเฉพาะสิทธิ์แก้ไขของห้องตัวเอง
7. Upload รูป/เอกสาร Google Drive
8. Excel import และ Academic Year Preview
9. เปิดหน้าเว็บบนมือถือ + tablet + desktop

ถ้า Vercel Build Error ให้เก็บ Build Log ไว้เพื่อแก้จากโค้ดชุดนี้ต่อ ไม่ต้องเริ่มใหม่
