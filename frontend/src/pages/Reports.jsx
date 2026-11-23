import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SPORTS } from '../data/landing';
import { deleteAnalysis, listAnalyses } from '../services/history';
import { ConfirmButton, EmptyState, PageHeader, RiskChip, scoreColour, shortDate } from '../components/Bits';

/** Every saved report, newest first, with a sport filter and delete. */
export default function Reports() {
  const { guest } = useAuth();
  const [rows, setRows] = useState(null);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [picked, setPicked] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    listAnalyses('?limit=200')
      .then((list) => alive && setRows(list || []))
      .catch(() => alive && setError('Could not load your reports just now.'));
    return () => { alive = false; };
  }, []);

  const sportsUsed = useMemo(() => {
    const slugs = new Set((rows || []).map((r) => r.movement_slug));
    return SPORTS.filter((s) => slugs.has(s.slug));
  }, [rows]);

  const shown = (rows || []).filter((r) => filter === 'all' || r.movement_slug === filter);

  const remove = async (id) => {
    await deleteAnalysis(id);
    setRows((list) => list.filter((r) => r.id !== id));
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <PageHeader eyebrow="My reports" title={<>Every <em>analysis</em></>}
        action={<Link to="/app/analyze" className="px-6 py-3 rounded-full bg-brand text-white font-semibold hover:bg-brand-deep transition shadow-lg shadow-brand/25 text-center">New analysis</Link>}>
        {rows?.length ? `${rows.length} saved report${rows.length === 1 ? '' : 's'}. Open one to see every check, or delete any you no longer want.` : 'Your saved reports live here.'}
      </PageHeader>

      {error && <div className="mb-3 px-5 py-3 rounded-3xl bg-alert/10 border border-alert/30 text-red-800 text-sm">{error}</div>}

      {rows === null && !error && <p className="text-ink-soft">Loading…</p>}

      {rows?.length === 0 && (
        guest
          ? <EmptyState title="Demo mode doesn't save reports" text="Sign in with Google to keep your reports and see your progress over time." to="/login" cta="Sign in" />
          : <EmptyState title="No reports yet" text="Record or upload a short video and your first report will be saved here." />
      )}

      {sportsUsed.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {[{ slug: 'all', name: 'All sports', icon: '' }, ...sportsUsed].map((s) => (
            <button key={s.slug} type="button" onClick={() => setFilter(s.slug)} aria-pressed={filter === s.slug}
              className={`px-4 py-2 rounded-full border text-[13px] font-semibold transition ${filter === s.slug ? 'bg-ink text-white border-ink' : 'bg-paper border-line hover:border-ink/40'}`}>
              {s.icon && <span className="mr-1.5" aria-hidden="true">{s.icon}</span>}{s.name}
            </button>
          ))}
        </div>
      )}

      {picked.length > 0 && (
        <div className="sticky top-24 z-20 mb-3 flex flex-wrap items-center justify-between gap-3 px-5 py-3 rounded-full bg-ink text-white">
          <span className="text-sm">{picked.length === 1 ? 'Pick one more report to compare' : 'Two reports picked'}</span>
          <span className="flex gap-2">
            <button type="button" onClick={() => setPicked([])} className="px-4 py-2 rounded-full border border-white/30 text-[13px] font-semibold">Clear</button>
            <button type="button" disabled={picked.length < 2} onClick={() => navigate(`/app/compare?a=${picked[0]}&b=${picked[1]}`)}
              className="px-4 py-2 rounded-full bg-brand text-[13px] font-semibold disabled:opacity-40">Compare</button>
          </span>
        </div>
      )}

      <div className="space-y-2">
        {shown.map((r) => {
          const sport = SPORTS.find((s) => s.slug === r.movement_slug);
          return (
            <div key={r.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5 rounded-[1.75rem] bg-paper border border-line">
              <Link to={`/app/reports/${r.id}`} className="flex items-center gap-4 flex-1 min-w-0 group">
                <span className="w-14 h-14 shrink-0 rounded-full flex items-center justify-center font-display text-base text-white tabular-nums"
                  style={{ background: scoreColour(r.total) }}>
                  {Math.round(r.total)}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold truncate group-hover:underline">
                    <span aria-hidden="true">{sport?.icon} </span>{r.sport} · {r.movement_name}
                  </span>
                  <span className="block text-xs text-ink-soft mt-0.5">{shortDate(r.created_at)} · {r.grade} · {r.measured} checks</span>
                </span>
              </Link>
              <div className="flex items-center gap-2 sm:justify-end flex-wrap">
                {r.is_sample && <span className="shrink-0 text-[11px] font-semibold px-3 py-1 rounded-full bg-sand text-ink-soft" title="Made by the demo sample-data button, not from a real video">Sample</span>}
                <RiskChip risk={r.injury_risk} />
                <button type="button" aria-pressed={picked.includes(r.id)}
                  onClick={() => setPicked((p) => (p.includes(r.id) ? p.filter((x) => x !== r.id) : [...p.slice(-1), r.id]))}
                  className={`px-4 py-2 rounded-full border text-[13px] font-semibold transition ${picked.includes(r.id) ? 'bg-ink text-white border-ink' : 'border-line hover:border-ink/40'}`}>
                  {picked.includes(r.id) ? 'Picked' : 'Compare'}
                </button>
                <Link to={`/app/reports/${r.id}`} className="px-4 py-2 rounded-full border border-line text-[13px] font-semibold hover:border-ink/40 transition">Open</Link>
                <ConfirmButton label="Delete" question="Delete for good?" onConfirm={() => remove(r.id)} />
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
