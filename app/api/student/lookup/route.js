
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { normalizeStudentId } from "@/lib/studentAuth";
export async function POST(request){try{const {studentId:raw}=await request.json();const studentId=normalizeStudentId(raw);if(!studentId)return NextResponse.json({error:"กรุณากรอกรหัสนักเรียน"},{status:400});const snap=await getAdminDb().collection("students").doc(studentId).get();if(!snap.exists)return NextResponse.json({error:"ไม่พบรหัสนักเรียนนี้ในระบบ"},{status:404});const s=snap.data(),e=s.currentEnrollment||{};return NextResponse.json({student:{studentId,prefix:s.prefix||"",firstName:s.firstName||"",lastName:s.lastName||"",grade:e.grade||s.grade||"",room:e.room||s.room||"",number:e.number??s.number??"",activated:Boolean(s.auth?.activated)}});}catch(e){console.error(e);return NextResponse.json({error:"ระบบนักเรียนยังไม่พร้อมใช้งาน"},{status:500});}}
