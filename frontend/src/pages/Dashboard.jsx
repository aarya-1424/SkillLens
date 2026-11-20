import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SPORTS } from '../data/landing';
import ProgressChart from '../components/ProgressChart';
import { getProgress, getStats, listAnalyses } from '../services/history';

const RISK_TONE = {
  Low: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Medium: 'bg-amber-50 text-amber-800 border-amber-300',
  High: 'bg-red-50 text-red-800 border-red-200',
};

const when = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function Dashboard() {
  const { displayName, guest } = useAuth();
  const firstName = (displayName || '').split(' ')[0];
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [s, list] = await Promise.all([getStats(), listAnalyses('?limit=5')]);
      if (!alive) return;
      setStats(s);
      setRecent(list || []);
      if (s?.latest_movement) {
        const points = await getProgress(s.latest_movement);
        if (alive) setProgress(points || []);
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const hasHistory = Boolean(stats?.count);
  const latestSport = SPORTS.find((x) => x.slug === stats?.latest_movement);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="fade-up flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="font-serif text-4xl sm:text-5xl">Hi{firstName ? `, ${firstName}` : ''} 👋</h1>
          <p className="text-ink-soft mt-1">
            {hasHistory ? 'Here is where you stand.' : 'Ready to check your technique today?'}
          </p>
        </div>
        <Link to="/app/analyze"
          className="px-6 py-3 rounded-full font-medium text-white bg-brand hover:bg-brand-deep transition text-center shadow-md shadow-brand/25">
          + New analysis
        </Link>
      </div>

      {guest && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
          <strong>Demo mode.</strong> Your reports are not saved, so progress over time stays empty.
          Sign in with Google to keep your history.
        </div>
      )}

      {/* The three numbers */}
      <div className="grid md:grid-cols-3 gap-5 mb-8">
        <div className="fade-up delay-1 p-6 rounded-2xl bg-white border border-line">
          <div className="text-sm text-ink-soft mb-1">Latest score</div>
          {stats?.latest_total != null ? (
            <>
              <div className="font-serif text-5xl">{Math.round(stats.latest_total)}</div>
              <div className="text-xs text-ink-soft mt-2">
                {stats.latest_grade}
                {stats.change_since_last != null && (
                  <span className={stats.change_since_last >= 0 ? 'text-emerald-700' : 'text-amber-700'}>
                    {' '}· {stats.change_since_last >= 0 ? '▲' : '▼'} {Math.abs(stats.change_since_last)} since last
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="font-serif text-5xl text-ink-soft">—</div>
              <div className="text-xs text-ink-soft mt-2">Your first analysis will show here.</div>
            </>
          )}
        </div>

        <div className="fade-up delay-2 p-6 rounded-2xl bg-white border border-line">
          <div className="text-sm text-ink-soft mb-1">Analyses saved</div>
          <div className="font-serif text-5xl">{stats?.count ?? 0}</div>
          <div className="text-xs text-ink-soft mt-2">
            {guest ? 'Demo mode does not save history.'
              : hasHistory ? `Best so far: ${Math.round(stats.best)}` : 'Record one to get started.'}
          </div>
        </div>

        <div className="fade-up delay-3 p-6 rounded-2xl bg-white border border-line">
          <div className="text-sm text-ink-soft mb-1">Working on</div>
          {latestSport ? (
            <>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-3xl">{latestSport.icon}</span>
                <span className="font-serif text-2xl">{latestSport.movement}</span>
              </div>
              <Link to={`/app/analyze?sport=${encodeURIComponent(latestSport.name)}`}
                className="inline-block mt-3 text-sm text-brand hover:text-brand-deep underline">
                Record another →
              </Link>
            </>
          ) : (
            <div className="text-xs text-ink-soft mt-2">Pick a sport below to start.</div>
          )}
        </div>
      </div>

      {/* Progress */}
      {hasHistory && (
        <section className="mb-10 p-6 rounded-2xl bg-white border border-line">
          <h2 className="font-serif text-2xl mb-1">
            Your {latestSport?.movement?.toLowerCase() || 'progress'} over time
          </h2>
          <p className="text-sm text-ink-soft mb-4">Built from the reports you have saved.</p>
          <ProgressChart points={progress} movementName={latestSport?.movement} />
        </section>
      )}

      {/* Recent reports */}
      {recent.length > 0 && (
        <section className="mb-10">
          <h2 className="font-serif text-2xl mb-4">Recent reports</h2>
          <div className="rounded-2xl bg-white border border-line divide-y divide-line overflow-hidden">
            {recent.map((a) => (
              <div key={a.id} className="flex items-center gap-4 px-5 py-4">
                <span className="font-serif text-2xl w-12 tabular-nums">{Math.round(a.total)}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{a.sport} · {a.movement_name}</div>
                  <div className="text-xs text-ink-soft">{when(a.created_at)} · {a.measured} checks</div>
                </div>
                <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full border ${RISK_TONE[a.injury_risk]}`}>
                  {a.injury_risk}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <h2 className="font-serif text-2xl mb-4">
        {hasHistory ? 'Analyse another sport' : 'Pick a sport to start'}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {SPORTS.map((s) => (
          <Link key={s.name} to={`/app/analyze?sport=${encodeURIComponent(s.name)}`}
            className="p-5 rounded-2xl bg-white border border-line hover:-translate-y-1 hover:border-brand transition">
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="font-medium">{s.name}</div>
            <div className="text-xs text-ink-soft">{s.movement}</div>
          </Link>
        ))}
      </div>

      {loading && <p className="sr-only">Loading your history…</p>}
    </main>
  );
}
