import { google } from "googleapis";
import { Readable } from "stream";
function key(){ return process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g,"\n"); }
export function driveReady(){ return Boolean(process.env.FIREBASE_CLIENT_EMAIL && key() && process.env.GOOGLE_DRIVE_FOLDER_ID); }
function client(){ const auth=new google.auth.JWT({email:process.env.FIREBASE_CLIENT_EMAIL,key:key(),scopes:["https://www.googleapis.com/auth/drive"]}); return google.drive({version:"v3",auth}); }
export async function uploadBuffer({buffer,name,mimeType,parentId}){ const d=client(); const folder=parentId||process.env.GOOGLE_DRIVE_FOLDER_ID; const r=await d.files.create({requestBody:{name,parents:[folder]},media:{mimeType,body:Readable.from(buffer)},fields:"id,name,mimeType,webViewLink,size,createdTime"}); return r.data; }
export async function deleteDriveFile(fileId){ return client().files.delete({fileId}); }
