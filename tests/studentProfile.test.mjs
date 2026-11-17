import test from "node:test";
import assert from "node:assert/strict";
import {sanitizeStudentProfile, sanitizeStaffStudentPatch, mergeStudentProfile} from "../lib/studentProfile.mjs";

test("student cannot modify enrollment, roles, auth, or document ownership", () => {
  const result = sanitizeStudentProfile({
    nickname:"  Nok ",roles:["admin"],auth:{activated:true},
    currentEnrollment:{grade:"6"},photoDocumentId:"arbitrary",
    address:{registered:{houseNo:" 45 ",__proto__:null},somethingPrivate:"ignored"}
  });
  assert.equal(result.nickname,"Nok");
  assert.equal(result.address.registered.houseNo,"45");
  assert.equal(Object.hasOwn(result,"auth"),false);
  assert.equal(Object.hasOwn(result,"currentEnrollment"),false);
  assert.equal(Object.hasOwn(result,"photoDocumentId"),false);
});

test("reject malformed citizen ID", () => {
  assert.throws(()=>sanitizeStudentProfile({citizenId:"ABC"}),/INVALID_CITIZEN_ID/);
  assert.throws(()=>sanitizeStudentProfile({birthDateBE:"1301"}),/INVALID_BIRTH_DATE/);
});

test("teacher cannot move student between rooms or edit identity", () => {
  const result=sanitizeStaffStudentPatch({currentEnrollment:{academicYear:"2569",grade:"6",room:"1"},firstName:"Changed",phone:"0123456789"});
  assert.equal(result.phone,"0123456789");
  assert.equal(Object.hasOwn(result,"currentEnrollment"),false);
  assert.equal(Object.hasOwn(result,"firstName"),false);
});

test("admin can change enrollment with validation", () => {
  const result=sanitizeStaffStudentPatch({currentEnrollment:{academicYear:"2570",grade:"4",room:"2",number:8}},true);
  assert.equal(result.currentEnrollment.grade,"4");
  assert.throws(()=>sanitizeStaffStudentPatch({currentEnrollment:{academicYear:"2570",grade:"9",room:"2"}},true),/INVALID_ENROLLMENT/);
});

test("nested merges preserve unrelated fields", () => {
  const old={address:{registered:{houseNo:"15",province:"ขอนแก่น"},travelMethod:"เดิน"}};
  const merged=mergeStudentProfile(old,{address:{registered:{houseNo:"16"}}});
  assert.equal(merged.address.registered.houseNo,"16");
  assert.equal(merged.address.registered.province,"ขอนแก่น");
  assert.equal(merged.address.travelMethod,"เดิน");
});
