import type { UserInfo } from "../types.js";

const USER_KEY = "vms-session-user";
const VIEW_KEY = "vms-session-view";

const inMemoryStore: Record<string, string> = {};

function getSessionStorage(): Storage | null {
  if (typeof window !== "undefined" && window.sessionStorage) {
    return window.sessionStorage;
  }
  return null;
}

function getItem(key: string): string | null {
  const storage = getSessionStorage();
  if (storage) {
    return storage.getItem(key);
  }
  return inMemoryStore[key] || null;
}

function setItem(key: string, value: string): void {
  const storage = getSessionStorage();
  if (storage) {
    storage.setItem(key, value);
  } else {
    inMemoryStore[key] = value;
  }
}

function removeItem(key: string): void {
  const storage = getSessionStorage();
  if (storage) {
    storage.removeItem(key);
  } else {
    delete inMemoryStore[key];
  }
}

export function getUserSession(): UserInfo | null {
  const val = getItem(USER_KEY);
  if (!val) return null;
  try {
    return JSON.parse(val) as UserInfo;
  } catch {
    return null;
  }
}

export function setUserSession(user: UserInfo): void {
  setItem(USER_KEY, JSON.stringify(user));
}

export function clearUserSession(): void {
  removeItem(USER_KEY);
}

export function getViewSession(): string | null {
  return getItem(VIEW_KEY);
}

export function setViewSession(view: string): void {
  setItem(VIEW_KEY, view);
}

export function clearViewSession(): void {
  removeItem(VIEW_KEY);
}
