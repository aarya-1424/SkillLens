/**
 * services/auth.js — sign in / sign out, plus the guest "explore the demo" mode.
 */
import { supabase, supabaseConfigured } from './supabaseClient';

const GUEST_KEY = 'skilllens.guest';
export const guestAllowed = import.meta.env.VITE_ALLOW_GUEST === '1';

export { supabaseConfigured };

export async function signInWithGoogle() {
  if (!supabaseConfigured) throw new Error('Sign-in is not configured yet.');
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
  if (error) throw error;
}

export async function signOut() {
  setGuest(false);
  if (supabaseConfigured) await supabase.auth.signOut();
}

export async function getSession() {
  if (!supabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthChange(callback) {
  if (!supabaseConfigured) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

export function isGuest() {
  try {
    return guestAllowed && localStorage.getItem(GUEST_KEY) === '1';
  } catch {
    return false;
  }
}

export function setGuest(on) {
  try {
    if (on) localStorage.setItem(GUEST_KEY, '1');
    else localStorage.removeItem(GUEST_KEY);
  } catch {
    /* storage blocked — guest mode just won't persist */
  }
}
