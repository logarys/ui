import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  isEnabled: boolean;
}

const TOKEN_KEY = 'logarys_token';
const USER_KEY = 'logarys_user';

function readUser(): CurrentUser | null {
  if (!browser) return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as CurrentUser;
  } catch {
    return null;
  }
}

export const currentUser = writable<CurrentUser | null>(readUser());

export function getToken(): string | null {
  return browser ? localStorage.getItem(TOKEN_KEY) : null;
}

export function saveAuth(accessToken: string, user: CurrentUser): void {
  if (!browser) return;
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  currentUser.set(user);
}

export function updateCurrentUser(user: CurrentUser): void {
  if (browser) localStorage.setItem(USER_KEY, JSON.stringify(user));
  currentUser.set(user);
}

export function logout(): void {
  if (browser) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
  currentUser.set(null);
}
