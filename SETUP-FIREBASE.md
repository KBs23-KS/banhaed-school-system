# Firebase Setup — Banhaed School System v2.0

Firebase project ที่ใช้: `banhaed-school-system-43dc6`

## 1. Firebase Authentication
เปิด `Email/Password` สำหรับบัญชีครู/บุคลากร

Admin UI จะสร้างบัญชีครูเป็นอีเมลภายในรูปแบบ:
`username@banhaed.local`

ผู้ใช้กรอกเฉพาะ Username เช่น `somchai` ในหน้าเว็บ ระบบจะแปลงให้อัตโนมัติ

## 2. Firebase Admin สำหรับ Server API
สร้าง Service Account จาก Firebase Console > Project Settings > Service Accounts

นำเฉพาะค่าต่อไปนี้ใส่ Vercel Environment Variables:
- `FIREBASE_PROJECT_ID=banhaed-school-system-43dc6`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

**อย่าอัปโหลด Service Account JSON ขึ้น GitHub และอย่าส่ง private key ในแชต**

## 3. Student session
ตั้ง `STUDENT_SESSION_SECRET` เป็นข้อความสุ่มยาวอย่างน้อย 32 ตัวอักษร

Student login ทำงานฝั่ง Server และเก็บ session ใน HttpOnly cookie

## 4. Firestore Rules
นำ `firestore.rules` ไป Publish ที่ Firestore Database > Rules

Rules ในโปรเจกต์นี้ตั้ง `allow read, write: if false` สำหรับ Browser SDK เพราะข้อมูลหลักอ่าน/เขียนผ่าน Firebase Admin บน Next.js Server APIs

## 5. โครงข้อมูลนักเรียนขั้นต่ำ
แนะนำให้นำเข้าผ่าน Admin > นำเข้า Excel แทนการสร้างด้วยมือ

Document: `students/{studentId}`

```json
{
  "prefix": "ด.ช.",
  "firstName": "ชื่อ",
  "lastName": "นามสกุล",
  "status": "active",
  "currentEnrollment": {
    "academicYear": "2569",
    "grade": "1",
    "room": "1",
    "number": 1
  },
  "profileStatus": "not_started",
  "profileCompletion": 0
}
```

## 6. Staff role document
หลังสร้างผู้ใช้ Firebase Auth ระบบเก็บสิทธิ์ไว้ที่ `users/{uid}`

```json
{
  "username": "somchai",
  "displayName": "นายสมชาย ใจดี",
  "roles": ["teacher"],
  "homerooms": [
    { "academicYear": "2569", "grade": "3", "room": "1" }
  ],
  "status": "active"
}
```
