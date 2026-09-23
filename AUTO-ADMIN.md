# Auto Admin — ใช้งานแบบง่าย

เวอร์ชันนี้ไม่ต้องเข้า `/bootstrap` เพื่อสร้าง Admin คนแรก

## ตั้งค่าแค่ 1 ค่า
ใน Vercel > Project > Settings > Environment Variables

- `ADMIN_PASSWORD` = รหัสผ่านที่ต้องการใช้กับ Admin

Username ถูกกำหนดไว้เป็น `admin`

ค่าเสริม (ไม่จำเป็น):
- `ADMIN_DISPLAY_NAME` = ชื่อที่แสดง เช่น `ผู้ดูแลระบบ`

## วิธีใช้
1. ตั้ง `ADMIN_PASSWORD` ใน Vercel แล้ว Redeploy
2. เปิดหน้า Login ครู
3. Username: `admin`
4. Password: ค่าเดียวกับ `ADMIN_PASSWORD`
5. ถ้ายังไม่มี Admin ระบบจะสร้าง Firebase Authentication + Firestore profile ให้อัตโนมัติ แล้ว Login ต่อทันที
6. ถ้ามี Admin อยู่แล้ว ระบบจะไม่สร้างซ้ำ

> ต้องมี FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY ตั้งไว้ใน Vercel ก่อน เพราะการสร้าง Admin ใช้ Firebase Admin SDK ฝั่ง Server
