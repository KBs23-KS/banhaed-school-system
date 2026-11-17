import { cookies } from "next/headers";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { COOKIE_NAME, readStudentSession } from "@/lib/studentAuth";

export async function getStudentSession() {
  const jar = await cookies();
  const session = readStudentSession(jar.get(COOKIE_NAME)?.value);
  if (!session) return null;
  const snap = await getAdminDb().collection("students").doc(session.studentId).get();
  if (!snap.exists) return null;
  const data = snap.data();
  if (data.status !== "active" || !data.auth?.activated) return null;
  if (Number(session.v || 0) !== Number(data.auth.sessionVersion || 0)) return null;
  return { studentId: snap.id, data, ref: snap.ref };
}
