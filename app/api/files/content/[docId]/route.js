import { cookies } from "next/headers";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireStaff } from "@/lib/staffAuth";
import { COOKIE_NAME, readStudentSession } from "@/lib/studentAuth";
import { downloadBuffer, driveReady } from "@/lib/drive";

export async function GET(request,{params}){
  try{
    if(!driveReady()) return new Response("Drive not configured",{status:503});
    const {docId}=await params; const db=getAdminDb(); const snap=await db.collection("documents").doc(docId).get();
    if(!snap.exists) return new Response("Not found",{status:404});
    const doc=snap.data(); let staff=null,student=null;
    const auth=request.headers.get("authorization")||"";
    if(auth.startsWith("Bearer ")){ try{staff=await requireStaff(request,["teacher","hr","admin"])}catch{} }
    if(!staff){ const c=await cookies(); student=readStudentSession(c.get(COOKIE_NAME)?.value); }
    const isPhoto=String(doc.kind||"").includes("photo");
    const staffAllowed=staff && (isPhoto || staff.roles?.includes("hr") || staff.roles?.includes("admin"));
    const studentAllowed=student && doc.ownerType==="student" && doc.ownerId===student.studentId;
    if(!staffAllowed&&!studentAllowed)return new Response("Forbidden",{status:403});
    const f=await downloadBuffer(doc.driveFileId);
    return new Response(f.buffer,{status:200,headers:{"Content-Type":f.mimeType||doc.mimeType||"application/octet-stream","Cache-Control":"private, max-age=300"}});
  }catch(e){console.error(e);return new Response("Error",{status:500});}
}
