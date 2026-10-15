import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Google sends the user back here; the Supabase client turns the code into a session. */
export default function AuthCallback() {
  const { signedIn, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return undefined;
    if (signedIn) {
      navigate('/app', { replace: true });
      return undefined;
    }
    // Give the code exchange a moment before giving up.
    const t = setTimeout(() => navigate('/login', { replace: true }), 6000);
    return () => clearTimeout(t);
  }, [signedIn, loading, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-teal-400 border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400">Signing you in…</p>
    </div>
  );
}
