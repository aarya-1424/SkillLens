import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LABEL, PageHeader, RiskChip, ScoreRing, scoreColour, shortDate } from '../components/Bits';
import { getAnalysis } from '../services/history';

function Change({ value, unit = '' }) {
  if (value == null) return <span className="text-xs text-ink-soft">new</span>;
  if (Math.abs(value) < 0.5) return <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-sand text-ink-soft">Same</span>;
  const up = value > 0;
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full tabular-nums ${up ? 'bg-mint/15 text-emerald-800' : 'bg-alert/15 text-red-800'}`}>
      {up ? '▲' : '▼'} {Math.abs(Math.round(value))}{unit}
    </span>
  );
}

/** Two reports side by side: "then" (older) and "now" (newer). */
export default function Compare() {
  const [params] = useSearchParams();
  const [pair, setPair] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const a = params.get('a');
    const b = params.get('b');
    if (!a || !b) { setError('Choose two reports to compare.'); return; }
    Promise.all([getAnalysis(a), getAnalysis(b)]).then(([x, y]) => {
      if (!x || !y) { setError('One of those reports could not be found.'); return; }
      setPair(new Date(x.created_at) <= new Date(y.created_at) ? [x, y] : [y, x]);
    }).catch(() => setError('Could not load the reports just now.'));
  }, [params]);

  const rows = useMemo(() => {
    if (!pair) return [];
    const [then, now] = pair;
    const before = Object.fromEntries(then.results.map((r) => [r.id, r]));
    return now.results.map((r) => ({ name: r.name, then: before[r.id], now: r, change: before[r.id] ? r.score - before[r.id].score : null }))
      .sort((p, q) => (q.change ?? -999) - (p.change ?? -999));
  }, [pair]);

  if (error) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <PageHeader eyebrow="Compare" title={<>Then <em>vs now</em></>}>{error}</PageHeader>
        <Link to="/app/reports" className="px-6 py-3 rounded-full bg-ink text-white font-semibold">Go to my reports</Link>
      </main>
    );
  }
  if (!pair) return <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-ink-soft">Loading…</main>;

  const [then, now] = pair;
  const sameMovement = then.movement_slug === now.movement_slug;
  const gains = rows.filter((r) => (r.change ?? 0) >= 5).slice(0, 3);
  const slips = rows.filter((r) => (r.change ?? 0) <= -5).reverse().slice(0, 3);
  const days = Math.round((new Date(now.created_at) - new Date(then.created_at)) / 86_400_000);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <PageHeader eyebrow={`Compare · ${now.sport} · ${now.movement_name}`} title={<>Then <em>vs now</em></>}>
        {days > 0 ? `${days} day${days === 1 ? '' : 's'} apart.` : 'Same day.'} Both scored by the same rules, so the change is real.
      </PageHeader>

      {!sameMovement && (
        <p className="mb-3 px-5 py-3 rounded-3xl bg-amber/15 border border-amber/40 text-sm">
          These are different movements, so only the overall scores can be compared fairly.
        </p>
      )}

      <div className="grid sm:grid-cols-[1fr_auto_1fr] gap-3 items-stretch mb-3">
        {[['Then', then], null, ['Now', now]].map((side, i) => (side ? (
          <Link key={side[0]} to={`/app/reports/${side[1].id}`}
            className={`p-7 rounded-[2rem] flex items-center gap-5 ${i === 2 ? 'bg-stage stage-grid text-white' : 'bg-paper border border-line'}`}>
            <ScoreRing value={side[1].total} size="w-28 h-28" dark={i === 2} />
            <span>
              <span className={`${LABEL} ${i === 2 ? 'text-white/50' : 'text-ink-soft'}`}>{side[0]}</span>
              <span className="block font-display text-lg mt-1">{shortDate(side[1].created_at)}</span>
              <span className="block text-sm mt-1 opacity-70">{side[1].grade}</span>
              <span className="block mt-2"><RiskChip risk={side[1].injury_risk} dark={i === 2} /></span>
            </span>
          </Link>
        ) : (
          <div key="mid" className="flex sm:flex-col items-center justify-center gap-2 px-2">
            <span className="font-display text-2xl">{now.total - then.total >= 0 ? '+' : '−'}{Math.abs(Math.round(now.total - then.total))}</span>
            <span className="text-xs text-ink-soft">points</span>
          </div>
        )))}
      </div>

      {sameMovement && (
        <>
          <div className="grid md:grid-cols-2 gap-3 mb-3">
            <section className="p-7 rounded-[2rem] bg-mint/10 border border-mint/30">
              <p className={`${LABEL} text-emerald-700 mb-3`}>Most improved</p>
              {gains.length ? gains.map((r) => (
                <p key={r.name} className="flex justify-between gap-3 text-sm py-1">
                  <span><strong>{r.name}</strong>: {r.then.value_label} → {r.now.value_label}</span><Change value={r.change} />
                </p>
              )) : <p className="text-sm text-ink-soft">Nothing improved by 5 points or more yet.</p>}
            </section>
            <section className="p-7 rounded-[2rem] bg-alert/5 border border-alert/25">
              <p className={`${LABEL} text-red-700 mb-3`}>Got worse</p>
              {slips.length ? slips.map((r) => (
                <p key={r.name} className="flex justify-between gap-3 text-sm py-1">
                  <span><strong>{r.name}</strong>: {r.then.value_label} → {r.now.value_label}</span><Change value={r.change} />
                </p>
              )) : <p className="text-sm text-ink-soft">Nothing got worse by 5 points or more.</p>}
            </section>
          </div>

          <section className="p-7 sm:p-8 rounded-[2rem] bg-paper border border-line">
            <p className="eyebrow mb-4">Every check</p>
            <div className="divide-y divide-line">
              <div className="hidden sm:grid grid-cols-[1fr_8rem_8rem_5rem] gap-3 pb-2 text-[11px] font-bold tracking-[0.12em] uppercase text-ink-soft">
                <span>Check</span><span>Then</span><span>Now</span><span className="text-right">Score</span>
              </div>
              {rows.map((r) => (
                <div key={r.name} className="grid grid-cols-2 sm:grid-cols-[1fr_8rem_8rem_5rem] gap-x-3 gap-y-1 py-3 items-center text-sm">
                  <span className="col-span-2 sm:col-span-1 font-semibold">{r.name}<span className="block text-[11px] font-normal text-ink-soft">Aim for {r.now.target_label}</span></span>
                  <span className="tabular-nums text-ink-soft">{r.then ? r.then.value_label : '—'} <span className="text-[11px]">({r.then ? Math.round(r.then.score) : '–'})</span></span>
                  <span className="tabular-nums" style={{ color: scoreColour(r.now.score) }}>{r.now.value_label} <span className="text-[11px] text-ink-soft">({Math.round(r.now.score)})</span></span>
                  <span className="sm:text-right"><Change value={r.change} /></span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
