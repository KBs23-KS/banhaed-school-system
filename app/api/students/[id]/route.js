import { NextResponse } from "next/server";
import { requireStaff, staffError, canEditStudent, hasRole } from "@/lib/staffAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { sanitizeStaffStudentPatch, mergeStudentProfile } from "@/lib/studentProfile.mjs";
import { calculateStudentCompletion, getSystemSettings } from "@/lib/system";
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
    if (!/^[0-9A-Za-z-]{1,32}$/.test(id)) return NextResponse.json({ error: "รหัสนักเรียนไม่ถูกต้อง" }, { status: 400 });
    const body = sanitizeStaffStudentPatch(await request.json(), hasRole(user, "admin"));
    if (!Object.keys(body).length) return NextResponse.json({ error: "ไม่มีข้อมูลที่ได้รับอนุญาตให้แก้ไข" }, { status: 400 });
    const db = getAdminDb(), ref = db.collection("students").doc(id);

    // A school year and classroom must change as a single logical update.
    const settings = body.currentEnrollment ? await getSystemSettings() : null;
    if (settings && (settings.rolloverLock || String(settings.currentAcademicYear) !== body.currentEnrollment.academicYear))
      return NextResponse.json({ error: "ห้ามแก้ห้องหรือปีการศึกษาขณะเลื่อนชั้น หรือข้ามปีการศึกษาปัจจุบัน" }, { status: 409 });

    if (body.citizenId) {
      const matches = await db.collection("students").where("citizenId", "==", body.citizenId).limit(2).get();
      if (matches.docs.some(d => d.id !== id))
        return NextResponse.json({ error: "เลขประจำตัวประชาชนนี้มีอยู่ในระบบแล้ว" }, { status: 409 });
    }

    const completion = await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("STUDENT_NOT_FOUND");
      if (!canEditStudent(user, snap.data())) throw new Error("STUDENT_FORBIDDEN");
      if (body.currentEnrollment) {
        const yearSnap = await tx.get(db.collection("settings").doc("system"));
        const currentYear = String(yearSnap.data()?.currentAcademicYear || settings.currentAcademicYear);
        if (yearSnap.data()?.rolloverLock || currentYear !== body.currentEnrollment.academicYear)
          throw new Error("ENROLLMENT_LOCKED");
      }
      const merged = mergeStudentProfile(snap.data(), body);
      const value = calculateStudentCompletion(merged);
      const now = new Date().toISOString();
      tx.set(ref, {
        ...body, profileCompletion: value,
        profileStatus: value === 100 ? "complete" : "incomplete",
        updatedAt: now, updatedBy: user.uid
      }, { merge: true });
      if (body.currentEnrollment) {
        const e = body.currentEnrollment;
        tx.set(db.collection("studentEnrollments").doc(e.academicYear + "_" + id),
          { studentId: id, ...e, updatedAt: now, updatedBy: user.uid },
          { merge: true });
      }
      return value;
    });
    await db.collection("auditLogs").add({
      actorUid: user.uid, action: "update_student", targetId: id,
      enrollmentChanged: Boolean(body.currentEnrollment),
      createdAt: new Date().toISOString()
    }).catch(() => {});
    return NextResponse.json({ ok: true, profileCompletion: completion });
  } catch (e) {
    if (["INVALID_PROFILE","INVALID_CITIZEN_ID","INVALID_BIRTH_DATE","INVALID_ENROLLMENT","INVALID_STATUS"].includes(e.message))
      return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    if (e.message === "STUDENT_NOT_FOUND") return NextResponse.json({ error: "ไม่พบข้อมูลนักเรียน" }, { status: 404 });
    if (e.message === "STUDENT_FORBIDDEN") return NextResponse.json({ error: "ไม่มีสิทธิ์แก้ข้อมูลนักเรียนรายนี้" }, { status: 403 });
    if (e.message === "ENROLLMENT_LOCKED") return NextResponse.json({ error: "ปีการศึกษากำลังเปลี่ยน กรุณาตรวจสอบก่อน" }, { status: 409 });
    const x = staffError(e);
    return NextResponse.json({ error: x.message }, { status: x.status });
  }
}
