import { NextResponse } from "next/server";
import { requireStaff, staffError } from "@/lib/staffAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { driveReady } from "@/lib/drive";

export async function GET(request) {
  try {
    await requireStaff(request, ["teacher","hr","admin"]);
    await getAdminDb().collection("settings").doc("system").get();
    return NextResponse.json({ authentication: "verified", firestore: "connected", driveConfigured: driveReady() });
  } catch(e) {const x=staffError(e);return NextResponse.json({error:x.message},{status:x.status});}
}
