import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/studentSession";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { calculateStudentCompletion } from "@/lib/system";
import { mergeStudentProfile, sanitizeStudentProfile } from "@/lib/studentProfile.mjs";
import { verifyRequestOrigin } from "@/lib/studentSecurity";

export async function GET() {
  try {
    const session = await getStudentSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const { auth, ...data } = session.data;
    return NextResponse.json({ student: { studentId: session.studentId, ...data, mustChangeLegacyPassword: auth.passwordVersion !== "custom" } }, {headers:{"Cache-Control":"private, no-store"}});
  } catch { return NextResponse.json({ error: "ไม่สามารถโหลดข้อมูล" }, { status: 500 }); }
}
export async function PATCH(request) {
  try {
    if (!verifyRequestOrigin(request)) return NextResponse.json({ error: "Invalid request" }, { status: 403 });
    const session = await getStudentSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const body = sanitizeStudentProfile(await request.json());
    if (!Object.keys(body).length) return NextResponse.json({error:"ไม่มีข้อมูลที่เปลี่ยนแปลง"},{status:400});
    const db = getAdminDb();
    if (body.citizenId) {
      const matches = await db.collection("students").where("citizenId", "==", body.citizenId).limit(2).get();
      if (matches.docs.some(d => d.id !== session.studentId)) return NextResponse.json({ error: "เลขประจำตัวประชาชนนี้มีอยู่ในระบบแล้ว" }, { status: 409 });
    }
    const completion=await db.runTransaction(async tx=>{
      const snap=await tx.get(session.ref);
      const current=snap.data();
      if(!snap.exists || current.status!=="active" || !current.auth?.activated ||
         Number(current.auth?.sessionVersion||0)!==Number(session.data.auth?.sessionVersion||0)) throw new Error("SESSION_CHANGED");
      const merged=mergeStudentProfile(current,body);
      const result=calculateStudentCompletion(merged);
      tx.set(session.ref,{...body,profileCompletion:result,
        profileStatus:result===100?"complete":"incomplete",
        updatedAt:new Date().toISOString()},{merge:true});
      return result;
    });
    return NextResponse.json({ok:true,profileCompletion:completion});
  } catch (error) {
    if (error.message === "INVALID_BIRTH_DATE") return NextResponse.json({ error: "วันเดือนปีเกิดต้องมี 8 หลัก" }, { status: 400 });
    if (error.message === "INVALID_CITIZEN_ID") return NextResponse.json({ error: "เลขประจำตัวประชาชนต้องมี 13 หลัก" }, { status: 400 });
    if (error.message === "SESSION_CHANGED") return NextResponse.json({error:"บัญชีมีการเปลี่ยนแปลง กรุณาเข้าสู่ระบบใหม่"},{status:401});
    if (error.message === "INVALID_PROFILE") return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
    return NextResponse.json({ error: "บันทึกข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}
