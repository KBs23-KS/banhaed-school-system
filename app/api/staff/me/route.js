import { NextResponse } from "next/server";
import { requireStaff, staffError } from "@/lib/staffAuth";
import { toStaffPublicProfile } from "@/lib/staffView.mjs";

export async function GET(request) {
  try {
    const user = await requireStaff(request);
    return NextResponse.json({ user: toStaffPublicProfile(user) }, {headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {
    const x = staffError(error);
    return NextResponse.json({ error: x.message }, { status: x.status });
  }
}
