import { NextResponse } from "next/server";
import { requireStaff, staffError } from "@/lib/staffAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { getSystemSettings } from "@/lib/system";
import { verifyRequestOrigin } from "@/lib/studentSecurity";

const pick = (row, ...keys) => { for (const key of keys) if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") return row[key]; return ""; };
export async function POST(request) {
  try {
    if (!verifyRequestOrigin(request)) return NextResponse.json({ error: "Invalid request" }, { status: 403 });
    const user = await requireStaff(request, ["admin"]);
    const body = await request.json();
    const rows = body.rows, settings = await getSystemSettings(), year = String(body.academicYear || settings.currentAcademicYear);
    if (!Array.isArray(rows) || !rows.length || rows.length > 5000 || !/^[0-9]{4}$/.test(year)) return NextResponse.json({ error: "จำนวนแถวหรือปีการศึกษาไม่ถูกต้อง" }, { status: 400 });
    const valid = [], errors = [], seen = new Set();
    rows.forEach((r, i) => {
      if (!r || typeof r !== "object") { errors.push({row:i+2,error:"ข้อมูลไม่ถูกต้อง"});return; }
      const studentId = String(pick(r,"รหัสนักเรียน","studentId")).trim();
      const firstName = String(pick(r,"ชื่อ","firstName")).trim();
      const lastName = String(pick(r,"นามสกุล","lastName")).trim();
      const grade = String(pick(r,"ชั้น","grade")).replace(/^ม\.?/,"").trim();
      const room = String(pick(r,"ห้อง","room")).trim();
      const number = Number(pick(r,"เลขที่","number") || 0);
      if (!/^[0-9A-Za-z-]{1,32}$/.test(studentId) || !firstName || !lastName || !/^[1-6]$/.test(grade) || !/^[0-9]{1,3}$/.test(room) || !Number.isInteger(number) || number < 0 || number > 1000) errors.push({row:i+2,error:"ข้อมูลหลักไม่ถูกต้อง"});
      else if (seen.has(studentId)) errors.push({row:i+2,error:"รหัสนักเรียนซ้ำในไฟล์"});
      else { seen.add(studentId); valid.push({studentId,prefix:String(pick(r,"คำนำหน้า","prefix")).slice(0,30),firstName:firstName.slice(0,100),lastName:lastName.slice(0,100),grade,room,number}); }
    });
    if (errors.length) return NextResponse.json({ error:"พบข้อมูลที่ไม่ถูกต้อง", errors:errors.slice(0,100) }, { status:400 });
    const db = getAdminDb();
    let count = 0;
    for (let i=0; i<valid.length; i+=200) {
      const batch = db.batch();
      const group = valid.slice(i,i+200);
      const refs = group.map(s=>db.collection("students").doc(s.studentId));
      const existing = await db.getAll(...refs);
      for (let k=0; k<group.length; k++) {
        const s = group[k], old = existing[k].data();
        const enrollment = {academicYear:year,grade:s.grade,room:s.room,number:s.number};
        const data = {prefix:s.prefix,firstName:s.firstName,lastName:s.lastName,currentEnrollment:enrollment,updatedAt:new Date().toISOString()};
        if (!old) { data.status="active";data.profileStatus="not_started";data.profileCompletion=0;data.createdAt=new Date().toISOString(); }
        batch.set(refs[k],data,{merge:true});
        batch.set(db.collection("studentEnrollments").doc(year+"_"+s.studentId),{studentId:s.studentId,...enrollment},{merge:true});
      }
      await batch.commit();count+=group.length;
    }
    await db.collection("auditLogs").add({actorUid:user.uid,action:"import_students",count,academicYear:year,createdAt:new Date().toISOString()});
    return NextResponse.json({ok:true,count});
  } catch (e) {const x=staffError(e);return NextResponse.json({error:x.message},{status:x.status});}
}
