import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireStaff, hasRole } from "@/lib/staffAuth";
import { getStudentSession } from "@/lib/studentSession";
import { downloadBuffer, driveReady } from "@/lib/drive";

export async function GET(request,{params}) {
  try {
    if (!driveReady()) return new Response("Drive not configured",{status:503});
    const {docId}=await params;
    const db=getAdminDb(),snap=await db.collection("documents").doc(docId).get();
    if (!snap.exists) return new Response("Not found",{status:404});
    const doc=snap.data();
    let allowed=false;
    if (request.headers.get("authorization")?.startsWith("Bearer ")) {
      let user=null;
      try {user=await requireStaff(request,["teacher","hr","admin"]);}catch{}
      if (user) {
        if (doc.ownerType==="personnel" && doc.kind==="personnel_photo") allowed=true;
        if (doc.ownerType==="student" && doc.kind==="student_photo") allowed=true;
        if (hasRole(user,"hr") || hasRole(user,"admin")) allowed=true;
      }
    }
    if (!allowed) {
      const student=await getStudentSession();
      allowed=Boolean(student && doc.ownerType==="student" && doc.ownerId===student.studentId && doc.kind==="student_photo");
    }
    if (!allowed) return new Response("Forbidden",{status:403});
    const file=await downloadBuffer(doc.driveFileId);
    const isPhoto=doc.kind==="student_photo" || doc.kind==="personnel_photo";
    const mime=String(file.mimeType||doc.mimeType||"application/octet-stream");
    const inline=isPhoto && ["image/jpeg","image/png","image/webp"].includes(mime);
    return new Response(file.buffer,{status:200,headers:{
      "Content-Type":mime,"Content-Disposition":inline?"inline":"attachment; filename=document",
      "Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff",
      "X-Frame-Options":"DENY"
    }});
  } catch { return new Response("Error",{status:500}); }
}
