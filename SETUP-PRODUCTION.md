
# Banhaed School System v1.0 — Production Setup

โค้ดหลักพร้อมใช้งานแล้ว เหลือค่าลับ/สิทธิ์ที่เจ้าของระบบต้องตั้งเองใน Vercel และ Google เท่านั้น

## A. Vercel Environment Variables
Project > Settings > Environment Variables

1. FIREBASE_PROJECT_ID = `banhaed-school-system-43dc6`
2. FIREBASE_CLIENT_EMAIL = ค่า `client_email` จาก Firebase service account JSON
3. FIREBASE_PRIVATE_KEY = ค่า `private_key` จาก Firebase service account JSON
4. STUDENT_SESSION_SECRET = สุ่มอย่างน้อย 32 ตัวอักษร
5. BOOTSTRAP_SECRET = ตั้งรหัสลับชั่วคราวสำหรับสร้าง Admin คนแรก
6. GOOGLE_DRIVE_FOLDER_ID = ใส่ภายหลังเมื่อสร้างโฟลเดอร์ Drive

**ห้าม Commit service account JSON หรือ private key ลง GitHub**

## B. Firebase Service Account
Firebase Console > Project settings > Service accounts > Generate new private key
ใช้เฉพาะค่า `client_email` และ `private_key` ไปใส่ Vercel

## C. Firestore Rules
Firebase Console > Firestore Database > Rules
นำเนื้อหาใน `firestore.rules` ไป Publish
ข้อมูลทั้งหมดจะอ่าน/เขียนผ่าน Server API เท่านั้น

## D. Admin คนแรก
หลังตั้ง Environment Variables และ Redeploy:
เปิด `/bootstrap`
กรอก Bootstrap Secret + Username + Password + ชื่อ
สร้างสำเร็จแล้ว ให้ลบ `BOOTSTRAP_SECRET` ออกจาก Vercel และ Redeploy อีกครั้ง

## E. Google Drive
1. สร้างโฟลเดอร์หลัก เช่น `ระบบข้อมูลโรงเรียนบ้านแฮดศึกษา`
2. Share โฟลเดอร์นี้ให้ `FIREBASE_CLIENT_EMAIL` เป็น Editor
3. เปิด Google Drive API ใน Google Cloud project เดียวกับ Firebase
4. เอา Folder ID จาก URL ไปใส่ `GOOGLE_DRIVE_FOLDER_ID`
5. Redeploy
ไฟล์ที่ระบบอัปโหลดจะยังเป็น Private ภายในโฟลเดอร์ที่แชร์ ไม่ได้ตั้ง Anyone with the link

## F. Import นักเรียน
Admin > จัดการระบบ > นำเข้านักเรียน
Excel columns:
`รหัสนักเรียน | คำนำหน้า | ชื่อ | นามสกุล | ชั้น | ห้อง | เลขที่`
เลขประชาชนไม่ต้องนำเข้า นักเรียนกรอกเอง

## G. Account staff
Admin > จัดการระบบ > บัญชีผู้ใช้
สร้าง Username + Password และกำหนด roles: teacher / hr / admin

## H. ขอบเขต v1 ที่ทำแล้ว
- Landing / login responsive professional UI
- Staff Firebase Authentication
- Role profile + sidebar ตาม role
- Dashboard
- Student schoolwide search/list/profile
- Homeroom "ห้องของฉัน"
- Student first-login + DOB password hashing + HttpOnly session
- Student six-category profile form + completion
- Personnel directory/detail/editor 8-category structure
- Admin users / rooms
- Excel student import/export
- Academic year preview/rollover
- Google Drive server upload endpoint + document metadata
- Audit log for major edits/import/year rollover
- Firestore locked to server APIs

## ยังต้องกรอกข้อมูลจริง
- ครูที่ปรึกษาใน `users/{uid}.homerooms` (หน้า Admin UI รุ่นถัดไปสามารถทำ dropdown เต็มรูปแบบได้)
- บุคลากรจริง
- Drive folder / service account secret
