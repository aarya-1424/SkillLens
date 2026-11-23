import { useEffect, useState } from 'react';
import DrillCard from './DrillCard';
import { shortDate } from './Bits';
import { useAuth } from '../context/AuthContext';
import { markAssignment, myAssignments } from '../services/teams';

/** Drills your coach set for you (or your whole team), with a tick box each. */
export default function CoachDrills() {
  const { guest } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    myAssignments().then(setItems).catch(() => {});
  }, [guest]);

  if (!items.length) return null;
  const toggle = async (a) => {
    await markAssignment(a.id, !a.done);
    setItems((list) => list.map((x) => (x.id === a.id ? { ...x, done: !a.done } : x)));
  };
  const left = items.filter((a) => !a.done).length;

  return (
    <section className="mb-3 p-7 sm:p-8 rounded-[2rem] bg-stage stage-grid text-white relative overflow-hidden">
      <div className="pointer-events-none absolute -top-20 -right-16 w-56 h-56 rounded-full bg-brand/30 blur-3xl" />
      <p className="relative eyebrow mb-1">From your coach</p>
      <h2 className="relative font-display text-xl sm:text-2xl mb-1">{left ? `${left} drill${left === 1 ? '' : 's'} to do` : 'All done'}</h2>
      <p className="relative text-sm text-white/60 mb-5">Tick each one when you have done it. Your coach sees the ticks.</p>
      <div className="relative space-y-2 text-ink">
        {items.map((a) => (
          <div key={a.id} className={`flex items-start gap-3 ${a.done ? 'opacity-60' : ''}`}>
            <button type="button" onClick={() => toggle(a)} role="checkbox" aria-checked={a.done}
              aria-label={`Mark ${a.drill?.name} as done`}
              className={`mt-3 w-7 h-7 shrink-0 rounded-full border-2 flex items-center justify-center text-xs font-bold ${a.done ? 'bg-mint border-mint text-white' : 'border-white/40 text-transparent'}`}>
              ✓
            </button>
            <div className="flex-1 min-w-0">
              {a.drill && (
                <DrillCard drill={a.drill}
                  why={[a.team, a.due_date ? `by ${shortDate(a.due_date)}` : null, a.note ? `“${a.note}”` : null].filter(Boolean).join(' · ')} />
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
