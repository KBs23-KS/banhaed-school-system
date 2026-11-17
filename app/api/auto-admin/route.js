import crypto from "crypto";
import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { checkLoginLimit, markLoginFailure, clearLoginFailures, verifyRequestOrigin } from "@/lib/studentSecurity";

const respond=(message,status)=>NextResponse.json({error:message},{status});

// This endpoint must never reset passwords, reassign roles or repair existing Admins on login.
// Existing accounts authenticate directly via Firebase Authentication on the client.
export async function POST(request){
  try{
    if(!verifyRequestOrigin(request))return respond("Invalid request",403);
    if(process.env.ENABLE_AUTO_ADMIN_BOOTSTRAP!=="true")return respond("การสร้าง Admin อัตโนมัติถูกปิด กรุณาใช้การตั้งค่าครั้งแรกตามคู่มือ",410);
    const expected=process.env.ADMIN_PASSWORD;
    if(typeof expected!=="string" || expected.length<12)return respond("ยังไม่ได้ตั้ง ADMIN_PASSWORD ให้ปลอดภัย",503);
    const body=await request.json();
    if(String(body.username||"").split("@")[0].toLowerCase()!=="admin")return respond("ชื่อผู้ใช้ไม่ถูกต้อง",400);
    await checkLoginLimit("admin","autoAdmin");
    const pwd=String(body.password||"");
    const actual=crypto.createHash("sha256").update(pwd).digest();
    const expectedHash=crypto.createHash("sha256").update(expected).digest();
    if(!crypto.timingSafeEqual(actual,expectedHash)){
      await markLoginFailure("admin","autoAdmin");
      return respond("รหัสผ่านไม่ถูกต้อง",401);
    }
    const db=getAdminDb(),auth=getAdminAuth();
    const admins=await db.collection("users").where("roles","array-contains","admin").limit(1).get();
    if(!admins.empty)return respond("มีบัญชี Admin อยู่แล้ว ไม่อนุญาตให้สร้างหรือเปลี่ยนรหัสอัตโนมัติ",409);
    const email="admin@banhaed.local";
    try{await auth.getUserByEmail(email);return respond("มีบัญชี Firebase อยู่แล้ว กรุณาตรวจสอบบัญชีเดิม",409);}
    catch(e){if(e?.code!=="auth/user-not-found")throw e;}
    const user=await auth.createUser({email,password:expected,displayName:process.env.ADMIN_DISPLAY_NAME||"ผู้ดูแลระบบ"});
    try{
      await db.collection("users").doc(user.uid).set({username:"admin",email,displayName:process.env.ADMIN_DISPLAY_NAME||"ผู้ดูแลระบบ",roles:["teacher","hr","admin"],homerooms:[],status:"active",createdAt:new Date().toISOString()});
      await db.collection("auditLogs").add({actorUid:user.uid,action:"first_admin_bootstrap",createdAt:new Date().toISOString()});
    }catch(e){
      await auth.deleteUser(user.uid).catch(()=>{});
      throw e;
    }
    await clearLoginFailures("admin","autoAdmin");
    return NextResponse.json({ok:true,loginEmail:email});
  }catch(e){
    if(e?.message==="RATE_LIMITED")return respond("ลองใหม่อีกครั้งใน 15 นาที",429);
    return respond("ไม่สามารถดำเนินการได้",500);
  }
}
