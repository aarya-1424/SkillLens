import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AskCoach from '../components/AskCoach';
import { ConfirmButton, LABEL, RiskChip, ScoreRing, scoreColour, shortDate } from '../components/Bits';
import { SPORTS } from '../data/landing';
import { deleteAnalysis, getAnalysis, getSummary } from '../services/history';

const SEVERITY_TONE = {
  none: 'bg-mint/10 border-mint/30',
  minor: 'bg-amber/10 border-amber/30',
  major: 'bg-amber/15 border-amber/40',
  critical: 'bg-alert/10 border-alert/30',
};

/** One measured check, as it was shown when the report was made. */
function SavedCheck({ r }) {
  const arrow = r.direction === 'increase' ? '▲' : r.direction === 'decrease' ? '▼' : '✓';
  return (
    <div className="rounded-[1.75rem] border border-line bg-paper p-6">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-semibold leading-tight">{r.name}</h3>
        <span className="shrink-0 text-lg font-semibold tabular-nums">{r.value_label}</span>
      </div>
      <div className="flex items-center gap-3 mt-4">
        <div className="flex-1 h-2 rounded-full bg-sand overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${r.score}%`, background: scoreColour(r.score) }} />
        </div>
        <span className="text-xs tabular-nums text-ink-soft w-14 text-right">{Math.round(r.score)} / 100</span>
      </div>
      <p className="text-[11px] text-ink-soft mt-2">Target {r.target_label}</p>
      <div className={`mt-4 rounded-2xl border px-4 py-3 ${SEVERITY_TONE[r.severity] || SEVERITY_TONE.none}`}>
        <p className="text-sm font-semibold flex gap-1.5"><span aria-hidden="true">{arrow}</span>{r.headline}</p>
        {r.cue && <p className="text-sm mt-1.5 leading-relaxed">{r.cue}</p>}
      </div>
    </div>
  );
}

