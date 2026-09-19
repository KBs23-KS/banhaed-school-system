import { getAdminDb } from "@/lib/firebaseAdmin";
export function currentBEYear(){ return new Date().getFullYear()+543; }
export async function getSystemSettings(){ const snap=await getAdminDb().collection("settings").doc("system").get(); return { currentAcademicYear:String(snap.exists && snap.data().currentAcademicYear || currentBEYear()), ...(snap.exists?snap.data():{}) }; }
export function normalizeEnrollment(data,year){ return { academicYear:String(data.academicYear||year||""), grade:String(data.grade||""), room:String(data.room||""), number:data.number===""?null:Number(data.number||0) }; }
export function calculateStudentCompletion(s){
 const groups=[
  [s.citizenId,s.prefix,s.firstName,s.lastName,s.nickname,s.birthDateBE,s.gender,s.phone],
  [s.address?.registered?.houseNo,s.address?.registered?.subdistrict,s.address?.registered?.district,s.address?.registered?.province,s.address?.travelMethod],
  [s.family?.guardian?.name,s.family?.guardian?.phone],
  [s.emergency?.primary?.name,s.emergency?.primary?.phone],
  [s.additional?.abilities],
  [s.learning?.favoriteSubjects,s.learning?.postGraduationGoal]
 ];
 const complete=groups.filter(g=>g.every(v=>Array.isArray(v)?v.length>0:Boolean(v))).length;
 return Math.round(complete/groups.length*100);
}
