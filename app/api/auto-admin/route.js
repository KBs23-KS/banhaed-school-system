import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";

const ADMIN_USERNAME = "admin";

export async function POST(request) {
  try {
    const body = await request.json();
    const username = String(body.username || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (username !== ADMIN_USERNAME) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const db = getAdminDb();
    const admins = await db.collection("users").where("roles", "array-contains", "admin").limit(1).get();

    if (!admins.empty) {
      return NextResponse.json({ ok: true, exists: true });
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

    const email = `${ADMIN_USERNAME}@banhaed.local`;
    const displayName = process.env.ADMIN_DISPLAY_NAME || "ผู้ดูแลระบบ";
    const adminAuth = getAdminAuth();
    let user;

    try {
      user = await adminAuth.getUserByEmail(email);
      user = await adminAuth.updateUser(user.uid, {
        password: expectedPassword,
        displayName,
        disabled: false,
      });
    } catch (error) {
      if (error?.code === "auth/user-not-found") {
        user = await adminAuth.createUser({
          email,
          password: expectedPassword,
          displayName,
          disabled: false,
        });
      } else {
        throw error;
      }
    }

    const now = new Date().toISOString();
    await db.collection("users").doc(user.uid).set(
      {
        username: ADMIN_USERNAME,
        email,
        displayName,
        roles: ["teacher", "hr", "admin"],
        homerooms: [],
        status: "active",
        createdAt: now,
        updatedAt: now,
        autoBootstrap: true,
      },
      { merge: true }
    );

    await db.collection("settings").doc("system").set(
      { currentAcademicYear: "2569" },
      { merge: true }
    );

    return NextResponse.json({ ok: true, created: true, username: ADMIN_USERNAME });
  } catch (error) {
    console.error("auto-admin error", error);
    return NextResponse.json(
      { error: error?.message || "ไม่สามารถสร้าง Admin อัตโนมัติได้" },
      { status: 500 }
    );
  }
}
