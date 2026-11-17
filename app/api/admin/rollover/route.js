import crypto from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { requireStaff, staffError } from "@/lib/staffAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { getSystemSettings } from "@/lib/system";
import { verifyRequestOrigin } from "@/lib/studentSecurity";

function normalizeRows(rows) {
  if (!Array.isArray(rows) || !rows.length || rows.length > 5000) throw new Error("INVALID_ROWS");
  const seen = new Set();
  return rows.map(r => {
    const studentId = String(r.studentId || r["รหัสนักเรียน"] || "").trim();
    const grade = String(r.grade || r["ชั้น"] || "").replace(/^ม\.?/,"").trim();
    const room = String(r.room || r["ห้อง"] || "").trim();
    const number = Number(r.number || r["เลขที่"] || 0);
    if (!/^[0-9A-Za-z-]{1,32}$/.test(studentId) || !/^[1-6]$/.test(grade) || !/^[0-9]{1,3}$/.test(room) || !Number.isInteger(number) || number < 0 || number > 1000 || seen.has(studentId)) throw new Error("INVALID_ROWS");
    seen.add(studentId);
    return { studentId, grade, room, number, prefix:String(r.prefix||r["คำนำหน้า"]||"").slice(0,30), firstName:String(r.firstName||r["ชื่อ"]||"").trim().slice(0,100), lastName:String(r.lastName||r["นามสกุล"]||"").trim().slice(0,100) };
  });
}
function signingSecret() {
  const secret = process.env.STUDENT_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("STUDENT_SESSION_SECRET missing");
  return secret;
}
function sign(payload) {
  const value = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return value + "." + crypto.createHmac("sha256", signingSecret()).update(value).digest("base64url");
}
function verify(token, expected) {
  try {
    const [value,signature,extra] = String(token || "").split(".");
    if (extra !== undefined || !value || !signature) return false;
    const actual = crypto.createHmac("sha256", signingSecret()).update(value).digest("base64url");
    const a=Buffer.from(signature),b=Buffer.from(actual);
    if (a.length!==b.length || !crypto.timingSafeEqual(a,b)) return false;
    const data=JSON.parse(Buffer.from(value,"base64url").toString());
    return data.fromYear===expected.fromYear && data.toYear===expected.toYear && data.rowsHash===expected.rowsHash && Date.now()-data.issuedAt < 20*60*1000 && Date.now()>=data.issuedAt;
  } catch {return false;}
}
export async function POST(request) {
  try {
    if (!verifyRequestOrigin(request)) return NextResponse.json({error:"Invalid request"},{status:403});
    const admin=await requireStaff(request,["admin"]);
    const body=await request.json(),db=getAdminDb(),settings=await getSystemSettings();
    const fromYear=String(body.fromYear || settings.currentAcademicYear);
    const toYear=String(body.toYear || Number(fromYear)+1);
    if (fromYear!==String(settings.currentAcademicYear) || Number(toYear)!==Number(fromYear)+1) return NextResponse.json({error:"ปีการศึกษาปัจจุบันมีการเปลี่ยนแปลง กรุณาตรวจสอบใหม่"},{status:409});
    if (settings.rolloverLock) return NextResponse.json({error:"มีการเลื่อนชั้นหรือกู้คืนข้อมูลที่ยังดำเนินการอยู่ กรุณาตรวจสอบก่อน"},{status:409});
    const rows=normalizeRows(body.rows);
    const foundIds=new Set(rows.map(r=>r.studentId));
    const current=await db.collection("students").where("status","==","active").get();
    const missing=current.docs.filter(d=>!foundIds.has(d.id)).map(d=>({studentId:d.id,grade:String(d.data().currentEnrollment?.grade||"")}));
    const missingNonGraduates=missing.filter(x=>x.grade!=="6").map(x=>x.studentId);
    const graduates=missing.filter(x=>x.grade==="6").map(x=>x.studentId);
    const currentIds=new Set(current.docs.map(d=>d.id));
    const newOrInactive=rows.filter(r=>!currentIds.has(r.studentId));
    const unknown=[];
    for (let i=0;i<newOrInactive.length;i+=200) {
      const batch=newOrInactive.slice(i,i+200);
      const documents=await db.getAll(...batch.map(r=>db.collection("students").doc(r.studentId)));
      for (let j=0;j<documents.length;j++) if(!documents[j].exists)unknown.push(batch[j]);
    }
    const newStudentIds=unknown.map(r=>r.studentId);
    const newStudentMissingDetails=unknown.filter(r=>!r.firstName||!r.lastName).map(r=>r.studentId);
    const preview={fromYear,toYear,current:current.size,found:rows.length,missing:missing.map(x=>x.studentId),missingNonGraduates,graduates,newStudentIds,newStudentMissingDetails};
    const rowsHash=crypto.createHash("sha256").update(JSON.stringify(rows)).digest("hex");
    if (body.mode!=="commit") return NextResponse.json({preview,previewToken:sign({fromYear,toYear,rowsHash,issuedAt:Date.now()})});
    if (!verify(body.previewToken,{fromYear,toYear,rowsHash})) return NextResponse.json({error:"ต้องกด Preview ใหม่ก่อนยืนยันขึ้นปีการศึกษา"},{status:409});
    if (missingNonGraduates.length || newStudentMissingDetails.length) return NextResponse.json({error:"ไฟล์มีนักเรียนตกหล่นหรือข้อมูลนักเรียนใหม่ไม่ครบ กรุณาตรวจสอบก่อนขึ้นปี",missingNonGraduates,newStudentMissingDetails},{status:409});
    const operationId=fromYear+"-"+toYear+"-"+Date.now()+"-"+crypto.randomBytes(4).toString("hex");
    // Back up every existing record that might be changed, including inactive students.
    const originalById=new Map(current.docs.map(doc=>[doc.id,doc]));
    const extra=rows.filter(row=>!originalById.has(row.studentId) && !newStudentIds.includes(row.studentId));
    for(let i=0;i<extra.length;i+=200){
      const docs=await db.getAll(...extra.slice(i,i+200).map(row=>db.collection("students").doc(row.studentId)));
      for(const doc of docs)if(doc.exists)originalById.set(doc.id,doc);
    }
    const originals=[...originalById.values()];
    const backupRef=db.collection("rolloverBackups").doc(operationId);
    for(let i=0;i<originals.length;i+=300){
      const batch=db.batch();
      for(const doc of originals.slice(i,i+300)){
        const data=doc.data();
        batch.set(backupRef.collection("students").doc(doc.id),{
          currentEnrollment:data.currentEnrollment ?? null,
          status:data.status ?? null,
          graduatedYear:data.graduatedYear ?? null,
          updatedAt:data.updatedAt ?? null,
          rolloverId:data.rolloverId ?? null
        });
      }
      await batch.commit();
    }
    // Snapshot target-year enrollment records too, so restoration never loses pre-existing history.
    for(let i=0;i<rows.length;i+=200){
      const slice=rows.slice(i,i+200);
      const refs=slice.map(r=>db.collection("studentEnrollments").doc(toYear+"_"+r.studentId));
      const existing=await db.getAll(...refs);
      const found=existing.filter(doc=>doc.exists);
      if(found.length){
        const batch=db.batch();
        for(const doc of found)batch.set(backupRef.collection("enrollments").doc(doc.id),{data:doc.data()});
        await batch.commit();
      }
    }
    await backupRef.set({
      fromYear,toYear,createdAt:new Date().toISOString(),
      actorUid:admin.uid,affected:originals.length,
      enrolledIds:rows.map(r=>r.studentId),
      newStudentIds,state:"snapshot",enrollmentCount:rows.length
    });
    // Serialize academic-year changes so two admins cannot commit concurrently.
    const systemRef=db.collection("settings").doc("system");
    await db.runTransaction(async tx=>{
      const live=await tx.get(systemRef);
      const actualYear=String(live.exists ? (live.data().currentAcademicYear || fromYear) : fromYear);
      if(actualYear!==fromYear)throw new Error("ROLLOVER_YEAR_CHANGED");
      if(live.data()?.rolloverLock)throw new Error("ROLLOVER_IN_PROGRESS");
      tx.set(systemRef,{currentAcademicYear:fromYear,rolloverLock:operationId},{merge:true});
      tx.update(backupRef,{state:"in_progress",startedAt:new Date().toISOString()});
    });
    const brandNew=new Set(newStudentIds);
    for (let i=0;i<rows.length;i+=200) {
      const batch=db.batch();
      for (const r of rows.slice(i,i+200)) {
        const enrollment={academicYear:toYear,grade:r.grade,room:r.room,number:r.number};
        const record={currentEnrollment:enrollment,status:"active",rolloverId:operationId,updatedAt:new Date().toISOString()};
        if(brandNew.has(r.studentId))Object.assign(record,{prefix:r.prefix,firstName:r.firstName,lastName:r.lastName,profileStatus:"not_started",profileCompletion:0,createdAt:new Date().toISOString()});
        batch.set(db.collection("students").doc(r.studentId),record,{merge:true});
        batch.set(db.collection("studentEnrollments").doc(toYear+"_"+r.studentId),{studentId:r.studentId,...enrollment,rolloverId:operationId},{merge:true});
      }
      await batch.commit();
    }
    for (let i=0;i<graduates.length;i+=400) {
      const batch=db.batch();
      for (const id of graduates.slice(i,i+400)) batch.set(db.collection("students").doc(id),{status:"graduated",graduatedYear:fromYear,rolloverId:operationId},{merge:true});
      await batch.commit();
    }
    await db.runTransaction(async tx=>{
      const system=await tx.get(systemRef);
      if(system.data()?.rolloverLock!==operationId)throw new Error("ROLLOVER_LOCK_LOST");
      tx.set(systemRef,{currentAcademicYear:toYear,rolloverLock:FieldValue.delete()},{merge:true});
      tx.update(backupRef,{state:"committed",committedAt:new Date().toISOString()});
    });
    await db.collection("auditLogs").add({actorUid:admin.uid,action:"academic_year_rollover",fromYear,toYear,backupId:operationId,createdAt:new Date().toISOString()}).catch(()=>{});
    return NextResponse.json({ok:true,preview,backupId:operationId});
  } catch(e) {
    if (["ROLLOVER_YEAR_CHANGED","ROLLOVER_IN_PROGRESS","ROLLOVER_LOCK_LOST"].includes(e.message)) return NextResponse.json({error:"ปีการศึกษาหรือสถานะการดำเนินการเปลี่ยนไป กรุณาตรวจสอบก่อน"},{status:409});
    if (e.message==="INVALID_ROWS") return NextResponse.json({error:"ไฟล์ปีการศึกษาใหม่มีข้อมูลผิดรูปแบบหรือรหัสซ้ำ"},{status:400});
    const x=staffError(e);return NextResponse.json({error:x.message},{status:x.status});
  }
}
