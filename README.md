# Banhaed School System

ระบบจัดการข้อมูลนักเรียนและบุคลากรโรงเรียนบ้านแฮดศึกษา (Next.js / Firebase / Google Drive)

## การตั้งค่าระบบ
- [คู่มือตั้งค่าระบบ Production](SETUP-PRODUCTION.md)
- [คู่มือเชื่อมต่อ Firebase](SETUP-FIREBASE.md)
- [คู่มือย้ายระบบและกู้คืนปีการศึกษา](MIGRATION-2026-11-17.md)
- [รายการ Environment Variables และตรวจสอบความพร้อม](ENV-CHECKLIST.md)

**ห้าม Commit Service Account JSON, private key, .env หรือรหัสผ่าน ลง GitHub**

## คำสั่งทดสอบ
```bash
npm install
npm test
npm run build
```

ระบบยังต้องผ่านการทดสอบกับ Firebase โปรเจกต์ทดสอบก่อน Merge เข้า Production
