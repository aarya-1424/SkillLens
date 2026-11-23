import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { getPlan } from '../services/history';

/** "Today: Technique, 45 min" on the dashboard, linking to the full week. */
export default function TodayPlan({ reloadKey }) {
  const { guest } = useAuth();
  const { profile } = useProfile();
  const [today, setToday] = useState(null);

  useEffect(() => {
    if (!profile) return undefined;
    let alive = true;
    getPlan().then((p) => alive && setToday(p.days[0])).catch(() => {});
    return () => { alive = false; };
  }, [guest, profile, reloadKey]);

  if (!today) return null;
  const rest = today.kind === 'rest';
  return (
    <Link to="/app/plan"
      className="mb-3 flex items-center justify-between gap-4 p-6 rounded-[2rem] bg-paper border border-line hover:border-ink/30 transition">
      <span>
        <span className="eyebrow block mb-1">Today's training</span>
        <span className="font-display text-lg">{today.title}</span>
        <span className="block text-sm text-ink-soft mt-1">
          {rest ? 'Rest lets your body adapt. See the rest of your week.' : `About ${today.minutes} minutes · ${today.items.length} parts`}
        </span>
      </span>
      <span className="shrink-0 px-5 py-2.5 rounded-full bg-ink text-white text-sm font-semibold">Open plan →</span>
    </Link>
  );
}
