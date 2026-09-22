# Banhaed School System v7 Final

ระบบข้อมูลนักเรียนและบุคลากร โรงเรียนบ้านแฮดศึกษา

## Design ที่ล็อกในรุ่นนี้

หน้าแรกใช้แนว Friendly School Portal ตาม mockup ล่าสุด: ไม่มีตราโรงเรียนบนหน้าแรก, ชื่อ “โรงเรียนบ้านแฮดศึกษา” อยู่กึ่งกลางเหนือ “ยินดีต้อนรับ”, คำขวัญเด่นขึ้น, กล่องเข้าสู่ระบบนักเรียน/ครูสมดุล และเหลือคุณค่าหลัก 3 ข้อ โดยจัดหน้า Desktop ให้พอดีหนึ่ง viewport ไม่ต้องเลื่อน

หลัง Login ใช้ Hybrid Professional: sidebar น้ำเงินเข้ม, topbar ขาว, ตารางและฟอร์มจริงจังขึ้น ลดความเป็นการ์ตูน แต่ยังมีโทนฟ้า/เขียวและภาพประกอบบางจุดให้ระบบดูเป็นมิตร

## ระบบที่รวมไว้

- Student first login + Student session
- Student dashboard / profile 6 หมวด / upload รูปเอง
- Staff Firebase Authentication
- Staff dashboard / ห้องของฉัน / นักเรียนทั้งโรงเรียน
- Personnel / HR / โปรไฟล์ 8 หมวด
- Admin / Roles / Homeroom / Classrooms
- Excel Import / Export
- Academic Year Rollover Preview
- Google Drive private file storage ผ่าน Server API
- Firestore ผ่าน Firebase Admin Server API
- Responsive desktop / tablet / mobile

ดูรายละเอียดหน้าทั้งหมดใน `PAGES.md` และขั้นตอนเปิดใช้จริงใน `SETUP-PRODUCTION.md`
