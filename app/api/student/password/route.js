import { NextResponse } from "next/server";
import { getStudentSession } from "@/lib/studentSession";
import { COOKIE_NAME, createStudentSession, hashDobPassword, normalizeDobPassword, verifyDobPassword } from "@/lib/studentAuth";
import { checkLoginLimit, clearLoginFailures, markLoginFailure, isStrongStudentPassword, verifyRequestOrigin } from "@/lib/studentSecurity";

export async function POST(request) {
  try {
    if (!verifyRequestOrigin(request)) return NextResponse.json({ error: "Invalid request" }, { status: 403 });
    const session = await getStudentSession();
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    await checkLoginLimit(session.studentId, "changePassword");
    const { currentPassword, newPassword } = await request.json();
    if (!isStrongStudentPassword(newPassword)) return NextResponse.json({ error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 10 ตัวอักษร มีตัวอักษรและตัวเลข" }, { status: 400 });
    const auth = session.data.auth;
    const current = auth.passwordVersion === "custom" ? String(currentPassword || "") : normalizeDobPassword(currentPassword);
    if (!verifyDobPassword(current, auth.passwordSalt, auth.passwordHash)) { await markLoginFailure(session.studentId, "changePassword"); return NextResponse.json({ error: "รหัสผ่านเดิมไม่ถูกต้อง" }, { status: 401 }); }
    await clearLoginFailures(session.studentId, "changePassword");
    const changed = hashDobPassword(newPassword);
    const version = Number(auth.sessionVersion || 0) + 1;
    await session.ref.update({ "auth.passwordHash": changed.hash, "auth.passwordSalt": changed.salt, "auth.passwordVersion": "custom", "auth.sessionVersion": version, updatedAt: new Date().toISOString() });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(COOKIE_NAME, createStudentSession(session.studentId, version), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 604800 });
    return response;
  } catch (error) { if (error.message === "RATE_LIMITED") return NextResponse.json({error:"ลองใหม่อีกครั้งใน 15 นาที"},{status:429}); return NextResponse.json({ error: "เปลี่ยนรหัสผ่านไม่สำเร็จ" }, { status: 500 }); }
}
