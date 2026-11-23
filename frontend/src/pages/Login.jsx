import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import HeroVisual from '../components/landing/HeroVisual';
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

const POINTS = ['10 sports, 65 technique checks', 'A score, your mistakes and the drills that fix them', 'No sensors. Just your phone camera'];

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
    <div className="min-h-screen text-ink p-3 sm:p-4 grid lg:grid-cols-2 gap-3">
      {/* Left: the dark stage */}
      <div className="hidden lg:flex relative overflow-hidden rounded-[2.2rem] bg-stage stage-grid text-white p-10 flex-col justify-between">
        <div className="pointer-events-none absolute -bottom-40 -left-32 w-[32rem] h-[32rem] rounded-full bg-brand/30 blur-3xl glow" />
        <div className="relative"><Logo tone="dark" /></div>
        <div className="absolute inset-x-0 top-20 bottom-64">
          <HeroVisual bare />
        </div>
        <div className="relative">
          <h2 className="font-display text-[2.4rem] leading-[1.02]">Every joint.<br /><em>Every rep.</em></h2>
          <ul className="mt-6 space-y-2.5">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-3 text-sm text-white/70">
                <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />{p}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right: sign in */}
      <div className="relative flex flex-col items-center justify-center px-4 py-16">
        <Link to="/" className="absolute top-4 left-4 px-4 py-2 rounded-full border border-line bg-paper text-[13px] font-semibold text-ink-soft hover:text-ink transition">← Back</Link>

        <div className="w-full max-w-sm fade-up">
          <div className="lg:hidden mb-8"><Logo size="lg" /></div>
          <p className="eyebrow mb-3">Sign in</p>
          <h1 className="font-display text-3xl sm:text-[2.6rem] leading-[1.02] mb-3">Welcome <em>back</em></h1>
          <p className="text-ink-soft mb-9">Sign in to save your videos and track your progress.</p>

          <button
            onClick={handleGoogle}
            disabled={busy || !supabaseConfigured}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-full bg-ink text-white font-semibold hover:bg-brand transition shadow-xl shadow-black/15 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <button onClick={handleGuest} className="w-full px-4 py-3.5 rounded-full border border-line bg-paper font-semibold hover:border-ink/40 transition">
                Explore the demo
              </button>
              <p className="mt-3 text-xs text-ink-soft text-center">Demo mode doesn't save anything.</p>
            </>
          )}
          <p className="mt-10 text-xs text-ink-soft text-center leading-relaxed">
            Before you start, we ask you to agree to our{' '}
            <Link to="/terms" className="font-semibold underline">Terms</Link> and{' '}
            <Link to="/privacy" className="font-semibold underline">Privacy Policy</Link>.
            Coaching guidance, not medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}
