export const PRODUCTION_FIREBASE_PROJECT_ID = "banhaed-school-system-43dc6";
export const productionClientConfig = {
  apiKey: "AIzaSyDLMPIWsBdmhjx0zCrYkmXYICoff-GHTJw",
  authDomain: "banhaed-school-system-43dc6.firebaseapp.com",
  projectId: PRODUCTION_FIREBASE_PROJECT_ID,
  storageBucket: "banhaed-school-system-43dc6.firebasestorage.app",
  messagingSenderId: "745911833476",
  appId: "1:745911833476:web:d3160209770707c8ec43d1",
  measurementId: "G-KYRS3DFSGY"
};
export function resolveFirebaseClientConfig(settings) {
  const stage = settings.vercelEnv === "preview" || settings.previewLock === "true";
  const values = [settings.apiKey,settings.authDomain,settings.projectId,settings.messagingSenderId,settings.appId];
  const complete = values.every(value => typeof value === "string" && value.trim().length > 0);
  const provided = values.some(value => typeof value === "string" && value.trim().length > 0);
  if(stage && (!complete || settings.projectId === PRODUCTION_FIREBASE_PROJECT_ID)) {
    return { ready: false, isPreview: true, reason: "Preview requires a separate Firebase test project" };
  }
  if(provided && !complete) return {ready:false,isPreview:stage,reason:"Incomplete Firebase web app settings"};
  return {
    ready:true,
    isPreview:stage,
    config:provided ? {
      ...productionClientConfig,
      apiKey:settings.apiKey,authDomain:settings.authDomain,
      projectId:settings.projectId,messagingSenderId:settings.messagingSenderId,
      appId:settings.appId,storageBucket:settings.storageBucket || undefined,
      measurementId:settings.measurementId || undefined
    } : productionClientConfig
  };
}
