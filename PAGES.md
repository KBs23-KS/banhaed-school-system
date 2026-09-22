# หน้าทั้งหมดใน Banhaed School System v7

## หน้า Public / Login
- `/` — หน้าแรกโรงเรียน: ชื่อโรงเรียนอยู่กึ่งกลาง, ยินดีต้อนรับ, นักเรียน / ครูและบุคลากร, คุณค่าหลัก 3 ข้อ
- `/?login=student` — เข้าสู่ระบบนักเรียน / เปิดใช้งานครั้งแรก
- `/?login=staff` — เข้าสู่ระบบครูและบุคลากร
- `/bootstrap` — สร้าง Admin คนแรก (ใช้ครั้งแรกหลังตั้งค่า Server secrets)

## ฝั่งนักเรียน
- `/student` — Dashboard นักเรียน + ความครบถ้วนของข้อมูล
  - ข้อมูลส่วนตัว
  - ที่อยู่และการเดินทาง
  - ครอบครัว / ผู้ปกครอง
  - ผู้ติดต่อฉุกเฉิน
  - ความสามารถ / ข้อมูลเพิ่มเติม
  - การเรียนและเป้าหมาย
  - อัปโหลดรูปนักเรียนเอง

## ฝั่งครู / บุคลากร
- `/staff` — Dashboard ภาพรวม
- `/staff/my-room` — ห้องของฉัน / ครูที่ปรึกษา / ค้นหา / กรอง / สถานะข้อมูล / Export / พิมพ์
- `/staff/students` — นักเรียนทั้งโรงเรียน
- `/staff/students/[id]` — โปรไฟล์นักเรียน 6 หมวด + แก้ไขตามสิทธิ์
- `/staff/personnel` — รายชื่อและข้อมูลบุคลากร
- `/staff/personnel?mode=hr` — โหมดงานบุคคล
- `/staff/personnel/[id]` — โปรไฟล์บุคลากร 8 หมวด + เอกสาร
- `/staff/admin` — จัดการระบบ: บัญชีผู้ใช้, Role, ครูที่ปรึกษา, ห้องเรียน, Import Excel, ปีการศึกษา, การเชื่อมต่อ

## API / Backend
- `/api/student/*` — นักเรียน: lookup, activate, login, logout, profile
- `/api/staff/me` — ตรวจสิทธิ์ครู/บุคลากร
- `/api/students/*` — ข้อมูลนักเรียน
- `/api/my-room` — ห้องที่ครูเป็นที่ปรึกษา
- `/api/personnel/*` — ข้อมูลบุคลากร
- `/api/admin/*` — users, classrooms, import/export, academic year rollover
- `/api/files/*` — Upload / Secure file proxy สำหรับ Google Drive
- `/api/dashboard` — สรุปข้อมูลหน้า Dashboard
- `/api/bootstrap` — สร้าง Admin คนแรก
