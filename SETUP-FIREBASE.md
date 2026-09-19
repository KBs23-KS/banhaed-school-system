# ตั้งค่าระบบหลัง Deploy v3

## 1) Staff Login
เว็บใช้ Firebase Authentication Email/Password จริงแล้ว

เพื่อให้ครูใช้ Username เช่น `somchai`:
- สร้างผู้ใช้ใน Firebase Authentication เป็นอีเมล `somchai@banhaed.local`
- ผู้ใช้กรอกเพียง `somchai` ในหน้า Login
- เว็บจะแปลงเป็น `somchai@banhaed.local` ให้อัตโนมัติ

จากนั้นสร้าง Firestore document:
`users/{Firebase UID}`

ตัวอย่าง:
{
  "displayName": "ชื่อครู",
  "roles": ["teacher", "admin"],
  "status": "active"
}

## 2) Student Login (server-side)
ต้องตั้ง Vercel Environment Variables เพิ่ม:
- FIREBASE_PROJECT_ID = banhaed-school-system-43dc6
- FIREBASE_CLIENT_EMAIL = จาก Firebase Service Account
- FIREBASE_PRIVATE_KEY = จาก Firebase Service Account
- STUDENT_SESSION_SECRET = สุ่มอย่างน้อย 32 ตัวอักษร

ห้ามส่ง FIREBASE_PRIVATE_KEY มาในแชต และห้าม Commit ลง GitHub

## 3) Student collection ขั้นต่ำ
Document ID = รหัสนักเรียน

students/{studentId}
{
  "prefix": "ด.ช.",
  "firstName": "ชื่อ",
  "lastName": "นามสกุล",
  "grade": "1",
  "room": "1",
  "number": 1,
  "profileStatus": "not_started"
}

## 4) Firestore Rules
คัดลอกไฟล์ `firestore.rules` ไปวางใน Firebase Console > Firestore Database > Rules แล้ว Publish

## 5) สิ่งที่ทำงานใน v3
- Landing page มืออาชีพ
- Staff login ด้วย Firebase Authentication จริง
- Role-based dashboard จาก users/{uid}
- Student first login: รหัสนักเรียน → ยืนยันชื่อ/ชั้น/ห้อง → ตั้งวันเกิด 8 หลัก
- Student login ครั้งถัดไปด้วยรหัสนักเรียน + วันเกิด
- Student session เป็น HttpOnly cookie
- Student dashboard shell
- Firestore starter rules
