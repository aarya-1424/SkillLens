/**
 * services/supabaseClient.js — the ONLY place the Supabase JS client is created.
 *
 * Used for sign-in (Google) only. All app data goes through our FastAPI
 * backend (services/api.js), which verifies the Supabase access token.
 */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);

export const supabase = supabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Google redirects back with ?code=…; the client exchanges it for a session.
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : null;
