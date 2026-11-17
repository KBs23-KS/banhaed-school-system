import { NextResponse } from "next/server";
import { requireStaff, staffError } from "@/lib/staffAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
export async function GET(request) {
  try {
    await requireStaff(request,["hr","admin"]);
    const {searchParams}=new URL(request.url);
    const ownerId=searchParams.get("ownerId");
    if (!ownerId || !/^[0-9a-zA-Z_-]{1,128}$/.test(ownerId)) return NextResponse.json({error:"ข้อมูลไม่ถูกต้อง"},{status:400});
    const snap=await getAdminDb().collection("documents").where("ownerType","==","personnel").where("ownerId","==",ownerId).get();
    const documents=snap.docs.map(d=>({id:d.id,name:d.data().name,mimeType:d.data().mimeType,kind:d.data().kind,createdAt:d.data().createdAt})).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
    return NextResponse.json({documents});
  } catch(e) {const x=staffError(e);return NextResponse.json({error:x.message},{status:x.status});}
}
