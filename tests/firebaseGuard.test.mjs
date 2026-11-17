import test from "node:test";
import assert from "node:assert/strict";
import { validateFirebaseTarget, PRODUCTION_FIREBASE_PROJECT_ID } from "../lib/firebaseGuard.mjs";

const common={FIREBASE_CLIENT_EMAIL:"service@example.iam.gserviceaccount.com",FIREBASE_PRIVATE_KEY:"nonempty"};
test("server config rejects missing credentials",()=>{
 assert.throws(()=>validateFirebaseTarget({FIREBASE_PROJECT_ID:PRODUCTION_FIREBASE_PROJECT_ID}),/missing/);
});
test("production config accepts correct project",()=>{
 assert.equal(validateFirebaseTarget({...common,FIREBASE_PROJECT_ID:PRODUCTION_FIREBASE_PROJECT_ID,VERCEL_ENV:"production"}),PRODUCTION_FIREBASE_PROJECT_ID);
});
test("preview rejects production database",()=>{
 assert.throws(()=>validateFirebaseTarget({...common,FIREBASE_PROJECT_ID:PRODUCTION_FIREBASE_PROJECT_ID,VERCEL_ENV:"preview"}),/Preview cannot/);
});
test("preview requires matching isolated client project",()=>{
 assert.throws(()=>validateFirebaseTarget({...common,FIREBASE_PROJECT_ID:"school-test",VERCEL_ENV:"preview"}),/separate Firebase browser/);
 assert.throws(()=>validateFirebaseTarget({...common,FIREBASE_PROJECT_ID:"school-test",VERCEL_ENV:"preview",NEXT_PUBLIC_FIREBASE_PROJECT_ID:"different"}),/mismatch/);
 assert.equal(validateFirebaseTarget({...common,FIREBASE_PROJECT_ID:"school-test",VERCEL_ENV:"preview",NEXT_PUBLIC_FIREBASE_PROJECT_ID:"school-test"}),"school-test");
});

test("explicit preview lock rejects production even if VERCEL_ENV is unavailable",()=>{
 assert.throws(()=>validateFirebaseTarget({...common,FIREBASE_PROJECT_ID:PRODUCTION_FIREBASE_PROJECT_ID,NEXT_PUBLIC_SCHOOL_PREVIEW_LOCK:"true"}),/Preview cannot/);
});
