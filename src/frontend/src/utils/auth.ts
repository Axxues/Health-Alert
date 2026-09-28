const TOKEN_KEY = "ha.token";
const ROLE_KEY = "ha.role";
const PERMS_KEY = "ha.permissions";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

export function getPermissions(): string[] {
  try {
    return JSON.parse(localStorage.getItem(PERMS_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export function hasPermission(permission: string): boolean {
  return getPermissions().includes(permission);
}

export function setSession(token: string, role: string, permissions: string[]): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ROLE_KEY, role);
  localStorage.setItem(PERMS_KEY, JSON.stringify(permissions));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(PERMS_KEY);
  if (window.location.pathname !== "/login") window.location.assign("/login");
}
