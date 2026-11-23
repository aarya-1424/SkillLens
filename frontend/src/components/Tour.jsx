import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { guestAllowed, signOut } from '../services/auth';
import { clearGuestProfile } from '../services/profile';
import { loadTour } from '../services/tour';

/** A button that opens the tour straight away: no sign-in, nothing saved. */
export function TourButton({ className, children = 'Take the tour' }) {
  const { startGuest } = useAuth();
  const navigate = useNavigate();
  if (!guestAllowed) return null;
  return (
    <button type="button" className={className} onClick={() => { startGuest(); navigate('/app'); }}>
      {children}
    </button>
  );
}

/** Shown on every screen during the tour, so nobody mistakes it for their own account. */
export function TourBanner() {
  const { guest, endGuest } = useAuth();
  const navigate = useNavigate();
  if (!guest) return null;
  const leave = async () => {
    await signOut();
    clearGuestProfile();
    endGuest();
    navigate('/login');
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 no-print">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 rounded-3xl glass text-sm">
        <span>
          <strong>You are taking the tour.</strong> This is an example athlete, Aarav, with six weeks of history made by the
          real SkillLens engine. Look around freely: nothing here is saved, and you can try your own video too.
        </span>
        <span className="flex gap-2 shrink-0">
          <Link to="/app/analyze" className="px-4 py-2 rounded-full bg-brand text-white text-[13px] font-semibold">Try my own video</Link>
          <button type="button" onClick={leave} className="px-4 py-2 rounded-full border border-line bg-paper text-[13px] font-semibold">Sign in instead</button>
        </span>
      </div>
    </div>
  );
}

const STOPS = [
  { to: '/app/reports', label: 'Open a report', hint: 'Score, injury risk, every check and the drills that fix it' },
  { to: '/app/progress', label: 'See the progress', hint: '53 → 79 over six weeks, check by check' },
  { to: '/app/plan', label: 'Look at the weekly plan', hint: 'Built from the report and the athlete’s answers' },
  { to: '/app/compare', label: 'Compare then vs now', hint: 'First smash against the latest, check by check', compare: true },
  { to: '/app/teams', label: 'See the coach view', hint: 'A sample squad: who is improving, who needs help' },
  { to: '/app/analyze', label: 'Try your own video', hint: 'Runs on your device; nothing is saved' },
];

/** The tour's "where to look" list, on the dashboard. */
export function TourChecklist() {
  const { guest } = useAuth();
  const [compare, setCompare] = useState('/app/reports');
  useEffect(() => {
    if (!guest) return;
    loadTour().then((t) => {
      const smash = t.analyses.filter((a) => a.movement_slug === t.analyses[0].movement_slug);
      if (smash.length > 1) setCompare(`/app/compare?a=${smash[0].id}&b=${smash[smash.length - 1].id}`);
    }).catch(() => {});
  }, [guest]);
  if (!guest) return null;
  return (
    <section className="mb-3 p-7 rounded-[2rem] bg-paper border border-line">
      <p className="eyebrow mb-2">The tour</p>
      <h2 className="font-display text-xl mb-4">Six things to look at</h2>
      <ol className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {STOPS.map((s, i) => (
          <li key={s.label}>
            <Link to={s.compare ? compare : s.to}
              className="flex gap-3 p-4 rounded-3xl bg-canvas/60 hover:bg-sand transition h-full">
              <span className="w-7 h-7 shrink-0 rounded-full bg-ink text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
              <span>
                <span className="block font-semibold text-sm">{s.label}</span>
                <span className="block text-xs text-ink-soft mt-0.5">{s.hint}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
