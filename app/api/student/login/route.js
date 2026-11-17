import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { COOKIE_NAME, createStudentSession, normalizeDobPassword, normalizeStudentId, verifyDobPassword } from "@/lib/studentAuth";
import { checkLoginLimit, clearLoginFailures, markLoginFailure, verifyRequestOrigin } from "@/lib/studentSecurity";

export async function POST(request) {
  try {
    if (!verifyRequestOrigin(request)) return NextResponse.json({ error: "Invalid request" }, { status: 403 });
    const b = await request.json();
    const studentId = normalizeStudentId(b.studentId);
    const password = String(b.password ?? b.dob ?? "");
    if (password.length < 1 || password.length > 128) return NextResponse.json({error:"รหัสนักเรียนหรือรหัสผ่านไม่ถูกต้อง"},{status:401});
    if (!/^[0-9A-Za-z-]{1,32}$/.test(studentId)) return NextResponse.json({ error: "เข้าสู่ระบบไม่สำเร็จ" }, { status: 401 });
    await checkLoginLimit(studentId, "login");
    const snap = await getAdminDb().collection("students").doc(studentId).get();
    const s = snap.data();
    const stored = s?.auth;
    const input = stored?.passwordVersion === "custom" ? password : normalizeDobPassword(password);
    if (!snap.exists || s.status !== "active" || !stored?.activated || !verifyDobPassword(input, stored.passwordSalt, stored.passwordHash)) {
      await markLoginFailure(studentId, "login");
      return NextResponse.json({ error: "รหัสนักเรียนหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
    }
    await clearLoginFailures(studentId, "login");
    const response = NextResponse.json({ ok: true, legacyPassword: stored.passwordVersion !== "custom" });
    response.cookies.set(COOKIE_NAME, createStudentSession(studentId, Number(stored.sessionVersion || 0)), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 604800 });
    return response;
  } catch (error) {
    if (error.message === "RATE_LIMITED") return NextResponse.json({ error: "ลองใหม่อีกครั้งใน 15 นาที" }, { status: 429 });
    return NextResponse.json({ error: "เข้าสู่ระบบไม่สำเร็จ" }, { status: 500 });
  }
}
