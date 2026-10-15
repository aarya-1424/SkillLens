import { createContext, useContext, useEffect, useState } from 'react';
import { getSession, onAuthChange, isGuest, setGuest } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [guest, setGuestState] = useState(isGuest());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getSession().then((s) => {
      if (alive) {
        setSession(s);
        setLoading(false);
      }
    });
    const unsubscribe = onAuthChange((s) => setSession(s));
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  const startGuest = () => {
    setGuest(true);
    setGuestState(true);
  };
  const endGuest = () => {
    setGuest(false);
    setGuestState(false);
  };

  const user = session?.user ?? null;
  const value = {
    session,
    user,
    guest,
    loading,
    signedIn: Boolean(user) || guest,
    displayName: user?.user_metadata?.full_name || user?.email || (guest ? 'Guest' : ''),
    avatarUrl: user?.user_metadata?.avatar_url || null,
    startGuest,
    endGuest,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
