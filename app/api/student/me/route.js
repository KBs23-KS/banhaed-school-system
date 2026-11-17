import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/studentSession";

export async function GET() {
  try {
    const session = await getStudentSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const { auth, ...data } = session.data;
    return NextResponse.json({ student: { studentId: session.studentId, ...data, mustChangeLegacyPassword: auth.passwordVersion !== "custom" } }, {headers:{"Cache-Control":"private, no-store"}});
  } catch { return NextResponse.json({ error: "unauthorized" }, { status: 401 }); }
}
