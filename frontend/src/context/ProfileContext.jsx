import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { getProfile } from '../services/profile';

const ProfileContext = createContext(null);

/**
 * Loads the athlete's questionnaire answers once they are signed in.
 *
 * status: 'idle' (not signed in) | 'loading' | 'ready' (profile may be null,
 * meaning "not filled in yet") | 'error' (server unreachable — we let the
 * person carry on rather than lock them out).
 */
export function ProfileProvider({ children }) {
  const { signedIn, guest, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState('idle');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      setProfile(await getProfile());
      setStatus('ready');
    } catch {
      setProfile(null);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!signedIn) { setProfile(null); setStatus('idle'); return; }
    load();
  }, [signedIn, guest, user?.id, load]);

  return (
    <ProfileContext.Provider value={{ profile, status, setProfile, reload: load }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside <ProfileProvider>');
  return ctx;
}
