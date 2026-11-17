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
    if (!/^[0-9A-Za-z-]{1,32}$/.test(studentId)) return NextResponse.json({ error: "รหัสนักเรียนไม่ถูกต้อง" }, { status: 400 });
    const settings = await getSystemSettings();
    const enrollment = normalizeEnrollment(body, settings.currentAcademicYear);
    if (!/^[1-6]$/.test(enrollment.grade) || !enrollment.room) return NextResponse.json({ error: "ชั้นหรือห้องไม่ถูกต้อง" }, { status: 400 });
    const db = getAdminDb(), ref = db.collection("students").doc(studentId);
    if ((await ref.get()).exists) return NextResponse.json({ error: "มีรหัสนักเรียนนี้แล้ว กรุณาใช้การแก้ไขข้อมูล" }, { status: 409 });
    await ref.set({ prefix: String(body.prefix || "").slice(0,30), firstName: String(body.firstName || "").slice(0,100), lastName: String(body.lastName || "").slice(0,100), status: "active", currentEnrollment: enrollment, profileStatus: "not_started", profileCompletion: 0, createdAt: new Date().toISOString(), createdBy: admin.uid });
    await db.collection("studentEnrollments").doc(enrollment.academicYear + "_" + studentId).set({ studentId, ...enrollment });
    return NextResponse.json({ ok: true });
  } catch (e) { const x = staffError(e); return NextResponse.json({ error: x.message }, { status: x.status }); }
}
