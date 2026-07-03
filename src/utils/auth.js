function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized);
    return JSON.parse(decoded);
  } catch {
    return {};
  }
}

function normalizeRole(value) {
  if (!value) return "";
  if (typeof value === "object") {
    return normalizeRole(value.authority ?? value.role ?? value.name);
  }
  return String(value).replace("ROLE_", "").toUpperCase();
}

function firstRoleFromList(list) {
  if (!Array.isArray(list)) return undefined;
  return normalizeRole(list.find(Boolean)) || undefined;
}

export function getRoleFromAuth(responseData) {
  const directRole =
    responseData?.role ??
    responseData?.userRole ??
    responseData?.user?.role ??
    responseData?.user?.userRole ??
    responseData?.authority ??
    firstRoleFromList(responseData?.authorities) ??
    firstRoleFromList(responseData?.roles);

  if (directRole) return normalizeRole(directRole);

  const payload = decodeJwtPayload(responseData?.token ?? "");
  const tokenRole =
    payload.role ??
    payload.userRole ??
    payload.user?.role ??
    payload.user?.userRole ??
    payload.authority ??
    firstRoleFromList(payload.authorities) ??
    firstRoleFromList(payload.roles) ??
    payload.scope?.split?.(" ")?.find((item) => item.includes("ROLE_"));

  return normalizeRole(tokenRole) || "VIEWER";
}

export function getUserRole() {
  return localStorage.getItem("role") || "ADMIN";
}

export function canMutateData() {
  return getUserRole() !== "VIEWER";
}

export function isSalesRoute(pathname) {
  return pathname.startsWith("/sales");
}

export function isErpRoute(pathname) {
  return !isSalesRoute(pathname) && pathname !== "/";
}
