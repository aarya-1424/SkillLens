import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
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
      await signInWithGoogle(); // the browser leaves for Google here
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
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-b from-sky to-canvas text-ink overflow-hidden">
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-brand/20 blur-3xl glow" />
      <div className="pointer-events-none absolute bottom-0 right-[-10%] w-[500px] h-[500px] rounded-full bg-accent/20 blur-3xl" />
      <Link to="/" className="absolute top-6 left-6 text-sm text-ink-soft hover:text-ink">← Back</Link>

      <div className="relative w-full max-w-sm p-8 rounded-3xl bg-white border border-line shadow-[0_30px_80px_-40px_rgba(11,31,75,0.35)] fade-up">
        <div className="flex justify-center mb-6"><Logo size="lg" /></div>
        <h1 className="font-serif text-3xl text-center mb-1">Welcome back</h1>
        <p className="text-sm text-ink-soft text-center mb-8">Sign in to save your videos and track your progress.</p>

        <button
          onClick={handleGoogle}
          disabled={busy || !supabaseConfigured}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-full bg-brand text-white font-medium hover:bg-brand-deep transition shadow-md shadow-brand/25 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="bg-white rounded-full p-1"><GoogleIcon /></span>
          {busy ? 'Opening Google…' : 'Continue with Google'}
        </button>

        {!supabaseConfigured && <p className="mt-3 text-xs text-amber-700 text-center">Google sign-in is being set up.</p>}
        {error && <p className="mt-3 text-sm text-red-600 text-center">{error}</p>}

        {guestAllowed && (
          <>
            <div className="flex items-center gap-3 my-6 text-xs text-ink-soft">
              <div className="flex-1 h-px bg-line" /> or <div className="flex-1 h-px bg-line" />
            </div>
            <button onClick={handleGuest} className="w-full px-4 py-3 rounded-full border border-line font-medium hover:border-ink/40 transition">
              Explore the demo
            </button>
            <p className="mt-2 text-xs text-ink-soft text-center">Demo mode doesn't save anything.</p>
          </>
        )}
      </div>
      <p className="relative mt-6 text-xs text-ink-soft">Coaching guidance, not medical advice.</p>
    </div>
  );
}
