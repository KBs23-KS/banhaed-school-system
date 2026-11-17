import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { normalizeStudentId } from "@/lib/studentAuth";
import { checkLoginLimit, verifyRequestOrigin } from "@/lib/studentSecurity";

export async function POST(request) {
  try {
    if (!verifyRequestOrigin(request)) return NextResponse.json({ error: "Invalid request" }, { status: 403 });
    const { studentId: raw } = await request.json();
    const studentId = normalizeStudentId(raw);
    if (!/^[0-9A-Za-z-]{1,32}$/.test(studentId)) return NextResponse.json({ error: "รหัสนักเรียนไม่ถูกต้อง" }, { status: 400 });
    await checkLoginLimit(studentId, "login");
    const snap = await getAdminDb().collection("students").doc(studentId).get();
    if (!snap.exists || snap.data().status !== "active") return NextResponse.json({ error: "ไม่พบรหัสนักเรียนที่ใช้งานได้" }, { status: 404 });
    return NextResponse.json({ student: { studentId, activated: Boolean(snap.data().auth?.activated) } });
  } catch (error) {
    if (error.message === "RATE_LIMITED") return NextResponse.json({ error: "ลองใหม่อีกครั้งใน 15 นาที" }, { status: 429 });
    return NextResponse.json({ error: "ตรวจสอบข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
}
