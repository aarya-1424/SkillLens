import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { guestAllowed, signInWithGoogle, supabaseConfigured } from '../services/auth';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

export default function Login() {
  const { signedIn, loading, startGuest } = useAuth();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const from = useLocation().state?.from || '/app';

  if (!loading && signedIn) return <Navigate to={from} replace />;

  const handleGoogle = async () => {
    setError('');
    setBusy(true);
    try {
      await signInWithGoogle(); // browser leaves for Google here
    } catch (e) {
      setError(e.message || 'Could not start Google sign-in.');
      setBusy(false);
    }
  };

  const handleGuest = () => {
    startGuest();
    navigate('/app', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-950">
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-blue-500/15 blur-3xl glow" />
      <div className="relative w-full max-w-sm p-8 rounded-2xl bg-gray-900/70 border border-white/10 shadow-2xl fade-up">
        <div className="flex justify-center mb-6"><Logo size="lg" /></div>
        <h1 className="text-xl font-semibold text-center mb-1">Welcome</h1>
        <p className="text-sm text-gray-400 text-center mb-8">Sign in to save your videos and track your progress.</p>

        <button
          onClick={handleGoogle}
          disabled={busy || !supabaseConfigured}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white text-gray-900 font-semibold hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GoogleIcon />
          {busy ? 'Opening Google…' : 'Continue with Google'}
        </button>

        {!supabaseConfigured && (
          <p className="mt-3 text-xs text-yellow-300 text-center">Google sign-in is being set up.</p>
        )}
        {error && <p className="mt-3 text-sm text-red-400 text-center">{error}</p>}

        {guestAllowed && (
          <>
            <div className="flex items-center gap-3 my-6 text-xs text-gray-500">
              <div className="flex-1 h-px bg-white/10" /> or <div className="flex-1 h-px bg-white/10" />
            </div>
            <button onClick={handleGuest} className="w-full px-4 py-3 rounded-xl border border-white/15 font-semibold hover:bg-white/5 transition">
              Explore the demo
            </button>
            <p className="mt-2 text-xs text-gray-500 text-center">Demo mode doesn't save anything.</p>
          </>
        )}
      </div>
    </div>
  );
}
