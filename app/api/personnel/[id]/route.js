import { NextResponse } from "next/server";
import { requireStaff, staffError, hasRole } from "@/lib/staffAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { verifyRequestOrigin } from "@/lib/studentSecurity";

const textKeys = ["prefix","firstName","lastName","citizenId","birthDateBE","birthDate","gender","phone","email","currentAddress","personnelType","position","academicRank","positionNumber","subjectGroup","managementGroup","department","major","schoolStartDate","licenseStatus","retirementYear","status"];
const listKeys = ["education","licenses","positionHistory","decorations","training"];
function safePersonnelPatch(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("INVALID_BODY");
  const result = {};
  for (const key of textKeys) {
    if (!Object.prototype.hasOwnProperty.call(body, key)) continue;
    if (typeof body[key] !== "string" && typeof body[key] !== "number") throw new Error("INVALID_BODY");
    result[key] = String(body[key]).trim().slice(0,500);
  }
  if (result.citizenId && !/^[0-9]{13}$/.test(result.citizenId)) throw new Error("INVALID_BODY");
  for (const key of listKeys) {
    if (!Object.prototype.hasOwnProperty.call(body, key)) continue;
    if (!Array.isArray(body[key]) || body[key].length > 200) throw new Error("INVALID_BODY");
    result[key] = body[key].map(row => {
      if (!row || typeof row !== "object" || Array.isArray(row)) throw new Error("INVALID_BODY");
      const out = {};
      for (const [k, value] of Object.entries(row)) {
        if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(k) || typeof value !== "string" && typeof value !== "number") continue;
        out[k] = String(value).slice(0,500);
      }
      return out;
    });
  }
  return result;
}
export async function GET(request, { params }) {
  try {
    const user = await requireStaff(request, ["teacher","hr","admin"]);
    const { id } = await params;
    const snap = await getAdminDb().collection("personnel").doc(id).get();
    if (!snap.exists) return NextResponse.json({ error: "ไม่พบข้อมูลบุคลากร" }, { status: 404 });
    const data = snap.data();
    if (!hasRole(user, "hr") && !hasRole(user, "admin")) {
      const { prefix, firstName, lastName, position, academicRank, subjectGroup, managementGroup, photoDocumentId, status } = data;
      return NextResponse.json({ personnel: { id, prefix, firstName, lastName, position, academicRank, subjectGroup, managementGroup, photoDocumentId, status }, limited: true });
    }
    return NextResponse.json({ personnel: { id, ...data }, limited: false });
  } catch (e) { const x = staffError(e); return NextResponse.json({ error: x.message }, { status: x.status }); }
}
export async function PATCH(request, { params }) {
  try {
    if (!verifyRequestOrigin(request)) return NextResponse.json({ error: "Invalid request" }, { status: 403 });
    const user = await requireStaff(request, ["hr","admin"]);
    const { id } = await params;
    const ref = getAdminDb().collection("personnel").doc(id);
    if (!(await ref.get()).exists) return NextResponse.json({ error: "ไม่พบบุคลากร" }, { status: 404 });
    const data = safePersonnelPatch(await request.json());
    await ref.set({ ...data, updatedAt: new Date().toISOString(), updatedBy: user.uid }, { merge: true });
    await getAdminDb().collection("auditLogs").add({ actorUid: user.uid, action: "update_personnel", targetId: id, createdAt: new Date().toISOString() });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e.message === "INVALID_BODY") return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    const x = staffError(e); return NextResponse.json({ error: x.message }, { status: x.status });
  }
}
