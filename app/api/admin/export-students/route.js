import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requireStaff, staffError, hasRole } from "@/lib/staffAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { canEditStudent } from "@/lib/staffAuth";

export async function GET(request) {
  try {
    const user = await requireStaff(request, ["teacher","admin"]);
    const url = new URL(request.url);
    const grade = url.searchParams.get("grade");
    const room = url.searchParams.get("room");
    const snap = await getAdminDb().collection("students").get();
    let rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!hasRole(user,"admin")) rows = rows.filter(s => canEditStudent(user, s));
    if (grade) rows = rows.filter(s => String(s.currentEnrollment?.grade) === grade);
    if (room) rows = rows.filter(s => String(s.currentEnrollment?.room) === room);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Students");
    sheet.addRow(["รหัสนักเรียน","คำนำหน้า","ชื่อ","นามสกุล","ชื่อเล่น","ชั้น","ห้อง","เลขที่","เบอร์โทร","ความครบถ้วน"]);
    for (const s of rows) sheet.addRow([s.id,s.prefix||"",s.firstName||"",s.lastName||"",s.nickname||"",s.currentEnrollment?.grade||"",s.currentEnrollment?.room||"",s.currentEnrollment?.number??"",s.phone||"",String(s.profileCompletion||0)+"%"]);
    sheet.getRow(1).font = {bold:true};
    sheet.columns.forEach(col=>col.width=19);
    const bytes = await workbook.xlsx.writeBuffer();
    return new NextResponse(Buffer.from(bytes), { headers: {"Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","Content-Disposition":"attachment; filename=students.xlsx","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"} });
  } catch (e) { const x = staffError(e); return NextResponse.json({ error: x.message }, { status: x.status }); }
}
