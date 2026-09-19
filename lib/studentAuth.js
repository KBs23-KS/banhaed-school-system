import crypto from "crypto";
export const COOKIE_NAME = "banhaed_student_session";
export const normalizeStudentId = (v="") => String(v).trim().replace(/\s+/g,"");
export const normalizeDobPassword = (v="") => String(v).replace(/\D/g,"").slice(0,8);
export function hashDobPassword(password,salt=crypto.randomBytes(16).toString("hex")){ return {salt,hash:crypto.scryptSync(password,salt,64).toString("hex")}; }
export function verifyDobPassword(password,salt,hash){ const a=crypto.scryptSync(password,salt,64); const b=Buffer.from(hash,"hex"); return a.length===b.length && crypto.timingSafeEqual(a,b); }
function secret(){ const s=process.env.STUDENT_SESSION_SECRET; if(!s || s.length<32) throw new Error("STUDENT_SESSION_SECRET missing"); return s; }
export function createStudentSession(studentId){ const payload=Buffer.from(JSON.stringify({studentId,iat:Date.now(),exp:Date.now()+7*86400000})).toString("base64url"); const sig=crypto.createHmac("sha256",secret()).update(payload).digest("base64url"); return `${payload}.${sig}`; }
export function readStudentSession(token){ try{ if(!token?.includes(".")) return null; const [p,s]=token.split("."); const x=crypto.createHmac("sha256",secret()).update(p).digest("base64url"); const a=Buffer.from(s),b=Buffer.from(x); if(a.length!==b.length || !crypto.timingSafeEqual(a,b)) return null; const d=JSON.parse(Buffer.from(p,"base64url").toString()); if(Date.now()>d.exp) return null; return d; }catch{return null;} }
