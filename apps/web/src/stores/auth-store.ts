"use client";

import { create } from "zustand";

export type AuthUser = {
  name: string;
  email: string;
};

type StoredAccount = AuthUser & { password: string };

type AuthState = {
  user: AuthUser | null;
  hydrated: boolean;
  hydrate: () => void;
  login: (email: string, password: string) => { ok: true } | { ok: false; error: string };
  signup: (
    name: string,
    email: string,
    password: string
  ) => { ok: true } | { ok: false; error: string };
  logout: () => void;
};

const SESSION_KEY = "opspilot.session";
const ACCOUNTS_KEY = "opspilot.accounts";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  hydrate: () => {
    set({
      user: readJson<AuthUser | null>(SESSION_KEY, null),
      hydrated: true,
    });
  },
  login: (email, password) => {
    const accounts = readJson<StoredAccount[]>(ACCOUNTS_KEY, []);
    const match = accounts.find(
      (account) =>
        account.email === normalizeEmail(email) && account.password === password
    );
    if (!match) {
      return { ok: false, error: "Email or password does not match an account on this browser." };
    }
    const user = { name: match.name, email: match.email };
    writeJson(SESSION_KEY, user);
    set({ user });
    return { ok: true };
  },
  signup: (name, email, password) => {
    const accounts = readJson<StoredAccount[]>(ACCOUNTS_KEY, []);
    const normalized = normalizeEmail(email);
    if (accounts.some((account) => account.email === normalized)) {
      return { ok: false, error: "An account with that email already exists. Sign in instead." };
    }
    const user = { name: name.trim(), email: normalized };
    writeJson(ACCOUNTS_KEY, [...accounts, { ...user, password }]);
    writeJson(SESSION_KEY, user);
    set({ user });
    return { ok: true };
  },
  logout: () => {
    window.localStorage.removeItem(SESSION_KEY);
    set({ user: null });
  },
}));
