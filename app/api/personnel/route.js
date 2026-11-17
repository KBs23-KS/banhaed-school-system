import { NextResponse } from "next/server";
import { requireStaff, staffError, hasRole } from "@/lib/staffAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { verifyRequestOrigin } from "@/lib/studentSecurity";

function publicPersonnel(id, data) {
  const { prefix, firstName, lastName, position, academicRank, subjectGroup, department, managementGroup, photoDocumentId, status } = data;
  return { id, prefix, firstName, lastName, position, academicRank, subjectGroup, department, managementGroup, photoDocumentId, status };
}
export async function GET(request) {
  try {
    const actor = await requireStaff(request, ["teacher", "hr", "admin"]);
    const q = (new URL(request.url).searchParams.get("q") || "").toLowerCase();
    const snap = await getAdminDb().collection("personnel").get();
    let rows = snap.docs.map(d => hasRole(actor, "hr") || hasRole(actor, "admin") ? { id: d.id, ...d.data() } : publicPersonnel(d.id, d.data()));
    if (q) rows = rows.filter(x => [x.firstName, x.lastName, x.position, x.managementGroup].some(v => String(v || "").toLowerCase().includes(q)));
    return NextResponse.json({ personnel: rows });
  } catch (e) { const x = staffError(e); return NextResponse.json({ error: x.message }, { status: x.status }); }
}
export async function POST(request) {
  try {
    if (!verifyRequestOrigin(request)) return NextResponse.json({ error: "Invalid request" }, { status: 403 });
    const user = await requireStaff(request, ["hr", "admin"]);
    const body = await request.json();
    const allowed = ["prefix","firstName","lastName","position","academicRank","subjectGroup","managementGroup","personnelType","phone","email","status"];
    const data = {};
    for (const key of allowed) if (typeof body[key] === "string") data[key] = body[key].trim().slice(0,200);
    if (!data.firstName || !data.lastName) return NextResponse.json({ error: "กรุณากรอกชื่อและนามสกุล" }, { status: 400 });
    const db = getAdminDb(), ref = db.collection("personnel").doc();
    await ref.set({ ...data, status: data.status || "active", createdAt: new Date().toISOString(), createdBy: user.uid });
    return NextResponse.json({ ok: true, id: ref.id });
  } catch (e) { const x = staffError(e); return NextResponse.json({ error: x.message }, { status: x.status }); }
}
