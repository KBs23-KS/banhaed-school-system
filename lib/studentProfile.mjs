const rootFields = ["nickname", "citizenId", "birthDateBE", "gender", "phone", "noPhone"];
const nestedFields = {
  address: { registered: ["houseNo","moo","village","road","subdistrict","district","province","postalCode"], current: ["houseNo","moo","village","road","subdistrict","district","province","postalCode"], travelMethod: true, distance: true, landmark: true },
  family: { guardian: ["name","relationship","phone","occupation","workplace"], father: ["name","phone","occupation"], mother: ["name","phone","occupation"], parentStatus: true, siblingsTotal: true, birthOrder: true },
  emergency: { primary: ["name","relationship","phone"], secondary: ["name","relationship","phone"] },
  additional: { abilities: true, sportsActivities: true, hobbies: true, teacherNote: true },
  learning: { favoriteSubjects: "array", needHelpSubjects: "array", postGraduationGoal: true, desiredField: true, teacherHelp: true }
};
function cleanValue(value, max = 500) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return String(value).slice(0, max);
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}
function extract(source, schema) {
  if (!source || typeof source !== "object" || Array.isArray(source)) return {};
  const result = {};
  for (const [key, rule] of Object.entries(schema)) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
    if (Array.isArray(rule)) {
      const child = {};
      for (const k of rule) if (Object.prototype.hasOwnProperty.call(source[key] || {}, k)) child[k] = cleanValue(source[key][k]);
      result[key] = child;
    } else if (rule === "array") {
      result[key] = Array.isArray(source[key]) ? source[key].slice(0, 30).map(v => cleanValue(v, 100)).filter(Boolean) : [];
    } else if (rule === true) {
      result[key] = cleanValue(source[key]);
    }
  }
  return result;
}
export function sanitizeStudentProfile(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("INVALID_PROFILE");
  const output = {};
  for (const key of rootFields) {
    if (Object.prototype.hasOwnProperty.call(input, key)) output[key] = key === "noPhone" ? Boolean(input[key]) : cleanValue(input[key], key === "citizenId" ? 13 : 100);
  }
  for (const [key, schema] of Object.entries(nestedFields)) if (Object.prototype.hasOwnProperty.call(input, key)) output[key] = extract(input[key], schema);
  if (output.birthDateBE && !/^[0-9]{8}$/.test(output.birthDateBE)) throw new Error("INVALID_BIRTH_DATE");
  if (output.citizenId && !/^[0-9]{13}$/.test(output.citizenId)) throw new Error("INVALID_CITIZEN_ID");
  return output;
}
export function mergeStudentProfile(old, patch) {
  const merged = { ...old, ...patch };
  for (const key of Object.keys(nestedFields)) {
    if (!Object.prototype.hasOwnProperty.call(patch, key)) continue;
    merged[key] = { ...(old[key] || {}), ...(patch[key] || {}) };
    for (const [sub, schema] of Object.entries(nestedFields[key])) {
      if (!Array.isArray(schema)) continue;
      if (Object.prototype.hasOwnProperty.call(patch[key] || {}, sub)) merged[key][sub] = { ...(old[key]?.[sub] || {}), ...(patch[key][sub] || {}) };
    }
  }
  return merged;
}
export function sanitizeStaffStudentPatch(input, admin = false) {
  const result = sanitizeStudentProfile(input);
  if (!admin) return result;
  for (const key of ["prefix","firstName","lastName","birthDateBE","status"]) {
    if (Object.prototype.hasOwnProperty.call(input, key)) result[key] = cleanValue(input[key], 150);
  }
  if (input.currentEnrollment && typeof input.currentEnrollment === "object") {
    const e = input.currentEnrollment;
    const grade = String(e.grade ?? "");
    const room = String(e.room ?? "");
    const academicYear = String(e.academicYear ?? "");
    if (!/^[1-6]$/.test(grade) || !/^[0-9]{1,3}$/.test(room) || !/^[0-9]{4}$/.test(academicYear)) throw new Error("INVALID_ENROLLMENT");
    result.currentEnrollment = { academicYear, grade, room, number: Number(e.number || 0) };
  }
  return result;
}
