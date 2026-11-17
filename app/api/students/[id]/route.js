import { NextResponse } from "next/server";
import { requireStaff, staffError, canEditStudent, hasRole } from "@/lib/staffAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { sanitizeStaffStudentPatch, mergeStudentProfile } from "@/lib/studentProfile.mjs";
import { calculateStudentCompletion } from "@/lib/system";
import { verifyRequestOrigin } from "@/lib/studentSecurity";

export async function GET(request, { params }) {
  try {
    const user = await requireStaff(request, ["teacher", "hr", "admin"]);
    const { id } = await params;
    const snap = await getAdminDb().collection("students").doc(id).get();
    if (!snap.exists) return NextResponse.json({ error: "ไม่พบข้อมูลนักเรียน" }, { status: 404 });
    const data = snap.data();
    const permitted = canEditStudent(user, data);
    const { auth, ...safe } = data;
    if (!permitted) {
      const { prefix, firstName, lastName, nickname, currentEnrollment, photoDocumentId, profileStatus, profileCompletion } = safe;
      return NextResponse.json({ student: { studentId: id, prefix, firstName, lastName, nickname, currentEnrollment, photoDocumentId, profileStatus, profileCompletion }, canEdit: false, limited: true });
    }
    return NextResponse.json({ student: { studentId: id, ...safe }, canEdit: permitted });
  } catch (e) { const x = staffError(e); return NextResponse.json({ error: x.message }, { status: x.status }); }
}
export async function PATCH(request, { params }) {
  try {
    if (!verifyRequestOrigin(request)) return NextResponse.json({ error: "Invalid request" }, { status: 403 });
    const user = await requireStaff(request, ["teacher", "admin"]);
    const { id } = await params;
    const db = getAdminDb(), ref = db.collection("students").doc(id), snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "ไม่พบข้อมูลนักเรียน" }, { status: 404 });
    if (!canEditStudent(user, snap.data())) return NextResponse.json({ error: "แก้ไขได้เฉพาะนักเรียนในห้องที่รับผิดชอบ" }, { status: 403 });
    const body = sanitizeStaffStudentPatch(await request.json(), hasRole(user, "admin"));
    const old = snap.data();
    const merged = mergeStudentProfile(old, body);
    const completion = calculateStudentCompletion(merged);
    await ref.set({ ...body, profileCompletion: completion, profileStatus: completion === 100 ? "complete" : "incomplete", updatedAt: new Date().toISOString(), updatedBy: user.uid }, { merge: true });
    await db.collection("auditLogs").add({ actorUid: user.uid, action: "update_student", targetId: id, createdAt: new Date().toISOString() });
    return NextResponse.json({ ok: true, profileCompletion: completion });
  } catch (e) {
    if (["INVALID_PROFILE","INVALID_CITIZEN_ID","INVALID_BIRTH_DATE","INVALID_ENROLLMENT"].includes(e.message)) return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    const x = staffError(e); return NextResponse.json({ error: x.message }, { status: x.status });
  }
}
