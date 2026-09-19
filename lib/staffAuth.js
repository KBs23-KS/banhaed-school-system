import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";

export async function requireStaff(request, allowedRoles = null) {
  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const token = header.slice(7);
  const decoded = await getAdminAuth().verifyIdToken(token);
  const snap = await getAdminDb().collection("users").doc(decoded.uid).get();
  if (!snap.exists) throw new Error("NO_PROFILE");
  const profile = { uid: decoded.uid, email: decoded.email || "", ...snap.data() };
  if (profile.status === "inactive") throw new Error("INACTIVE");
  const roles = Array.isArray(profile.roles) ? profile.roles : [];
  if (allowedRoles && !allowedRoles.some(r => roles.includes(r))) throw new Error("FORBIDDEN");
  return profile;
}

export function staffError(error) {
  const code = error?.message || "";
  if (["UNAUTHORIZED","NO_PROFILE","INACTIVE"].includes(code)) return { status: 401, message: "กรุณาเข้าสู่ระบบใหม่" };
  if (code === "FORBIDDEN") return { status: 403, message: "คุณไม่มีสิทธิ์ทำรายการนี้" };
  return { status: 500, message: "เกิดข้อผิดพลาดของระบบ" };
}

export function hasRole(profile, role){ return (profile.roles || []).includes(role); }
export function canEditStudent(profile, student){
  if (hasRole(profile,"admin")) return true;
  if (!hasRole(profile,"teacher")) return false;
  const room = student.currentEnrollment || {};
  return (profile.homerooms || []).some(h => String(h.academicYear)===String(room.academicYear) && String(h.grade)===String(room.grade) && String(h.room)===String(room.room));
}
