import { NextResponse } from "next/server";
import { requireStaff, staffError } from "@/lib/staffAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { getSystemSettings } from "@/lib/system";
import { verifyRequestOrigin } from "@/lib/studentSecurity";
export async function GET(request) {
  try {await requireStaff(request,["teacher","hr","admin"]);const snap=await getAdminDb().collection("classrooms").orderBy("grade").get();return NextResponse.json({classrooms:snap.docs.map(d=>({id:d.id,...d.data()}))});}
  catch(e){const x=staffError(e);return NextResponse.json({error:x.message},{status:x.status});}
}
export async function POST(request) {
  try {
    if (!verifyRequestOrigin(request)) return NextResponse.json({error:"Invalid request"},{status:403});
    await requireStaff(request,["admin"]);
    const body=await request.json(),settings=await getSystemSettings(),year=String(body.academicYear||settings.currentAcademicYear),grade=String(body.grade||""),room=String(body.room||"");
    if (!/^[0-9]{4}$/.test(year)|| !/^[1-6]$/.test(grade)|| !/^[0-9]{1,3}$/.test(room))return NextResponse.json({error:"ปีการศึกษา ชั้น หรือห้องไม่ถูกต้อง"},{status:400});
    const id=year+"_"+grade+"_"+room;
    const ref=getAdminDb().collection("classrooms").doc(id);
    if((await ref.get()).exists)return NextResponse.json({error:"ห้องเรียนนี้มีอยู่แล้ว"},{status:409});
    await ref.set({academicYear:year,grade,room,name:String(body.name||"ม."+grade+"/"+room).slice(0,100),active:true});
    return NextResponse.json({ok:true,id});
  }catch(e){const x=staffError(e);return NextResponse.json({error:x.message},{status:x.status});}
}
export async function PATCH(request) {
  try {
    if (!verifyRequestOrigin(request)) return NextResponse.json({error:"Invalid request"},{status:403});
    await requireStaff(request,["admin"]);
    const body=await request.json(),id=String(body.id||"");
    if(!/^[0-9]{4}_[1-6]_[0-9]{1,3}$/.test(id))return NextResponse.json({error:"ห้องเรียนไม่ถูกต้อง"},{status:400});
    const ref=getAdminDb().collection("classrooms").doc(id);
    if(!(await ref.get()).exists)return NextResponse.json({error:"ไม่พบห้องเรียน"},{status:404});
    const patch={};
    if(body.name!==undefined)patch.name=String(body.name||"").trim().slice(0,100);
    if(body.active!==undefined)patch.active=Boolean(body.active);
    await ref.set(patch,{merge:true});
    return NextResponse.json({ok:true});
  }catch(e){const x=staffError(e);return NextResponse.json({error:x.message},{status:x.status});}
}
