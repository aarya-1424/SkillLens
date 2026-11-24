import { useState } from 'react';

/**
 * One drill: the name and dose at a glance, the steps on tap.
 * `why` and `caution` come from the weekly plan.
 */
export default function DrillCard({ drill, why, caution, compact = false }) {
  const [open, setOpen] = useState(false);
  const dose = drill.reps === 'check' ? 'One-time check' : `${drill.sets > 1 ? `${drill.sets} × ` : ''}${drill.reps}`;

  return (
    <div className={`rounded-2xl border ${caution ? 'border-amber/40 bg-amber/5' : 'border-line bg-canvas'} ${compact ? 'px-4 py-3' : 'px-5 py-4'}`}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="w-full flex items-start justify-between gap-3 text-left">
        <span className="min-w-0">
          <span className="block font-semibold text-sm">{drill.name}</span>
          <span className="block text-xs text-ink-soft mt-0.5">
            {dose}{/minute/.test(drill.reps) ? '' : ` · about ${drill.minutes} min`}{drill.equipment && drill.equipment !== 'Nothing' ? ` · ${drill.equipment}` : ''}
          </span>
          {why && <span className="block text-xs text-ink mt-1">{why}</span>}
        </span>
        <span className="shrink-0 text-xs font-semibold px-3 py-1 rounded-full bg-paper border border-line">
          {open ? 'Hide' : 'How'}
        </span>
      </button>

      {caution && <p className="text-xs font-semibold text-amber-800 mt-2">{caution}</p>}

      {open && (
        <div className="mt-3 pt-3 border-t border-line">
          <p className="text-sm text-ink-soft mb-3">{drill.purpose}</p>
          <ol className="space-y-2">
            {drill.steps.map((s, i) => (
              <li key={s} className="flex gap-3 text-sm">
                <span className="w-5 h-5 shrink-0 rounded-full bg-ink text-white text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                <span className="leading-relaxed">{s}</span>
              </li>
            ))}
          </ol>
          {drill.safety && <p className="text-xs mt-3 px-3 py-2 rounded-xl bg-sand"><strong>Safety:</strong> {drill.safety}</p>}
          {drill.verified === false && <p className="text-[11px] text-ink-soft mt-2">A coach has not checked this drill yet. Use it as a guide.</p>}
        </div>
      )}
    </div>
  );
}

/** The drills under one check in a report. */
export function DrillList({ drills }) {
  if (!drills?.length) return null;
  return (
    <div className="mt-3 space-y-2">
      <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-ink-soft">Exercises that fix this</p>
      {drills.map((d) => <DrillCard key={d.id} drill={d} compact />)}
    </div>
  );
}
