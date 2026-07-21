const ADMIN_KEY = "achan_admin_authed";

export function setAdminAuthed(): void {
  sessionStorage.setItem(ADMIN_KEY, "true");
}

export function isAdminAuthed(): boolean {
  return sessionStorage.getItem(ADMIN_KEY) === "true";
}

export function clearAdminAuthed(): void {
  sessionStorage.removeItem(ADMIN_KEY);
}
