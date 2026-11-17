import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { COOKIE_NAME, createStudentSession, hashDobPassword, normalizeStudentId, verifyDobPassword } from "@/lib/studentAuth";
import { checkLoginLimit, clearLoginFailures, isStrongStudentPassword, markLoginFailure, verifyRequestOrigin } from "@/lib/studentSecurity";

export async function POST(request) {
  try {
    if (!verifyRequestOrigin(request)) return NextResponse.json({ error: "Invalid request" }, { status: 403 });
    const body = await request.json();
    const studentId = normalizeStudentId(body.studentId);
    const code = String(body.activationCode || "").trim().toUpperCase();
    const password = String(body.password || "");
    if (!/^[0-9A-Za-z-]{1,32}$/.test(studentId) || !isStrongStudentPassword(password)) return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 10 ตัวอักษร มีตัวอักษรและตัวเลข" }, { status: 400 });
    await checkLoginLimit(studentId, "activate");
    const db = getAdminDb();
    const ref = db.collection("students").doc(studentId);
    const snap = await ref.get();
    const old = snap.data();
    if (!snap.exists || old.status !== "active" || old.auth?.activated) return NextResponse.json({ error: "ไม่สามารถเปิดใช้งานบัญชีนี้" }, { status: 409 });
    const codeInfo = old.auth?.activation || {};
    const valid = code && codeInfo.hash && Number(codeInfo.expiresAt || 0) > Date.now() && verifyDobPassword(code, codeInfo.salt, codeInfo.hash);
    if (!valid) {
      await markLoginFailure(studentId, "activate");
      return NextResponse.json({ error: "รหัสเปิดใช้งานไม่ถูกต้องหรือหมดอายุ" }, { status: 401 });
    }
    const hashed = hashDobPassword(password);
    const version = Number(old.auth?.sessionVersion || 0) + 1;
    await db.runTransaction(async tx => {
      const current = await tx.get(ref);
      if (!current.exists || current.data().auth?.activated || current.data().auth?.activation?.hash !== codeInfo.hash) throw new Error("ALREADY_ACTIVATED");
      tx.update(ref, { "auth.activated": true, "auth.passwordHash": hashed.hash, "auth.passwordSalt": hashed.salt, "auth.passwordVersion": "custom", "auth.sessionVersion": version, "auth.activatedAt": new Date().toISOString(), "auth.activation": FieldValue.delete(), profileStatus: "incomplete", updatedAt: new Date().toISOString() });
    });
    await clearLoginFailures(studentId, "activate");
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, createStudentSession(studentId, version), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 604800 });
    return res;
  } catch (error) {
    if (error.message === "RATE_LIMITED") return NextResponse.json({ error: "ลองใหม่อีกครั้งใน 15 นาที" }, { status: 429 });
    if (error.message === "ALREADY_ACTIVATED") return NextResponse.json({ error: "บัญชีนี้เปิดใช้งานแล้ว" }, { status: 409 });
    return NextResponse.json({ error: "ไม่สามารถเปิดใช้งานบัญชีได้" }, { status: 500 });
  }
}
