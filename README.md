# Banhaed School Information System v2.0

ระบบข้อมูลนักเรียนและบุคลากร **โรงเรียนบ้านแฮดศึกษา**

เวอร์ชันนี้รวมงาน 1–9 ในโค้ดชุดเดียว โดยยึด Design Language จาก mockup ที่อนุมัติ: ฟ้า–ขาว–เขียว, การ์ดมุมโค้ง, ภาพลักษณ์น่ารักแต่ใช้งานจริงแบบมืออาชีพ และ Responsive ทุกหน้าหลัก

## สิ่งที่รวมในชุดนี้

1. Homepage แบบใหม่ + Student / Staff portal
2. Student login ครั้งแรก + login ปกติ
3. Student dashboard + ฟอร์ม 6 หมวด + % ความครบถ้วน + อัปโหลดรูป
4. Staff dashboard + นักเรียนทั้งโรงเรียน + ห้องของฉัน + โปรไฟล์นักเรียน
5. Personnel / HR + โครงสร้างข้อมูลบุคลากร 8 หมวด + เอกสาร
6. Admin + บัญชี + ห้องเรียน + Excel Import + Academic Year Rollover
7. Firebase Authentication + Firestore Server APIs + Google Drive upload/download proxy
8. Role permissions: teacher / hr / admin + homeroom assignments
9. Responsive desktop / tablet / mobile + syntax/static validation

## Deploy

อ่าน `SETUP-PRODUCTION.md` แล้วตั้ง Environment Variables ใน Vercel ก่อนเปิดใช้ข้อมูลจริง

## สำคัญ

- ห้าม Commit `FIREBASE_PRIVATE_KEY` ลง GitHub
- Firestore Rules ในชุดนี้ปิดการอ่าน/เขียนจาก browser โดยตรง ข้อมูลหลักวิ่งผ่าน Next.js Server APIs
- รูปและเอกสาร Google Drive ควรเป็น Private และแชร์เฉพาะ Service Account ที่ระบบใช้
