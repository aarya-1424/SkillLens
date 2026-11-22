/**
 * The setup questionnaire answers.
 *
 * Signed-in people: stored on our server. Demo (guest) mode: kept in this
 * browser only, so the questionnaire can be tried without an account.
 */
import { get, put } from './api';
import { isGuest } from './auth';
import { ADULT_AGE, ageFrom } from '../data/profileQuestions';

const GUEST_KEY = 'skilllens.guestProfile';

function readGuest() {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Fill in what the server would work out (age, minor, BMI) for guest answers. */
function withDerived(a) {
  const age = ageFrom(a.birth_year, a.birth_month);
  return {
    ...a,
    age,
    is_minor: age != null && age < ADULT_AGE,
    bmi: Math.round((a.weight_kg / (a.height_cm / 100) ** 2) * 10) / 10,
  };
}

/**
 * The profile, or null if it has not been filled in.
 * Throws only when the server cannot be reached, so callers can tell
 * "not set up" apart from "could not check".
 */
export async function getProfile() {
  if (isGuest()) return readGuest();
  try {
    return await get('/me/profile');
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

export async function saveProfile(answers) {
  if (isGuest()) {
    const saved = withDerived({ ...answers, updated_at: new Date().toISOString() });
    try { localStorage.setItem(GUEST_KEY, JSON.stringify(saved)); } catch { /* private mode */ }
    return saved;
  }
  return put('/me/profile', answers);
}

export function clearGuestProfile() {
  try { localStorage.removeItem(GUEST_KEY); } catch { /* ignore */ }
}
