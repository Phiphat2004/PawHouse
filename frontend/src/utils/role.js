export function getCurrentUserRoles() {
  try {
    const rawUser = localStorage.getItem("pawhouse_user");
    if (!rawUser) return [];
    const user = JSON.parse(rawUser);
    return Array.isArray(user?.roles) ? user.roles : [];
  } catch {
    return [];
  }
}

export function isAdminUser(user) {
  if (!user) return false;
  if (user.isAdmin === true) return true;
  return Array.isArray(user.roles) && user.roles.includes("admin");
}

export function isStaffUser(user) {
  if (!user) return false;
  if (user.isStaff === true) return true;
  return Array.isArray(user.roles) && user.roles.includes("staff");
}

export function hasWriteAccessForCatalog() {
  const roles = getCurrentUserRoles();
  return roles.includes("admin");
}