export default function ReportDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(undefined);
  const [summary, setSummary] = useState({ text: null, state: 'idle' });
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let alive = true;
    getAnalysis(id).then((r) => {
      if (!alive) return;
      setReport(r || null);
      if (r?.ai_summary) setSummary({ text: r.ai_summary, state: 'done' });
    }).catch(() => alive && setReport(null));
    return () => { alive = false; };
  }, [id]);

  const writeSummary = async () => {
    setSummary({ text: null, state: 'loading' });
    const res = await getSummary(id).catch(() => null);
    if (res?.ai_paused) setSummary({ text: null, state: 'paused' });
    else if (res?.summary) setSummary({ text: res.summary, state: 'done' });
    else setSummary({ text: null, state: 'unavailable' });
  };

  if (report === undefined) return <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-ink-soft">Loading…</main>;
  if (report === null) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <p className="font-display text-xl">Report not found</p>
        <p className="text-ink-soft mt-2">It may have been deleted.</p>
        <Link to="/app/reports" className="inline-block mt-6 px-6 py-3 rounded-full bg-ink text-white font-semibold">Back to my reports</Link>
      </main>
    );
  }

  const sport = SPORTS.find((s) => s.slug === report.movement_slug);
  const fixes = report.results.filter((r) => r.status !== 'good');
  const strengths = report.results.filter((r) => r.status === 'good');
  const visible = showAll ? report.results : fixes;

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <Link to="/app/reports" className="text-sm font-semibold text-ink-soft hover:text-ink no-print">← My reports</Link>
          <p className="eyebrow mt-4 mb-2">{report.sport} · {report.movement_name}</p>
          <h1 className="font-display text-3xl sm:text-[2.6rem]">Report <em>{shortDate(report.created_at)}</em></h1>
        </div>
        <div className="flex flex-wrap gap-2 no-print">
          <button type="button" onClick={() => window.print()}
            className="px-5 py-2.5 rounded-full border border-line bg-paper text-sm font-semibold hover:border-ink/40 transition">Save as PDF</button>
          <Link to={`/app/analyze?sport=${encodeURIComponent(sport?.name || '')}`}
            className="px-5 py-2.5 rounded-full bg-brand text-white text-sm font-semibold hover:bg-brand-deep transition shadow-lg shadow-brand/25">Record again</Link>
        </div>
      </div>

      {report.unverified && (
        <div className="mb-3 px-5 py-3 rounded-3xl bg-amber/15 border border-amber/40 text-sm">
          <strong>Targets not yet coach-verified.</strong> Treat them as a guide.
        </div>
      )}

      <section className="grid lg:grid-cols-3 gap-3 mb-3">
        <div className="relative overflow-hidden rounded-[2rem] bg-stage stage-grid text-white p-7 flex items-center gap-6">
          <div className="pointer-events-none absolute -bottom-24 -left-20 w-64 h-64 rounded-full bg-brand/30 blur-3xl" />
          <ScoreRing value={report.total} />
          <div className="relative">
            <p className={`${LABEL} text-white/50`}>Technique score</p>
            <p className="font-display text-2xl mt-1">{report.grade}</p>
            <p className="text-sm text-white/60 mt-2">From {report.measured} checks.</p>
          </div>
        </div>
        <div className="rounded-[2rem] bg-stage-soft text-white p-7">
          <p className={`${LABEL} text-white/50 mb-3`}>Injury risk</p>
          <RiskChip risk={report.injury_risk} suffix="" dark />
          <p className="text-sm text-white/70 mt-3 leading-relaxed">
            {report.injury_risk === 'Low' ? 'Nothing in this clip stood out as risky.' : 'Fixing the checks below is what brings this down.'}
          </p>
          <p className="text-[11px] text-white/40 mt-3">Coaching guidance, not medical advice.</p>
        </div>
        <div className="rounded-[2rem] border border-line bg-paper p-7">
          <p className={`${LABEL} text-ink-soft mb-4`}>By area</p>
          <div className="space-y-3">
            {Object.entries(report.groups).map(([group, score]) => (
              <div key={group} className="flex items-center gap-3 text-xs">
                <span className="w-16 capitalize text-ink-soft">{group}</span>
                <div className="flex-1 h-2 rounded-full bg-sand overflow-hidden">
                  <div className="h-full rounded-full bg-ink" style={{ width: `${score}%` }} />
                </div>
                <span className="w-8 text-right tabular-nums">{Math.round(score)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-10 rounded-[2rem] bg-sand p-7 sm:p-8">
        <p className="eyebrow mb-2">Coach's read</p>
        {summary.state === 'done' && <p className="text-lg leading-relaxed max-w-4xl">{summary.text}</p>}
        {summary.state === 'idle' && (
          <button type="button" onClick={writeSummary} className="px-5 py-2.5 rounded-full bg-ink text-white text-sm font-semibold no-print">
            Write a short summary
          </button>
        )}
        {summary.state === 'loading' && <p className="text-ink-soft">Writing…</p>}
        {summary.state === 'paused' && (
          <p className="text-sm">AI features are off in <Link to="/app/privacy" className="font-semibold underline">Privacy &amp; data</Link>, so no summary was written.</p>
        )}
        {summary.state === 'unavailable' && <p className="text-sm text-ink-soft">The AI is not available right now. Your scores are complete without it.</p>}
      </section>

      <section className="mb-10">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <h2 className="font-display text-xl sm:text-2xl">
            {fixes.length ? `${fixes.length} thing${fixes.length > 1 ? 's' : ''} to work on` : 'Nothing to fix in this clip'}
          </h2>
          <button type="button" onClick={() => setShowAll((v) => !v)}
            className="px-4 py-2 rounded-full border border-line bg-paper text-[13px] font-semibold hover:border-ink/40 transition no-print">
            {showAll ? 'Show only what needs work' : `Show all ${report.results.length} checks`}
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {visible.map((r) => <SavedCheck key={r.id} r={r} />)}
        </div>
      </section>

      {strengths.length > 0 && !showAll && (
        <section className="mb-3 rounded-[2rem] border border-mint/30 bg-mint/10 p-7 sm:p-8">
          <p className={`${LABEL} text-emerald-700 mb-2`}>Strengths</p>
          <h2 className="font-display text-xl sm:text-2xl mb-4">What you did well</h2>
          <ul className="grid sm:grid-cols-3 gap-3">
            {strengths.map((s) => (
              <li key={s.id} className="text-sm">
                <span className="font-semibold">{s.name}</span>
                <span className="block text-ink-soft">{s.value_label} · {s.cue}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-3">
        <AskCoach analysisId={report.id} movementSlug={report.movement_slug} sport={report.sport} withHistory />
      </section>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-[1.75rem] bg-paper border border-line text-sm no-print">
        <span className="text-ink-soft">Your video was never stored, so this page shows the measurements taken from it.</span>
        <ConfirmButton label="Delete this report" question="Delete this report and its Ask Coach messages for good?"
          onConfirm={async () => { await deleteAnalysis(report.id); navigate('/app/reports', { replace: true }); }} />
      </div>
    </main>
  );
}
