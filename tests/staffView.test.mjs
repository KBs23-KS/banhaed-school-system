import test from "node:test";
import assert from "node:assert/strict";
import {toStaffPublicProfile} from "../lib/staffView.mjs";

test("staff profile exposes only fields used by the UI", () => {
  const profile=toStaffPublicProfile({
    uid:"abc",username:"teacher1",email:"t@school",displayName:"Teacher",
    roles:["teacher","admin","forged"],homerooms:[{academicYear:"2569",grade:"1",room:"2",internalNote:"secret"}],
    status:"active",passwordHash:"sensitive",adminPassword:"should-never-be-returned",
    createdBy:"hidden"
  });
  assert.equal(profile.username,"teacher1");
  assert.deepEqual(profile.roles,["teacher","admin"]);
  assert.deepEqual(profile.homerooms,[{academicYear:"2569",grade:"1",room:"2"}]);
  assert.equal(Object.hasOwn(profile,"passwordHash"),false);
  assert.equal(Object.hasOwn(profile,"adminPassword"),false);
  assert.equal(Object.hasOwn(profile,"createdBy"),false);
});
