import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SPORTS } from '../data/landing';
import ProgressChart from '../components/ProgressChart';
import { getProgress, getStats, listAnalyses } from '../services/history';

const RISK_TONE = {
  Low: 'bg-mint/15 text-emerald-800',
  Medium: 'bg-amber/20 text-amber-800',
  High: 'bg-alert/15 text-red-800',
};

const LABEL = 'text-[11px] font-bold tracking-[0.18em] uppercase';

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
  const score = stats?.latest_total != null ? Math.round(stats.latest_total) : null;
  const ring = 2 * Math.PI * 52;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {guest && (
        <div className="mb-3 px-5 py-3 rounded-3xl bg-amber/15 border border-amber/40 text-ink text-sm">
          <strong>Demo mode.</strong> Reports are not saved here. Sign in with Google to keep your history.
        </div>
      )}

      {/* Top: dark stage with the score, next to two cards */}
      <div className="grid lg:grid-cols-12 gap-3 mb-3">
        <section className="fade-up lg:col-span-8 relative overflow-hidden rounded-[2.2rem] bg-stage stage-grid text-white p-8 sm:p-10 flex flex-col md:flex-row gap-8 md:items-end justify-between min-h-[19rem]">
          <div className="pointer-events-none absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-brand/30 blur-3xl" />
          <div className="relative">
            <p className="eyebrow mb-4">Your dashboard</p>
            <h1 className="font-display text-3xl sm:text-[2.6rem] leading-[1.02]">
              Hi{firstName ? `, ${firstName}` : ''}.<br />
              <em>{hasHistory ? 'Here is where you stand.' : 'Ready when you are.'}</em>
            </h1>
            <p className="text-white/60 mt-4 max-w-sm text-sm leading-relaxed">
              {hasHistory
                ? 'Every new video builds on the last one. Record again to see what moved.'
                : 'Film 5 to 15 seconds of your movement. Your first report takes under a minute.'}
            </p>
            <Link to="/app/analyze"
              className="inline-block mt-7 px-7 py-3.5 rounded-full font-semibold text-white bg-brand hover:bg-brand-deep transition shadow-xl shadow-brand/30">
              New analysis →
            </Link>
          </div>

          <div className="relative shrink-0 flex items-center gap-5">
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden="true">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="9" />
                <circle cx="60" cy="60" r="52" fill="none" stroke="#d7282f" strokeWidth="9" strokeLinecap="round"
                  strokeDasharray={ring} strokeDashoffset={ring * (1 - (score ?? 0) / 100)} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-4xl">{score ?? '—'}</span>
                <span className="text-[10px] tracking-[0.18em] uppercase text-white/50">of 100</span>
              </div>
            </div>
            <div>
              <div className={`${LABEL} text-white/50`}>Latest score</div>
              {score != null ? (
                <>
                  <div className="font-display text-lg mt-1">{stats.latest_grade}</div>
                  {stats.change_since_last != null && (
                    <span className={`inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full ${stats.change_since_last >= 0 ? 'bg-mint/20 text-mint' : 'bg-amber/20 text-amber'}`}>
                      {stats.change_since_last >= 0 ? '▲' : '▼'} {Math.abs(stats.change_since_last)} since last
                    </span>
                  )}
                </>
              ) : (
                <div className="text-sm text-white/60 mt-1 max-w-[11rem]">Your first analysis will show here.</div>
              )}
            </div>
          </div>
        </section>

        <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-3">
          <div className="fade-up delay-1 p-7 rounded-[2rem] bg-paper border border-line flex flex-col justify-between">
            <div className={`${LABEL} text-ink-soft`}>Analyses saved</div>
            <div>
              <div className="font-display text-5xl mt-3">{stats?.count ?? 0}</div>
              <div className="text-xs text-ink-soft mt-2">
                {guest ? 'Demo mode does not save history.'
                  : hasHistory ? `Best so far: ${Math.round(stats.best)}` : 'Record one to get started.'}
              </div>
            </div>
          </div>
          <div className="fade-up delay-2 p-7 rounded-[2rem] bg-sand flex flex-col justify-between">
            <div className={`${LABEL} text-ink-soft`}>Working on</div>
            {latestSport ? (
              <div>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-3xl" aria-hidden="true">{latestSport.icon}</span>
                  <span className="font-display text-lg leading-tight">{latestSport.movement}</span>
                </div>
                <Link to={`/app/analyze?sport=${encodeURIComponent(latestSport.name)}`}
                  className="inline-block mt-3 text-sm font-semibold text-brand hover:text-brand-deep">
                  Record another →
                </Link>
              </div>
            ) : (
              <div>
                <div className="font-display text-lg mt-3">Nothing yet</div>
                <div className="text-xs text-ink-soft mt-2">Pick a sport below to start.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress + recent reports */}
      {(hasHistory || recent.length > 0) && (
        <div className="grid lg:grid-cols-12 gap-3 mb-3">
          {hasHistory && (
            <section className="lg:col-span-7 p-7 sm:p-8 rounded-[2rem] bg-paper border border-line">
              <p className="eyebrow mb-2">Progress</p>
              <h2 className="font-display text-xl sm:text-2xl mb-1">
                Your {latestSport?.movement || 'score'} <em>over time</em>
              </h2>
              <p className="text-sm text-ink-soft mb-5">Built from the reports you have saved.</p>
              <ProgressChart points={progress} movementName={latestSport?.movement} />
            </section>
          )}
          {recent.length > 0 && (
            <section className={`${hasHistory ? 'lg:col-span-5' : 'lg:col-span-12'} p-7 sm:p-8 rounded-[2rem] bg-paper border border-line`}>
              <p className="eyebrow mb-2">History</p>
              <h2 className="font-display text-xl sm:text-2xl mb-4">Recent reports</h2>
              <div className="space-y-2">
                {recent.map((a) => (
                  <div key={a.id} className="flex items-center gap-4 px-4 py-3 rounded-2xl bg-canvas">
                    <span className="w-12 h-12 shrink-0 rounded-full bg-ink text-white font-display text-sm flex items-center justify-center tabular-nums">
                      {Math.round(a.total)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{a.sport} · {a.movement_name}</div>
                      <div className="text-xs text-ink-soft">{when(a.created_at)} · {a.measured} checks</div>
                    </div>
                    <span className={`shrink-0 text-[11px] font-semibold px-3 py-1 rounded-full ${RISK_TONE[a.injury_risk]}`}>
                      {a.injury_risk} risk
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Sports */}
      <section className="rounded-[2.2rem] bg-sand p-7 sm:p-9">
        <p className="eyebrow mb-2">Ten sports</p>
        <h2 className="font-display text-xl sm:text-2xl mb-6">
          {hasHistory ? <>Analyse <em>another sport</em></> : <>Pick a sport <em>to start</em></>}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {SPORTS.map((s) => (
            <Link key={s.name} to={`/app/analyze?sport=${encodeURIComponent(s.name)}`}
              className="group p-5 rounded-3xl bg-paper border border-line hover:bg-ink hover:border-ink hover:text-white hover:-translate-y-0.5 transition">
              <div className="text-3xl mb-5" aria-hidden="true">{s.icon}</div>
              <div className="font-display text-[0.78rem] leading-tight">{s.name}</div>
              <div className="text-xs mt-1 text-ink-soft group-hover:text-white/60">{s.movement}</div>
            </Link>
          ))}
        </div>
      </section>

      {loading && <p className="sr-only">Loading your history…</p>}
    </main>
  );
}
