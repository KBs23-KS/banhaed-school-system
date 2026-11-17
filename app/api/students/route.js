import { NextResponse } from "next/server";
import { requireStaff, staffError } from "@/lib/staffAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { getSystemSettings, normalizeEnrollment } from "@/lib/system";
import { verifyRequestOrigin } from "@/lib/studentSecurity";

function directoryStudent(id, data) {
  const { prefix, firstName, lastName, nickname, currentEnrollment, profileCompletion, profileStatus, photoDocumentId, status } = data;
  return { studentId: id, prefix, firstName, lastName, nickname, currentEnrollment, profileCompletion, profileStatus, photoDocumentId, status };
}

export async function GET(request) {
  try {
    await requireStaff(request, ["teacher", "hr", "admin"]);
    const url = new URL(request.url);
    const { searchParams: params } = url;
    const grade = params.get("grade"), room = params.get("room"), status = params.get("status");
    const q = (params.get("q") || "").trim().toLowerCase();
    const requestedPage = Number(params.get("page") || 1);
    const page = Number.isInteger(requestedPage) ? Math.min(1000, Math.max(1, requestedPage)) : 1;
    const size = 100;
    const snap = await getAdminDb().collection("students").get();
    let rows = snap.docs.map(d => directoryStudent(d.id, d.data()));
    if (grade) rows = rows.filter(s => String(s.currentEnrollment?.grade || "") === grade);
    if (room) rows = rows.filter(s => String(s.currentEnrollment?.room || "") === room);
    if (status) rows = rows.filter(s => (s.profileStatus || "not_started") === status);
    if (q) rows = rows.filter(s => [s.studentId, s.firstName, s.lastName, s.nickname, (s.firstName || "") + " " + (s.lastName || "")].some(v => String(v || "").toLowerCase().includes(q)));
    rows.sort((a, b) => String(a.studentId).localeCompare(String(b.studentId)));
    return NextResponse.json({ students: rows.slice((page - 1) * size, page * size), total: rows.length, page, pageSize: size, pages: Math.max(1, Math.ceil(rows.length / size)) });
  } catch (e) { const x = staffError(e); return NextResponse.json({ error: x.message }, { status: x.status }); }
}

export async function POST(request) {
  try {
    if (!verifyRequestOrigin(request)) return NextResponse.json({ error: "Invalid request" }, { status: 403 });
    const admin = await requireStaff(request, ["admin"]);
    const body = await request.json();
    const studentId = String(body.studentId || "").trim();
    const firstName = String(body.firstName || "").trim().slice(0,100);
    const lastName = String(body.lastName || "").trim().slice(0,100);
    if (!/^[0-9A-Za-z-]{1,32}$/.test(studentId) || !firstName || !lastName)
      return NextResponse.json({ error: "รหัส ชื่อ หรือนามสกุลไม่ถูกต้อง" }, { status: 400 });
    const settings = await getSystemSettings();
    if (settings.rolloverLock) return NextResponse.json({ error: "กำลังเปลี่ยนปีการศึกษา กรุณาลองใหม่ภายหลัง" }, { status: 409 });
    const enrollment = normalizeEnrollment(body, settings.currentAcademicYear);
    if (!/^[1-6]$/.test(enrollment.grade) || !/^[0-9]{1,3}$/.test(enrollment.room) ||
        enrollment.academicYear !== String(settings.currentAcademicYear) ||
        (enrollment.number !== null && (!Number.isInteger(enrollment.number) || enrollment.number < 0 || enrollment.number > 1000)))
      return NextResponse.json({ error: "ชั้น ห้อง เลขที่ หรือปีการศึกษาไม่ถูกต้อง" }, { status: 400 });

    const db = getAdminDb(), ref = db.collection("students").doc(studentId);
    const enrollRef = db.collection("studentEnrollments").doc(enrollment.academicYear + "_" + studentId);
    await db.runTransaction(async tx => {
      const [systemSnap, existing, enrollmentSnap] = await Promise.all([
        tx.get(db.collection("settings").doc("system")), tx.get(ref), tx.get(enrollRef)
      ]);
      if (systemSnap.data()?.rolloverLock ||
          String(systemSnap.data()?.currentAcademicYear || settings.currentAcademicYear) !== enrollment.academicYear)
        throw new Error("ACADEMIC_YEAR_CHANGED");
      if (existing.exists || enrollmentSnap.exists) throw new Error("STUDENT_ALREADY_EXISTS");
      const now = new Date().toISOString();
      tx.create(ref, {
        prefix: String(body.prefix || "").trim().slice(0,30),
        firstName, lastName, status: "active", currentEnrollment: enrollment,
        profileStatus: "not_started", profileCompletion: 0,
        createdAt: now, createdBy: admin.uid
      });
      tx.create(enrollRef, { studentId, ...enrollment, createdAt: now });
    });
    await db.collection("auditLogs").add({actorUid: admin.uid, action:"create_student", targetId:studentId, createdAt:new Date().toISOString()}).catch(()=>{});
    return NextResponse.json({ok:true,studentId});
  } catch (e) {
    if (e.message === "ACADEMIC_YEAR_CHANGED") return NextResponse.json({ error: "ปีการศึกษามีการเปลี่ยนแปลง" }, { status: 409 });
    if (e.message === "STUDENT_ALREADY_EXISTS") return NextResponse.json({ error: "มีรหัสนักเรียนหรือทะเบียนปีนี้อยู่แล้ว" }, { status: 409 });
    const x = staffError(e);
    return NextResponse.json({error:x.message}, {status:x.status});
  }
}
