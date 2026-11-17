export function toStaffPublicProfile(profile) {
  if (!profile || typeof profile !== "object") return null;
  return {
    uid: String(profile.uid || ""),
    username: String(profile.username || ""),
    email: String(profile.email || ""),
    displayName: String(profile.displayName || ""),
    roles: Array.isArray(profile.roles) ? profile.roles.filter(r => ["teacher","hr","admin"].includes(r)) : [],
    homerooms: Array.isArray(profile.homerooms) ? profile.homerooms.slice(0,100).map(h => ({
      academicYear: String(h.academicYear || ""),
      grade: String(h.grade || ""),
      room: String(h.room || "")
    })) : [],
    status: profile.status || "active"
  };
}
