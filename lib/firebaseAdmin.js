import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function privateKey() { return process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"); }

function getAdminApp() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const key = privateKey();
  if (!projectId || !clientEmail || !key) throw new Error("Firebase Admin environment variables are missing");
  return getApps()[0] || initializeApp({ credential: cert({ projectId, clientEmail, privateKey: key }) });
}

export function getAdminDb(){ return getFirestore(getAdminApp()); }
export function getAdminAuth(){ return getAuth(getAdminApp()); }
