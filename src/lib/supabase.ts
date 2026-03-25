import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const REMEMBER_ME_KEY = 'gymplus_remember_me';

export function getRememberMe(): boolean {
  return localStorage.getItem(REMEMBER_ME_KEY) === 'true';
}

export function setRememberMe(value: boolean) {
  if (value) {
    localStorage.setItem(REMEMBER_ME_KEY, 'true');
  } else {
    localStorage.removeItem(REMEMBER_ME_KEY);
  }
}

/**
 * Custom storage that delegates to localStorage (persistent) or sessionStorage (temporary)
 * based on the "remember me" flag.
 *
 * On write: always write to the active storage (and clear the other one).
 * On read: check active storage first, fall back to the other.
 */
const customStorage = {
  getItem(key: string): string | null {
    if (getRememberMe()) {
      return localStorage.getItem(key) ?? sessionStorage.getItem(key);
    }
    return sessionStorage.getItem(key) ?? localStorage.getItem(key);
  },
  setItem(key: string, value: string): void {
    if (getRememberMe()) {
      localStorage.setItem(key, value);
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, value);
      localStorage.removeItem(key);
    }
  },
  removeItem(key: string): void {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

// Create dummy client if env vars are missing so the app doesn't immediately crash during dev before they are filled over
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key',
  {
    auth: {
      storage: customStorage,
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);
