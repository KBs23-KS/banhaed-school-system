import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

// Public Firebase browser configuration. These values are not service-account secrets.
// To test against a separate Firebase project, set ALL five NEXT_PUBLIC_ variables in Preview.
const production = {
  apiKey: "AIzaSyDLMPIWsBdmhjx0zCrYkmXYICoff-GHTJw",
  authDomain: "banhaed-school-system-43dc6.firebaseapp.com",
  projectId: "banhaed-school-system-43dc6",
  storageBucket: "banhaed-school-system-43dc6.firebasestorage.app",
  messagingSenderId: "745911833476",
  appId: "1:745911833476:web:d3160209770707c8ec43d1",
  measurementId: "G-KYRS3DFSGY"
};

const overrides = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};
const provided=Object.values(overrides).filter(Boolean).length;
if(provided > 0 && provided < Object.keys(overrides).length) {
  throw new Error("Incomplete Firebase client configuration: set all NEXT_PUBLIC_FIREBASE_* fields");
}

const firebaseConfig=provided===Object.keys(overrides).length ? {
  ...production,
  ...overrides,
  storageBucket:process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || undefined,
  measurementId:process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || undefined
} : production;

export const firebaseApp=getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth=getAuth(firebaseApp);
