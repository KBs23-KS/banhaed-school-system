import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDLMPIWsBdmhjx0zCrYkmXYICoff-GHTJw",
  authDomain: "banhaed-school-system-43dc6.firebaseapp.com",
  projectId: "banhaed-school-system-43dc6",
  storageBucket: "banhaed-school-system-43dc6.firebasestorage.app",
  messagingSenderId: "745911833476",
  appId: "1:745911833476:web:d3160209770707c8ec43d1",
  measurementId: "G-KYRS3DFSGY"
};

export const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
