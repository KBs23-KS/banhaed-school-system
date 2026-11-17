import test from "node:test";
import assert from "node:assert/strict";
import {sanitizeStudentProfile, sanitizeStaffStudentPatch, mergeStudentProfile, changedStudentProfileFields} from "../lib/studentProfile.mjs";

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

test("invalid class numbers and statuses cannot be written by Admin", () => {
  assert.throws(()=>sanitizeStaffStudentPatch({currentEnrollment:{academicYear:"2569",grade:"2",room:"1",number:"abc"}},true),/INVALID_ENROLLMENT/);
  assert.throws(()=>sanitizeStaffStudentPatch({currentEnrollment:{academicYear:"2569",grade:"2",room:"1",number:-1}},true),/INVALID_ENROLLMENT/);
  assert.throws(()=>sanitizeStaffStudentPatch({currentEnrollment:{academicYear:"2569",grade:"2",room:"1",number:1001}},true),/INVALID_ENROLLMENT/);
  assert.throws(()=>sanitizeStaffStudentPatch({currentEnrollment:null},true),/INVALID_ENROLLMENT/);
  assert.throws(()=>sanitizeStaffStudentPatch({status:"admin"},true),/INVALID_STATUS/);
});

test("valid current enrollment preserves blank number as null", () => {
  const result=sanitizeStaffStudentPatch({currentEnrollment:{academicYear:"2569",grade:"2",room:"1",number:""}},true);
  assert.equal(result.currentEnrollment.number,null);
});

test("editing one contact field does not resubmit stale identity or enrollment data",()=>{
  const old={
    studentId:"111", firstName:"Original", currentEnrollment:{grade:"1",room:"1"},
    address:{registered:{houseNo:"1",province:"Khon Kaen"}},
    phone:"0800000000", nickname:"A"
  };
  const next={...old,phone:"0811111111"};
  assert.deepEqual(changedStudentProfileFields(old,next),{phone:"0811111111"});
});

test("nested diff contains only explicitly edited subfield",()=>{
  const old={address:{registered:{houseNo:"1",province:"Khon Kaen"},travelMethod:"walk"},
    family:{guardian:{name:"Guardian",phone:"0890000000"}}};
  const next={...old,address:{...old.address,registered:{...old.address.registered,houseNo:"2"}}};
  assert.deepEqual(changedStudentProfileFields(old,next),{address:{registered:{houseNo:"2"}}});
  const patch=sanitizeStudentProfile(changedStudentProfileFields(old,next));
  assert.equal(mergeStudentProfile(old,patch).address.registered.province,"Khon Kaen");
  assert.equal(mergeStudentProfile(old,patch).family.guardian.phone,"0890000000");
});

test("unchanged form and non-profile fields do not generate data writes",()=>{
  const old={studentId:"123",auth:{activated:true},photoDocumentId:"photo",nickname:"A"};
  const next={...old,photoDocumentId:"other",auth:{activated:false}};
  assert.deepEqual(changedStudentProfileFields(old,next),{});
});

test("removing a value is sent as an intentional edit",()=>{
  const old={phone:"0811111111",learning:{favoriteSubjects:["Thai","Math"]}};
  const next={phone:"",learning:{favoriteSubjects:[]}};
  assert.deepEqual(changedStudentProfileFields(old,next),{phone:"",learning:{favoriteSubjects:[]}});
});
