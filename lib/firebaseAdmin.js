import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { validateFirebaseTarget } from "@/lib/firebaseGuard.mjs";

function privateKey(){return process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g,"\n");}

function getAdminApp(){
  const projectId=validateFirebaseTarget(process.env);
  const clientEmail=process.env.FIREBASE_CLIENT_EMAIL;
  const key=privateKey();
  return getApps()[0] || initializeApp({credential:cert({projectId,clientEmail,privateKey:key})});
}

export function getAdminDb(){return getFirestore(getAdminApp());}
export function getAdminAuth(){return getAuth(getAdminApp());}
