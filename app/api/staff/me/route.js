
import { NextResponse } from "next/server"; import { requireStaff,staffError } from "@/lib/staffAuth"; export async function GET(request){try{return NextResponse.json({user:await requireStaff(request)});}catch(e){const x=staffError(e);return NextResponse.json({error:x.message},{status:x.status});}}
