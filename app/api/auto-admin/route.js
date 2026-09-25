import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";

const ADMIN_USERNAME = "admin";
const ADMIN_EMAIL = `${ADMIN_USERNAME}@banhaed.local`;
const ADMIN_ALIASES = [
  ADMIN_EMAIL,
  `${ADMIN_USERNAME}@banhaed.ac.th`,
];

export async function POST(request) {
  try {
    const body = await request.json();
    const rawUsername = String(body.username || "").trim().toLowerCase();
    const username = rawUsername.split("@")[0];

    // Treat admin@... as the same Admin account as "admin".
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

    const password = String(body.password || "");
    if (password !== expectedPassword) {
      return NextResponse.json({ error: "รหัสผ่าน Admin ไม่ถูกต้อง" }, { status: 401 });
    }

    const displayName = process.env.ADMIN_DISPLAY_NAME || "ผู้ดูแลระบบ";
    const adminAuth = getAdminAuth();
    const db = getAdminDb();

    // First, use an existing Firestore admin profile when one exists.
    // This preserves its Firebase Auth UID and existing email alias.
    const adminProfiles = await db
      .collection("users")
      .where("roles", "array-contains", "admin")
      .limit(1)
      .get();

    let user = null;

    if (!adminProfiles.empty) {
      const adminDoc = adminProfiles.docs[0];
      try {
        user = await adminAuth.getUser(adminDoc.id);
      } catch (error) {
        if (error?.code !== "auth/user-not-found") throw error;
      }

      if (!user) {
        // The profile exists but its Auth user does not. Reuse an existing
        // known alias if available, otherwise create the canonical account.
        for (const email of ADMIN_ALIASES) {
          try {
            user = await adminAuth.getUserByEmail(email);
            break;
          } catch (error) {
            if (error?.code !== "auth/user-not-found") throw error;
          }
        }
      }
    }

    // No usable existing admin profile/Auth user: locate an existing admin
    // alias before creating a new account.
    if (!user) {
      for (const email of ADMIN_ALIASES) {
        try {
          user = await adminAuth.getUserByEmail(email);
          break;
        } catch (error) {
          if (error?.code !== "auth/user-not-found") throw error;
        }
      }
    }

    if (!user) {
      user = await adminAuth.createUser({
        email: ADMIN_EMAIL,
        password: expectedPassword,
        displayName,
        disabled: false,
      });
    } else {
      user = await adminAuth.updateUser(user.uid, {
        password: expectedPassword,
        displayName,
        disabled: false,
      });
    }

    const now = new Date().toISOString();
    const existingData = adminProfiles.empty ? {} : adminProfiles.docs[0].data();
    await db.collection("users").doc(user.uid).set(
      {
        username: ADMIN_USERNAME,
        email: user.email || ADMIN_EMAIL,
        displayName,
        roles: ["teacher", "hr", "admin"],
        homerooms: Array.isArray(existingData.homerooms) ? existingData.homerooms : [],
        status: "active",
        createdAt: existingData.createdAt || now,
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
      created: !existingData || adminProfiles.empty,
      repaired: true,
      username: ADMIN_USERNAME,
      loginEmail: user.email || ADMIN_EMAIL,
    });
  } catch (error) {
    console.error("auto-admin error", error);
    return NextResponse.json(
      { error: error?.message || "ไม่สามารถเตรียมบัญชี Admin ได้" },
      { status: 500 }
    );
  }
}
