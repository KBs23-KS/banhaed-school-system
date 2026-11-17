import { NextResponse } from "next/server";
import { requireStaff, staffError } from "@/lib/staffAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { hashDobPassword } from "@/lib/studentAuth";
import { makeActivationCode, verifyRequestOrigin } from "@/lib/studentSecurity";

// One-time plaintext codes are returned only in this authenticated response.
export async function POST(request) {
  try {
    if (!verifyRequestOrigin(request)) return NextResponse.json({ error: "Invalid request" }, { status: 403 });
    const admin = await requireStaff(request, ["admin"]);
    const body = await request.json();
    const ids = Array.isArray(body.studentIds) ? body.studentIds : [body.studentId];
    const studentIds = [...new Set(ids.map(id => String(id || "").trim()))];
    if (!studentIds.length || studentIds.length > 100 || studentIds.some(id => !/^[0-9A-Za-z-]{1,32}$/.test(id))) return NextResponse.json({ error: "กรุณาระบุรหัสนักเรียนไม่เกิน 100 คนต่อครั้ง" }, { status: 400 });
    const db = getAdminDb();
    const results = [];
    for (const studentId of studentIds) {
      const ref = db.collection("students").doc(studentId);
      const snap = await ref.get();
      if (!snap.exists || snap.data().status !== "active" || snap.data().auth?.activated) {
        results.push({ studentId, error: "ไม่พบนักเรียนหรือเปิดใช้งานแล้ว" });
        continue;
      }
      const code = makeActivationCode();
      const hashed = hashDobPassword(code);
      const expiresAt = Date.now() + 7 * 86400000;
      try {
        await db.runTransaction(async tx => {
          const latest = await tx.get(ref);
          if (!latest.exists || latest.data().status !== "active" || latest.data().auth?.activated) throw new Error("NOT_ELIGIBLE");
          tx.update(ref, { "auth.activation": { salt: hashed.salt, hash: hashed.hash, expiresAt } });
        });
      } catch (error) {
        if (error.message === "NOT_ELIGIBLE") { results.push({ studentId, error: "ไม่พบนักเรียนหรือเปิดใช้งานแล้ว" }); continue; }
        throw error;
      }
      results.push({ studentId, code, expiresAt });
    }
    await db.collection("auditLogs").add({ actorUid: admin.uid, action: "issue_student_activation_codes", count: results.filter(x => x.code).length, createdAt: new Date().toISOString() });
    return NextResponse.json({ results });
  } catch (error) {
    const result = staffError(error);
    return NextResponse.json({ error: result.message }, { status: result.status });
  }
}
