import { NextResponse } from "next/server";
import { requireStaff, staffError } from "@/lib/staffAuth";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { verifyRequestOrigin } from "@/lib/studentSecurity";

const ROLES=["teacher","hr","admin"];
function validatedRoles(roles) {
  if (!Array.isArray(roles) || !roles.length || roles.some(r=>!ROLES.includes(r))) throw new Error("INVALID");
  return [...new Set(roles)];
}
function validatedRooms(homerooms) {
  if (!Array.isArray(homerooms) || homerooms.length>100) throw new Error("INVALID");
  return homerooms.map(x=>{
    const academicYear=String(x.academicYear || ""),grade=String(x.grade || ""),room=String(x.room || "");
    if (!/^[0-9]{4}$/.test(academicYear) || !/^[1-6]$/.test(grade) || !/^[0-9]{1,3}$/.test(room)) throw new Error("INVALID");
    return {academicYear,grade,room};
  });
}
export async function GET(request) {
  try {await requireStaff(request,["admin"]);const snap=await getAdminDb().collection("users").get();return NextResponse.json({users:snap.docs.map(d=>{const x=d.data();return {uid:d.id,username:x.username,email:x.email,displayName:x.displayName,roles:x.roles||[],homerooms:x.homerooms||[],status:x.status||"active",createdAt:x.createdAt};})});}
  catch(e){const x=staffError(e);return NextResponse.json({error:x.message},{status:x.status});}
}
export async function POST(request) {
  try {
    if (!verifyRequestOrigin(request)) return NextResponse.json({error:"Invalid request"},{status:403});
    const admin=await requireStaff(request,["admin"]),body=await request.json();
    const username=String(body.username||"").trim().toLowerCase();
    if (!/^[a-z0-9_-]{3,32}$/.test(username) || typeof body.password!=="string" || body.password.length<10) return NextResponse.json({error:"Username ต้องมี 3–32 ตัวอักษร และรหัสผ่านอย่างน้อย 10 ตัว"},{status:400});
    const roles=validatedRoles(body.roles||["teacher"]),homerooms=validatedRooms(body.homerooms||[]);
    const email=username+"@banhaed.local",auth=getAdminAuth();
    let user;
    try {user=await auth.createUser({email,password:body.password,displayName:String(body.displayName||username).slice(0,100)});}
    catch(e){if(e.code==="auth/email-already-exists")return NextResponse.json({error:"มี Username นี้อยู่แล้ว"},{status:409});throw e;}
    try {await getAdminDb().collection("users").doc(user.uid).set({username,email,displayName:String(body.displayName||username).slice(0,100),roles,homerooms,status:"active",createdAt:new Date().toISOString(),createdBy:admin.uid});}
    catch(error){await auth.deleteUser(user.uid).catch(()=>{});throw error;}
    await getAdminDb().collection("auditLogs").add({actorUid:admin.uid,action:"create_staff_account",targetId:user.uid,createdAt:new Date().toISOString()}).catch(()=>{});
    return NextResponse.json({ok:true,uid:user.uid});
  }catch(e){if(e.message==="INVALID")return NextResponse.json({error:"สิทธิ์หรือห้องเรียนไม่ถูกต้อง"},{status:400});const x=staffError(e);return NextResponse.json({error:x.message},{status:x.status});}
}
export async function PATCH(request) {
  try {
    if (!verifyRequestOrigin(request)) return NextResponse.json({error:"Invalid request"},{status:403});
    const admin=await requireStaff(request,["admin"]),body=await request.json();
    const uid=String(body.uid||""),db=getAdminDb(),ref=db.collection("users").doc(uid),snap=await ref.get();
    if(!snap.exists)return NextResponse.json({error:"ไม่พบบัญชี"},{status:404});
    const old=snap.data(),patch={};
    if (body.roles!==undefined) patch.roles=validatedRoles(body.roles);
    if (body.homerooms!==undefined) patch.homerooms=validatedRooms(body.homerooms);
    if (body.displayName!==undefined) patch.displayName=String(body.displayName||"").trim().slice(0,100);
    if (body.status!==undefined) {if (!["active","inactive"].includes(body.status)) throw new Error("INVALID");patch.status=body.status;}
    if(uid===admin.uid && (patch.status==="inactive" || patch.roles && !patch.roles.includes("admin")))return NextResponse.json({error:"ไม่สามารถถอนสิทธิ์ Admin ของตัวเองได้"},{status:400});
    if((old.roles||[]).includes("admin") && (patch.roles && !patch.roles.includes("admin") || patch.status==="inactive")){
      const admins=await db.collection("users").where("roles","array-contains","admin").get();
      if(admins.docs.filter(d=>d.id!==uid && d.data().status!=="inactive").length===0)return NextResponse.json({error:"ต้องมี Admin ใช้งานอย่างน้อย 1 คน"},{status:409});
    }
    if(old.username==="admin" && patch.status==="inactive")return NextResponse.json({error:"ปิดบัญชี Admin หลักไม่ได้"},{status:400});
    if(body.password!==undefined){
      if(old.username==="admin")return NextResponse.json({error:"เปลี่ยนรหัส Admin หลักผ่าน Firebase Authentication Console"},{status:400});
      if(typeof body.password!=="string" || body.password.length<10)return NextResponse.json({error:"รหัสผ่านอย่างน้อย 10 ตัวอักษร"},{status:400});
      await getAdminAuth().updateUser(uid,{password:body.password});
    }
    if(patch.status!==undefined && old.username!=="admin") await getAdminAuth().updateUser(uid,{disabled:patch.status==="inactive"});
    if(patch.displayName!==undefined)await getAdminAuth().updateUser(uid,{displayName:patch.displayName});
    await ref.set({...patch,updatedAt:new Date().toISOString(),updatedBy:admin.uid},{merge:true});
    await db.collection("auditLogs").add({actorUid:admin.uid,action:"update_staff_account",targetId:uid,createdAt:new Date().toISOString()});
    return NextResponse.json({ok:true});
  }catch(e){if(e.message==="INVALID")return NextResponse.json({error:"ข้อมูลไม่ถูกต้อง"},{status:400});const x=staffError(e);return NextResponse.json({error:x.message},{status:x.status});}
}
