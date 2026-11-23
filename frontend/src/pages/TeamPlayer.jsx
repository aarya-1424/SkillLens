import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ProgressChart from '../components/ProgressChart';
import { ConfirmButton, LABEL, RiskChip, scoreColour, shortDate } from '../components/Bits';
import { getPlayer, removePlayer } from '../services/teams';

/** A coach's view of one player: who they are, how they're trending, every report. */
export default function TeamPlayer() {
  const { teamId, athleteId } = useParams();
  const navigate = useNavigate();
  const [p, setP] = useState(null);
  const [error, setError] = useState('');
  const [slug, setSlug] = useState(null);

  useEffect(() => {
    getPlayer(teamId, athleteId).then((d) => { setP(d); setSlug(d.history[0]?.movement_slug ?? null); })
      .catch(() => setError('This player is not in your team any more.'));
  }, [teamId, athleteId]);

  const movements = useMemo(() => {
    const seen = new Map();
    for (const r of p?.history || []) if (!seen.has(r.movement_slug)) seen.set(r.movement_slug, `${r.sport} · ${r.movement_name}`);
    return [...seen.entries()];
  }, [p]);
  const points = useMemo(() => (p?.history || []).filter((r) => r.movement_slug === slug)
    .map((r) => ({ date: r.created_at, total: r.total })).reverse(), [p, slug]);

  if (error) return <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8"><p>{error}</p><Link to={`/app/teams/${teamId}`} className="underline">Back to the team</Link></main>;
  if (!p) return <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-ink-soft">Loading…</main>;

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <Link to={`/app/teams/${teamId}`} className="text-sm font-semibold text-ink-soft hover:text-ink">← Squad</Link>
      <h1 className="font-display text-3xl sm:text-[2.6rem] mt-4 mb-1">{p.name}</h1>
      <p className="text-ink-soft mb-6">{[p.age_group, p.level, p.role].filter(Boolean).join(' · ')}</p>

      <div className="grid sm:grid-cols-4 gap-3 mb-3">
        {[
          ['Latest score', p.latest_total != null ? Math.round(p.latest_total) : '—'],
          ['Change', p.change_since_last != null ? `${p.change_since_last > 0 ? '▲' : p.change_since_last < 0 ? '▼' : ''} ${Math.abs(p.change_since_last)}` : '—'],
          ['Reports', p.reports],
          ['Last video', p.last_active ? shortDate(p.last_active) : '—'],
        ].map(([k, v]) => (
          <div key={k} className="p-6 rounded-[1.75rem] bg-paper border border-line">
            <div className={`${LABEL} text-ink-soft`}>{k}</div>
            <div className="font-display text-2xl mt-2">{v}</div>
          </div>
        ))}
      </div>

      {(p.sore_areas.length > 0 || p.injury_risk === 'High') && (
        <p className="mb-3 px-5 py-3 rounded-3xl bg-amber/15 border border-amber/40 text-sm">
          {p.sore_areas.length > 0 && <><strong>Sore right now:</strong> {p.sore_areas.join(', ')}. </>}
          {p.injury_risk === 'High' && <><strong>Latest injury risk is high.</strong> Go easy on load until the technique improves.</>}
        </p>
      )}

      {movements.length > 0 && (
        <section className="mb-3 p-7 sm:p-8 rounded-[2rem] bg-paper border border-line">
          <div className="flex flex-wrap gap-2 mb-4">
            {movements.map(([s, label]) => (
              <button key={s} type="button" onClick={() => setSlug(s)} aria-pressed={slug === s}
                className={`px-4 py-2 rounded-full border text-[13px] font-semibold ${slug === s ? 'bg-ink text-white border-ink' : 'bg-paper border-line'}`}>{label}</button>
            ))}
          </div>
          <ProgressChart points={points} movementName="this movement" />
        </section>
      )}

      <section className="mb-3 p-7 sm:p-8 rounded-[2rem] bg-paper border border-line">
        <p className="eyebrow mb-4">Reports</p>
        {p.history.length === 0 && <p className="text-sm text-ink-soft">No videos yet.</p>}
        <div className="space-y-2">
          {p.history.map((r) => (
            <Link key={r.id} to={`/app/teams/${teamId}/players/${athleteId}/reports/${r.id}`}
              className="flex items-center gap-4 p-4 rounded-3xl bg-canvas hover:bg-sand transition">
              <span className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center font-display text-xs text-white" style={{ background: scoreColour(r.total) }}>{Math.round(r.total)}</span>
              <span className="flex-1 min-w-0">
                <span className="block font-semibold text-sm truncate">{r.sport} · {r.movement_name}</span>
                <span className="block text-xs text-ink-soft">{shortDate(r.created_at)} · {r.grade}{r.is_sample ? ' · Sample' : ''}</span>
              </span>
              <RiskChip risk={r.injury_risk} />
            </Link>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <ConfirmButton label="Remove from team" question={`Remove ${p.name}? You stop seeing their reports.`} confirmLabel="Remove"
          onConfirm={async () => { await removePlayer(teamId, athleteId); navigate(`/app/teams/${teamId}`, { replace: true }); }} />
      </div>
    </main>
  );
}
