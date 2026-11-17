import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { requireStaff, staffError } from "@/lib/staffAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { getSystemSettings } from "@/lib/system";
import { verifyRequestOrigin } from "@/lib/studentSecurity";

const validId = value => /^[0-9]{4}-[0-9]{4}-[0-9]{13}-[0-9a-f]{8}$/.test(String(value || ""));

export async function GET(request) {
  try {
    await requireStaff(request, ["admin"]);
    const db=getAdminDb();
    const records=await db.collection("rolloverBackups").orderBy("createdAt", "desc").limit(15).get();
    return NextResponse.json({backups:records.docs.map(doc=>{
      const x=doc.data();
      return {id:doc.id,fromYear:x.fromYear,toYear:x.toYear,state:x.state,createdAt:x.createdAt,affected:x.affected,newStudents:x.newStudentIds?.length||0};
    })});
  } catch(e) {
    const x=staffError(e);
    return NextResponse.json({error:x.message},{status:x.status});
  }
}
export async function POST(request) {
  try {
    if (!verifyRequestOrigin(request)) return NextResponse.json({error:"Invalid request"},{status:403});
    const admin=await requireStaff(request, ["admin"]);
    const body=await request.json(),id=String(body.backupId || "");
    if(!validId(id))return NextResponse.json({error:"รหัสสำรองข้อมูลไม่ถูกต้อง"},{status:400});
    const db=getAdminDb();
    const ref=db.collection("rolloverBackups").doc(id);
    const snap=await ref.get();
    if(!snap.exists)return NextResponse.json({error:"ไม่พบข้อมูลสำรอง"},{status:404});
    const info=snap.data();
    if(!["prepared","committed","restoring"].includes(info.state))return NextResponse.json({error:"ข้อมูลสำรองนี้ไม่สามารถกู้คืนได้"},{status:409});
    const settings=await getSystemSettings();
    if(![info.fromYear, info.toYear].includes(String(settings.currentAcademicYear))){
      return NextResponse.json({error:"ปีการศึกษาไม่ตรงกับข้อมูลสำรอง ไม่สามารถกู้คืนข้ามปีได้"},{status:409});
    }
    const records=await ref.collection("students").get();
    const enrollmentBackups=await ref.collection("enrollments").get();
    const enrollmentMap=new Map(enrollmentBackups.docs.map(doc=>[doc.id,doc.data().data]));
    const newIds=Array.isArray(info.newStudentIds)?info.newStudentIds:[];
    const enrolled=Array.isArray(info.enrolledIds)?info.enrolledIds:[];
    if(records.size!==info.affected || !Array.isArray(info.newStudentIds) || !Array.isArray(info.enrolledIds)){
      return NextResponse.json({error:"ข้อมูลสำรองไม่ครบ กรุณาให้ผู้ดูแลตรวจสอบ"},{status:409});
    }
    const preview={backupId:id,fromYear:info.fromYear,toYear:info.toYear,existingStudents:records.size,newStudents:newIds.length,affectedEnrollments:enrolled.length,state:info.state};
    if(body.mode!=="commit")return NextResponse.json({preview});
    if(body.confirmation!=="RESTORE:"+id)return NextResponse.json({error:"กรุณายืนยันรหัสข้อมูลสำรองให้ถูกต้อง"},{status:400});
    // Recheck the year before the first write and mark the operation as restoring.
    await db.runTransaction(async tx=>{
      const [latest,year]=await Promise.all([tx.get(ref),tx.get(db.collection("settings").doc("system"))]);
      if(!["prepared","committed","restoring"].includes(latest.data()?.state))throw Error("RESTORE_STATE");
      const currentYear=String(year.data()?.currentAcademicYear || settings.currentAcademicYear);
      if(![info.fromYear,info.toYear].includes(currentYear))throw Error("RESTORE_YEAR");
      tx.update(ref,{state:"restoring",restoringAt:new Date().toISOString(),restoringBy:admin.uid});
    });
    // Restore only enrollment/status metadata; never overwrite student-entered profile data.
    for(let i=0;i<records.docs.length;i+=125){
      const chunk=records.docs.slice(i,i+125);
      await db.runTransaction(async tx=>{
        const live=await Promise.all(chunk.map(doc=>tx.get(db.collection("students").doc(doc.id))));
        for(let j=0;j<chunk.length;j++){
          const current=live[j];
          if(!current.exists)continue;
          if(current.data().rolloverId!==id)continue; // untouched or already restored
          const old=chunk[j].data();
          tx.update(current.ref,{
            currentEnrollment:old.currentEnrollment??FieldValue.delete(),
            status:old.status??FieldValue.delete(),
            graduatedYear:old.graduatedYear??FieldValue.delete(),
            rolloverId:old.rolloverId??FieldValue.delete(),
            updatedAt:new Date().toISOString()
          });
        }
      });
    }
    // Do not delete newly created students: disable them to preserve any profile they entered.
    for(let i=0;i<newIds.length;i+=125){
      const chunk=newIds.slice(i,i+125);
      await db.runTransaction(async tx=>{
        const live=await Promise.all(chunk.map(studentId=>tx.get(db.collection("students").doc(studentId))));
        for(const doc of live)if(doc.exists && doc.data().rolloverId===id){
          tx.update(doc.ref,{status:"inactive",currentEnrollment:FieldValue.delete(),rolloverId:FieldValue.delete(),updatedAt:new Date().toISOString()});
        }
      });
    }
    // Remove only the enrollment docs created by this exact rollover.
    for(let i=0;i<enrolled.length;i+=125){
      const chunk=enrolled.slice(i,i+125);
      await db.runTransaction(async tx=>{
        const refs=chunk.map(studentId=>db.collection("studentEnrollments").doc(info.toYear+"_"+studentId));
        const live=await Promise.all(refs.map(docRef=>tx.get(docRef)));
        for(const doc of live)if(doc.exists && doc.data().rolloverId===id){
          if(enrollmentMap.has(doc.id))tx.set(doc.ref,enrollmentMap.get(doc.id));
          else tx.delete(doc.ref);
        }
      });
    }
    await db.collection("settings").doc("system").set({currentAcademicYear:info.fromYear},{merge:true});
    await ref.update({state:"restored",restoredAt:new Date().toISOString(),restoredBy:admin.uid});
    await db.collection("auditLogs").add({actorUid:admin.uid,action:"restore_academic_year_rollover",backupId:id,createdAt:new Date().toISOString()});
    return NextResponse.json({ok:true,preview});
  } catch(e) {
    if(["RESTORE_STATE","RESTORE_YEAR"].includes(e.message))return NextResponse.json({error:"สถานะหรือปีการศึกษาเปลี่ยนไป กรุณาลองใหม่"},{status:409});
    const x=staffError(e);
    return NextResponse.json({error:x.message},{status:x.status});
  }
}
