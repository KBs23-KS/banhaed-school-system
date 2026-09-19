# Code Map

- `app/page.js` — หน้าแรก + Login นักเรียน + Login ครู/บุคลากร
- `app/student/page.js` — Dashboard นักเรียน + ฟอร์ม 6 หมวด + รูปประจำตัว
- `app/staff/page.js` — Dashboard ครู/บุคลากร
- `app/staff/my-room/page.js` — ห้องของฉัน
- `app/staff/students/page.js` — นักเรียนทั้งโรงเรียน
- `app/staff/students/[id]/page.js` — โปรไฟล์นักเรียน
- `app/staff/personnel/page.js` — บุคลากร / HR
- `app/staff/personnel/[id]/page.js` — โปรไฟล์บุคลากร 8 หมวด
- `app/staff/admin/page.js` — Admin / Excel / Accounts / Rooms / Academic Year / Integration
- `app/bootstrap/page.js` — สร้าง Admin คนแรก
- `components/StaffShell.js` — Sidebar / Topbar / Role-based navigation
- `components/SecureImage.js` — โหลดรูปจาก Google Drive ผ่าน secure proxy
- `components/UiIcon.js` — SVG icon set
- `app/api/**` — Next.js server APIs
- `lib/firebaseAdmin.js` — Firebase Admin
- `lib/studentAuth.js` — Student session + DOB hashing
- `lib/drive.js` — Google Drive upload/download
- `firestore.rules` — ปิด direct browser access
