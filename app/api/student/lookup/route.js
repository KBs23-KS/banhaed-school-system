import { NextResponse } from "next/server";
import { normalizeStudentId } from "@/lib/studentAuth";
import { verifyRequestOrigin } from "@/lib/studentSecurity";

// Compatibility endpoint: return identical responses for existing and unknown student IDs.
// Account lookup must not disclose whether a student exists or has activated a login.
export async function POST(request) {
  try {
    if(!verifyRequestOrigin(request))return NextResponse.json({error:"Invalid request"},{status:403});
    const body=await request.json(),studentId=normalizeStudentId(body.studentId);
    if(!/^[0-9A-Za-z-]{1,32}$/.test(studentId))
      return NextResponse.json({error:"รหัสนักเรียนไม่ถูกต้อง"},{status:400});
    return NextResponse.json({ok:true,next:["login","activate"]},{headers:{"Cache-Control":"no-store"}});
  } catch {
    return NextResponse.json({error:"รูปแบบคำขอไม่ถูกต้อง"},{status:400});
  }
}
