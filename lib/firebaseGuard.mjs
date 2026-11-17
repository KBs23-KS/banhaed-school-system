export const PRODUCTION_FIREBASE_PROJECT_ID="banhaed-school-system-43dc6";

export function validateFirebaseTarget(env){
  const project=env.FIREBASE_PROJECT_ID;
  if(!project || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY)
    throw new Error("Firebase Admin environment variables are missing");

  if(env.VERCEL_ENV==="preview"){
    if(project===PRODUCTION_FIREBASE_PROJECT_ID)
      throw new Error("Preview cannot access the production Firebase project");
    if(!env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
      throw new Error("Preview requires a separate Firebase browser configuration");
  }
  if(env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!==project)
    throw new Error("Firebase client/server project mismatch");
  return project;
}
