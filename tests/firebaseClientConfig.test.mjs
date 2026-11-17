import test from "node:test";
import assert from "node:assert/strict";
import { resolveFirebaseClientConfig, PRODUCTION_FIREBASE_PROJECT_ID } from "../lib/firebaseClientConfig.mjs";

const testSettings={apiKey:"test-key",authDomain:"test.firebaseapp.com",projectId:"school-staging",
 messagingSenderId:"123",appId:"1:123:web:test"};
test("preview without Firebase client config fails closed",()=>{
 const resolved=resolveFirebaseClientConfig({vercelEnv:"preview"});
 assert.equal(resolved.ready,false);
 assert.equal(resolved.isPreview,true);
});
test("explicit preview lock works even when system env is absent",()=>{
 assert.equal(resolveFirebaseClientConfig({previewLock:"true"}).ready,false);
});
test("preview must never authenticate against production Firebase",()=>{
 const resolved=resolveFirebaseClientConfig({...testSettings,projectId:PRODUCTION_FIREBASE_PROJECT_ID,vercelEnv:"preview"});
 assert.equal(resolved.ready,false);
});
test("preview with complete staging Firebase works",()=>{
 const resolved=resolveFirebaseClientConfig({...testSettings,vercelEnv:"preview"});
 assert.equal(resolved.ready,true);
 assert.equal(resolved.config.projectId,"school-staging");
});
test("partially configured production also fails closed",()=>{
 assert.equal(resolveFirebaseClientConfig({apiKey:"only-one"}).ready,false);
});
test("production without overrides retains existing Firebase config",()=>{
 const resolved=resolveFirebaseClientConfig({vercelEnv:"production"});
 assert.equal(resolved.ready,true);
 assert.equal(resolved.config.projectId,PRODUCTION_FIREBASE_PROJECT_ID);
});
