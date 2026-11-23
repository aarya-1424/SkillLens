import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DrillCard from './DrillCard';
import { useAuth } from '../context/AuthContext';
import { getInsights } from '../services/history';

const LOOK = {
  slipping: { box: 'bg-alert/5 border-alert/30', tag: 'bg-alert/15 text-red-800', label: 'Score dropping' },
  plateau: { box: 'bg-amber/10 border-amber/40', tag: 'bg-amber/20 text-amber-800', label: 'Stuck' },
  improving: { box: 'bg-mint/10 border-mint/30', tag: 'bg-mint/15 text-emerald-800', label: 'Improving' },
};

/**
 * Plateau / slipping / improving alerts from the player's own reports.
 * `movement` limits it to one movement (Progress page); `limit` caps how many.
 */
export default function Insights({ movement, limit = 3, reloadKey }) {
  const { guest } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (guest) return undefined;
    let alive = true;
    getInsights().then((list) => alive && setItems(list || []));
    return () => { alive = false; };
  }, [guest, reloadKey]);

  const shown = items.filter((i) => !movement || i.movement_slug === movement).slice(0, limit);
  if (!shown.length) return null;

  return (
    <div className="space-y-3 mb-3">
      {shown.map((i) => {
        const look = LOOK[i.kind];
        return (
          <section key={i.movement_slug} className={`p-6 sm:p-7 rounded-[2rem] border ${look.box}`}>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${look.tag}`}>{look.label}</span>
              <span className="text-sm font-semibold">{i.sport} · {i.movement}</span>
              <span className="text-xs text-ink-soft tabular-nums">Last {i.scores.length}: {i.scores.map((s) => Math.round(s)).join(' → ')}</span>
            </div>
            <p className="text-sm leading-relaxed">{i.message}</p>
            {i.stuck?.drills?.length > 0 && (
              <div className="mt-4 grid md:grid-cols-2 gap-2">
                {i.stuck.drills.map((d) => <DrillCard key={d.id} drill={d} compact />)}
              </div>
            )}
            <Link to={`/app/progress`} className="inline-block mt-3 text-xs font-semibold text-brand hover:text-brand-deep">See your progress →</Link>
          </section>
        );
      })}
    </div>
  );
}
