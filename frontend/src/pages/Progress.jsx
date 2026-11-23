import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import ProgressChart from '../components/ProgressChart';
import Insights from '../components/Insights';
import { EmptyState, LABEL, PageHeader, scoreColour } from '../components/Bits';
import { SPORTS } from '../data/landing';
import { getCheckTrends, getProgress, listAnalyses } from '../services/history';

/** A tiny line of one check's scores, oldest to newest. */
function Spark({ points }) {
  if (points.length < 2) return <span className="text-[11px] text-ink-soft">One report so far</span>;
  const w = 120;
  const h = 32;
  const step = w / (points.length - 1);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${(i * step).toFixed(1)},${(h - (p.score / 100) * h).toFixed(1)}`).join(' ');
  const last = points[points.length - 1];
  return (
    <svg viewBox={`-3 -3 ${w + 6} ${h + 6}`} className="w-32 h-9" aria-hidden="true">
      <path d={path} fill="none" stroke="#141414" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={w} cy={h - (last.score / 100) * h} r="3.5" fill={scoreColour(last.score)} />
    </svg>
  );
}

export default function Progress() {
  const { guest } = useAuth();
  const { profile } = useProfile();
  const [rows, setRows] = useState(null);
  const [movement, setMovement] = useState(null);
  const [points, setPoints] = useState([]);
  const [checks, setChecks] = useState([]);

  useEffect(() => {
    let alive = true;
    listAnalyses('?limit=200').then((list) => alive && setRows(list || [])).catch(() => alive && setRows([]));
    return () => { alive = false; };
  }, []);

  const sportsUsed = useMemo(() => {
    const counts = {};
    for (const r of rows || []) counts[r.movement_slug] = (counts[r.movement_slug] || 0) + 1;
    return SPORTS.filter((s) => counts[s.slug]).map((s) => ({ ...s, count: counts[s.slug] }));
  }, [rows]);

  // Start on their main sport if they have reports for it, else the most recent.
  useEffect(() => {
    if (movement || !sportsUsed.length) return;
    const mine = sportsUsed.find((s) => s.slug === profile?.sport_slug);
    setMovement(mine?.slug || rows[0].movement_slug);
  }, [sportsUsed, movement, profile, rows]);

  useEffect(() => {
    if (!movement) return undefined;
    let alive = true;
    Promise.all([getProgress(movement), getCheckTrends(movement)]).then(([p, c]) => {
      if (!alive) return;
      setPoints(p || []);
      setChecks(c || []);
    });
    return () => { alive = false; };
  }, [movement]);

  const sport = SPORTS.find((s) => s.slug === movement);
  const weakest = checks[0];
  // Prefer a different check from "work on next", so the two cards never repeat.
  const moved = checks.filter((c) => c.change != null && c.change > 0)
    .sort((a, b) => b.change - a.change);
  const best = moved.find((c) => c.metric_id !== weakest?.metric_id) || moved[0];

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <PageHeader eyebrow="Progress" title={<>Are you <em>getting better?</em></>}>
        Built only from the reports you have saved. Record the same movement again to add a point.
      </PageHeader>

      {rows === null && <p className="text-ink-soft">Loading…</p>}
      {rows?.length === 0 && (
        guest
          ? <EmptyState title="The tour has no progress yet" text="Sign in with Google and every analysis you save becomes a point on your progress line." to="/login" cta="Sign in" />
          : <EmptyState title="No progress yet" text="Analyse a movement twice and you will see your score move here." />
      )}

      {sportsUsed.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2 mb-3">
            {sportsUsed.map((s) => (
              <button key={s.slug} type="button" onClick={() => setMovement(s.slug)} aria-pressed={movement === s.slug}
                className={`px-4 py-2 rounded-full border text-[13px] font-semibold transition ${movement === s.slug ? 'bg-ink text-white border-ink' : 'bg-paper border-line hover:border-ink/40'}`}>
                <span className="mr-1.5" aria-hidden="true">{s.icon}</span>{s.name}
                <span className={`ml-2 ${movement === s.slug ? 'text-white/60' : 'text-ink-soft'}`}>{s.count}</span>
              </button>
            ))}
          </div>

          <Insights movement={movement} limit={1} />

          <div className="grid lg:grid-cols-12 gap-3 mb-3">
            <section className="lg:col-span-8 p-7 sm:p-8 rounded-[2rem] bg-paper border border-line">
              <p className="eyebrow mb-2">Overall score</p>
              <h2 className="font-display text-xl sm:text-2xl mb-5">Your {sport?.movement || 'movement'} <em>over time</em></h2>
              <ProgressChart points={points} movementName={sport?.movement} />
            </section>
            <div className="lg:col-span-4 grid gap-3">
              <div className="p-7 rounded-[2rem] bg-stage stage-grid text-white relative overflow-hidden">
                <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-brand/30 blur-3xl" />
                <p className={`relative ${LABEL} text-white/50`}>Most improved</p>
                {best && best.change > 0 ? (
                  <>
                    <p className="relative font-display text-lg mt-3 leading-tight">{best.name}</p>
                    <p className="relative text-sm text-mint mt-2 font-semibold">▲ {best.change} points</p>
                  </>
                ) : <p className="relative text-sm text-white/60 mt-3">Record this movement again to see what moves.</p>}
              </div>
              <div className="p-7 rounded-[2rem] bg-sand">
                <p className={`${LABEL} text-ink-soft`}>Work on next</p>
                {weakest ? (
                  <>
                    <p className="font-display text-lg mt-3 leading-tight">{weakest.name}</p>
                    <p className="text-sm text-ink-soft mt-2">Latest {Math.round(weakest.latest)} / 100 · target {weakest.target_label}</p>
                  </>
                ) : <p className="text-sm text-ink-soft mt-3">—</p>}
              </div>
            </div>
          </div>

          <section className="p-7 sm:p-8 rounded-[2rem] bg-paper border border-line">
            <p className="eyebrow mb-2">Check by check</p>
            <h2 className="font-display text-xl sm:text-2xl mb-5">What is <em>moving</em></h2>
            <div className="divide-y divide-line">
              {checks.map((c) => (
                <div key={c.metric_id} className="flex flex-col sm:flex-row sm:items-center gap-3 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-xs text-ink-soft mt-0.5">Latest {c.points[c.points.length - 1].value_label} · target {c.target_label}</p>
                  </div>
                  <Spark points={c.points} />
                  <div className="flex items-center gap-2 sm:w-40 sm:justify-end">
                    <span className="font-display text-base tabular-nums">{Math.round(c.latest)}</span>
                    {c.change === 0 && <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-sand text-ink-soft">No change</span>}
                    {c.change != null && c.change !== 0 && (
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${c.change > 0 ? 'bg-mint/15 text-emerald-800' : 'bg-alert/15 text-red-800'}`}>
                        {c.change > 0 ? '▲' : '▼'} {Math.abs(c.change)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
