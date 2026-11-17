# Vercel / Firebase Configuration Checklist

ตรวจสอบวันที่ 17 พฤศจิกายน 2569 สำหรับ:
- [banhaed-school-system](https://vercel.com/bhsc/banhaed-school-system/settings/environment-variables)
- [banhaed-school-system-18pe](https://vercel.com/bhsc/banhaed-school-system-18pe/settings/environment-variables)

## ค่าที่ตั้งค่าแล้ว (ทั้งสองโปรเจกต์)

| Key | Production | Preview + Development |
| --- | --- | --- |
| `FIREBASE_PROJECT_ID` | `banhaed-school-system-43dc6` | ค่าเดิมชั่วคราว — **ต้องเปลี่ยนเป็น Firebase test project ก่อนเปิด Backend ทดสอบ** |
| `STUDENT_SESSION_SECRET` | ตั้งค่าแบบเข้ารหัสแล้ว | ตั้งค่าแบบเข้ารหัสแล้ว **คนละค่ากับ Production** |

## ค่าที่ยังต้องเชื่อมจากบริการจริง

| Variable | Source | Scope | ใช้เมื่อ |
| --- | --- | --- | --- |
| `FIREBASE_CLIENT_EMAIL` | Firebase Console → Project settings → Service accounts → `client_email` | Secret; เฉพาะ Environment ของโปรเจกต์นั้น | API, Auth, Firestore |
| `FIREBASE_PRIVATE_KEY` | Service account `private_key` จากไฟล์ JSON ที่ดาวน์โหลดโดยเจ้าของโปรเจกต์ | Secret; เฉพาะ Environment ของโปรเจกต์นั้น | API, Auth, Firestore |
| `GOOGLE_DRIVE_FOLDER_ID` | Google Drive → Folder URL | Config | Upload / Download |
| `BOOTSTRAP_SECRET` | กำหนดรหัสลับชั่วคราวสำหรับสร้าง Admin คนแรก | Secret; ลบทิ้งหลังสร้างสำเร็จ | เมื่อยังไม่มี Admin |
| `ADMIN_PASSWORD` | ค่าเฉพาะสำหรับทางเลือก Auto-bootstrap (ไม่จำเป็นกับ Login ปกติ) | Secret | เฉพาะเมื่อเปิด `ENABLE_AUTO_ADMIN_BOOTSTRAP=true` |
| `ENABLE_AUTO_ADMIN_BOOTSTRAP` | ตั้ง `true` ชั่วคราวเฉพาะเมื่อจำเป็น | Config | ไม่แนะนำหากมี Admin อยู่แล้ว |

**ห้ามส่ง `FIREBASE_PRIVATE_KEY`, `BOOTSTRAP_SECRET`, `ADMIN_PASSWORD` ใน Chat หรือ Commit ลง GitHub**

## ตั้งค่าฐานข้อมูล Production
1. เจ้าของโปรเจกต์ Firebase เข้า Firebase Console → Project settings → Service Accounts
2. สร้าง Service Account key ในบัญชีที่ได้รับอนุญาตเท่านั้น
3. นำ `client_email` และ `private_key` ใส่ใน Vercel Production โดยเลือกชนิด Secret
4. เปิด Firebase Authentication → Sign-in method → Email/Password
5. ตรวจสอบว่า Firestore ใช้ Rules แบบไม่ให้ Browser อ่าน/เขียนข้อมูลบุคคลโดยตรง
6. ตรวจสอบการลงชื่อเข้าใช้ Firebase Auth / ตรวจ `users/{uid}` ของ Admin หลัง redeploy

## ตั้งค่า Preview ให้แยก Production
1. สร้าง Firebase **test** project ใหม่ก่อนใช้ Preview กับข้อมูลทดสอบ
2. ใน Vercel Preview ตั้ง `FIREBASE_PROJECT_ID` เป็น test project (คนละค่ากับ production)
3. ตั้ง Firebase service account credentials สำหรับ test project เท่านั้น
4. ตั้ง `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`,
   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`,
   `NEXT_PUBLIC_FIREBASE_APP_ID` จาก Firebase Web App ของ test project
5. ตั้ง `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` ตามที่ใช้จริงถ้าจำเป็น
6. **Fail-closed:** Server API และหน้า Login บน Vercel Preview จะไม่เข้าถึง Firebase Production และจะไม่ทำงานถ้ายังไม่ได้กำหนด Firebase test project สำหรับทั้ง Browser และ Server (Vercel ตั้งค่า `NEXT_PUBLIC_SCHOOL_PREVIEW_LOCK=true` สำหรับ Preview แล้ว)

## Google Drive
1. เปิด Google Drive API ใน Google Cloud project ที่ถูกต้อง
2. สร้างโฟลเดอร์เอกสารส่วนบุคคลแบบ Private (พิจารณา Shared Drive สำหรับองค์กร)
3. ให้ Service Account ที่ใช้ Drive มีสิทธิ์เขียน/อ่านในโฟลเดอร์ที่เลือก
4. คัดลอก Folder ID จาก URL โฟลเดอร์ มาใส่ `GOOGLE_DRIVE_FOLDER_ID`
5. ทดสอบอัปโหลดและดาวน์โหลดกับบัญชีทดสอบก่อนเปิดใช้งานจริง

## ข้อควรทราบ
- Vercel Environment Variables **ไม่ได้อัปเดต Deployment เก่าทันที** หลังตั้งค่าให้สร้าง Deployment ใหม่
- อย่า Merge PR จนกว่าผลทดสอบ Login, Import/Export, Drive, ปีการศึกษาและกู้คืน ผ่านใน Firebase test project
- `ADMIN_PASSWORD` ไม่ใช่รหัส Login ที่ระบบจะรีเซ็ตให้อัตโนมัติอีกแล้ว การเข้าสู่ระบบ Admin ใช้รหัสผ่านใน Firebase Authentication ตามปกติ
- โปรดตรวจสอบว่าโปรเจกต์ `banhaed-school-system-18pe` ยังจำเป็นต้อง Deploy แยกหรือไม่ก่อนปล่อย Production สองแห่ง
