import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";

const ADMIN_USERNAME = "admin";
const ADMIN_EMAIL = `${ADMIN_USERNAME}@banhaed.local`;

export async function POST(request) {
  try {
    const body = await request.json();
    const username = String(body.username || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (username !== ADMIN_USERNAME) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const expectedPassword = process.env.ADMIN_PASSWORD;
    if (!expectedPassword) {
      return NextResponse.json(
        { error: "ยังไม่ได้ตั้ง ADMIN_PASSWORD ใน Vercel" },
        { status: 503 }
      );
    }

    if (password !== expectedPassword) {
      return NextResponse.json({ error: "รหัสผ่าน Admin ไม่ถูกต้อง" }, { status: 401 });
    }

    const displayName = process.env.ADMIN_DISPLAY_NAME || "ผู้ดูแลระบบ";
    const adminAuth = getAdminAuth();
    const db = getAdminDb();
    let user;
    let created = false;

    // Always reconcile Firebase Auth with the configured admin credentials.
    // This also repairs cases where Firestore has an admin profile but the
    // corresponding Auth user/password is missing or out of sync.
    try {
      user = await adminAuth.getUserByEmail(ADMIN_EMAIL);
      user = await adminAuth.updateUser(user.uid, {
        password: expectedPassword,
        displayName,
        disabled: false,
      });
    } catch (error) {
      if (error?.code === "auth/user-not-found") {
        user = await adminAuth.createUser({
          email: ADMIN_EMAIL,
          password: expectedPassword,
          displayName,
          disabled: false,
        });
        created = true;
      } else {
        throw error;
      }
    }

    const now = new Date().toISOString();
    const userRef = db.collection("users").doc(user.uid);
    const existing = await userRef.get();

    await userRef.set(
      {
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        displayName,
        roles: ["teacher", "hr", "admin"],
        homerooms: Array.isArray(existing.data()?.homerooms) ? existing.data().homerooms : [],
        status: "active",
        createdAt: existing.data()?.createdAt || now,
        updatedAt: now,
        autoBootstrap: true,
      },
      { merge: true }
    );

    await db.collection("settings").doc("system").set(
      { currentAcademicYear: "2569" },
      { merge: true }
    );

    return NextResponse.json({
      ok: true,
      created,
      repaired: true,
      username: ADMIN_USERNAME,
    });
  } catch (error) {
    console.error("auto-admin error", error);
    return NextResponse.json(
      { error: error?.message || "ไม่สามารถเตรียมบัญชี Admin ได้" },
      { status: 500 }
    );
  }
}
