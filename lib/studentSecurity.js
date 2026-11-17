import crypto from "crypto";
import { getAdminDb } from "@/lib/firebaseAdmin";

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;

function attemptRef(studentId, purpose) {
  const key = crypto.createHash("sha256").update(purpose + ":" + studentId).digest("hex");
  return getAdminDb().collection("authRateLimits").doc(key);
}

export async function checkLoginLimit(studentId, purpose) {
  const snap = await attemptRef(studentId, purpose).get();
  if (snap.exists && Number(snap.data().lockedUntil || 0) > Date.now()) {
    throw new Error("RATE_LIMITED");
  }
}

export async function markLoginFailure(studentId, purpose) {
  const ref = attemptRef(studentId, purpose);
  await getAdminDb().runTransaction(async tx => {
    const snap = await tx.get(ref);
    const old = snap.exists ? snap.data() : {};
    const now = Date.now();
    const activeWindow = now - Number(old.windowStart || 0) < WINDOW_MS;
    const failures = activeWindow ? Number(old.failures || 0) + 1 : 1;
    tx.set(ref, {
      windowStart: activeWindow ? old.windowStart : now,
      failures,
      lockedUntil: failures >= MAX_FAILURES ? now + LOCK_MS : 0,
      expiresAt: new Date(now + WINDOW_MS + LOCK_MS)
    });
  });
}

export async function clearLoginFailures(studentId, purpose) {
  await attemptRef(studentId, purpose).delete().catch(() => {});
}

export function isStrongStudentPassword(value) {
  return typeof value === "string" && value.length >= 10 && value.length <= 128 && /[A-Za-zก-๙]/u.test(value) && /[0-9]/.test(value);
}

export function makeActivationCode() {
  return crypto.randomBytes(9).toString("hex").toUpperCase();
}

export function verifyRequestOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const expected = new URL(request.url);
  try { const parsed = new URL(origin); return parsed.host === expected.host && parsed.protocol === expected.protocol; } catch { return false; }
}
