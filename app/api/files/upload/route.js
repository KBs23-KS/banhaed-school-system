import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/staffAuth";
import { getStudentSession } from "@/lib/studentSession";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { uploadBuffer, driveReady } from "@/lib/drive";
import { verifyRequestOrigin } from "@/lib/studentSecurity";

const PHOTO_MIMES = ["image/jpeg","image/png","image/webp"];
const DOCUMENT_MIMES = [...PHOTO_MIMES,"application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
function validImageBytes(buffer,mime) {
  if (mime==="image/jpeg") return buffer[0]===0xff && buffer[1]===0xd8 && buffer[2]===0xff;
  if (mime==="image/png") return buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (mime==="image/webp") return buffer.toString("ascii",0,4)==="RIFF" && buffer.toString("ascii",8,12)==="WEBP";
  return false;
}
export async function POST(request) {
  try {
    if (!verifyRequestOrigin(request)) return NextResponse.json({error:"Invalid request"},{status:403});
    if (!driveReady()) return NextResponse.json({error:"ยังไม่ได้ตั้งค่า Google Drive"},{status:503});
    const form = await request.formData();
    const file = form.get("file"), kind = String(form.get("kind")||"");
    const ownerIdRequest = String(form.get("ownerId")||"");
    if (!file || typeof file.arrayBuffer !== "function" || file.size === 0 || file.size > 8*1024*1024) return NextResponse.json({error:"ไฟล์ไม่ถูกต้องหรือมีขนาดเกิน 8 MB"},{status:400});
    const allowedMimes = kind==="student_photo" || kind==="personnel_photo" ? PHOTO_MIMES : kind==="personnel_document" ? DOCUMENT_MIMES : [];
    if (!allowedMimes.includes(file.type)) return NextResponse.json({error:"ไม่รองรับชนิดไฟล์นี้"},{status:400});
    const db = getAdminDb();
    let ownerType,ownerId,actor;
    if (request.headers.get("authorization")?.startsWith("Bearer ")) {
      const user = await requireStaff(request,["hr","admin"]);
      if (!ownerIdRequest || !/^[0-9a-zA-Z_-]{1,128}$/.test(ownerIdRequest)) return NextResponse.json({error:"กรุณาระบุเจ้าของเอกสาร"},{status:400});
      if (kind !== "personnel_photo" && kind !== "personnel_document") return NextResponse.json({error:"ไม่อนุญาตให้ส่งไฟล์ประเภทนี้"},{status:403});
      if (!(await db.collection("personnel").doc(ownerIdRequest).get()).exists) return NextResponse.json({error:"ไม่พบบุคลากร"},{status:404});
      ownerType="personnel";ownerId=ownerIdRequest;actor=user.uid;
    } else {
      const student = await getStudentSession();
      if (!student) return NextResponse.json({error:"กรุณาเข้าสู่ระบบใหม่"},{status:401});
      if (kind !== "student_photo") return NextResponse.json({error:"นักเรียนอัปโหลดได้เฉพาะรูปประจำตัว"},{status:403});
      ownerType="student";ownerId=student.studentId;actor=student.studentId;
    }
    const buffer=Buffer.from(await file.arrayBuffer());
    if (PHOTO_MIMES.includes(file.type) && !validImageBytes(buffer,file.type)) return NextResponse.json({error:"รูปภาพไม่ถูกต้อง"},{status:400});
    const safe=String(file.name||"upload").replace(/[^a-zA-Z0-9ก-๙._-]/g,"_").slice(0,100);
    const uploaded=await uploadBuffer({buffer,name:ownerId+"_"+Date.now()+"_"+safe,mimeType:file.type});
    const ref=await db.collection("documents").add({ownerType,ownerId,kind,driveFileId:uploaded.id,name:uploaded.name,mimeType:uploaded.mimeType,size:Number(uploaded.size||file.size),uploadedBy:actor,createdAt:new Date().toISOString()});
    if (kind==="student_photo") await db.collection("students").doc(ownerId).set({photoDocumentId:ref.id,updatedAt:new Date().toISOString()},{merge:true});
    if (kind==="personnel_photo") await db.collection("personnel").doc(ownerId).set({photoDocumentId:ref.id,updatedAt:new Date().toISOString()},{merge:true});
    return NextResponse.json({ok:true,document:{id:ref.id,name:uploaded.name,mimeType:uploaded.mimeType}});
  } catch(error) {
    if (["UNAUTHORIZED","NO_PROFILE","INACTIVE"].includes(error.message)) return NextResponse.json({error:"กรุณาเข้าสู่ระบบใหม่"},{status:401});
    if (error.message==="FORBIDDEN") return NextResponse.json({error:"ไม่มีสิทธิ์อัปโหลด"},{status:403});
    return NextResponse.json({error:"อัปโหลดไฟล์ไม่สำเร็จ"},{status:500});
  }
}
