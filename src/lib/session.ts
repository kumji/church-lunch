import type { Identity } from "./types";

const IDENTITY_KEY = "achan_identity";
const ADMIN_KEY = "achan_admin_authed";

export function saveIdentity(identity: Identity): void {
  sessionStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
}

export function loadIdentity(): Identity | null {
  const raw = sessionStorage.getItem(IDENTITY_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Identity;
  } catch {
    return null;
  }
}

export function clearIdentity(): void {
  sessionStorage.removeItem(IDENTITY_KEY);
}

export function setAdminAuthed(): void {
  sessionStorage.setItem(ADMIN_KEY, "true");
}

export function isAdminAuthed(): boolean {
  return sessionStorage.getItem(ADMIN_KEY) === "true";
}

export function clearAdminAuthed(): void {
  sessionStorage.removeItem(ADMIN_KEY);
}
