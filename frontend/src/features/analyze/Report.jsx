import { useEffect, useMemo, useState } from 'react';
import MetricGauge from '../../components/MetricGauge';
import SkeletonVideo from '../../components/SkeletonVideo';
import AskCoach from '../../components/AskCoach';
import ProgressChart from '../../components/ProgressChart';
import { getProgress, getSummary, saveAnalysis } from '../../services/history';

const RISK_TONE = {
  Low: 'bg-mint/20 text-mint',
  Medium: 'bg-amber/20 text-amber',
  High: 'bg-alert/20 text-alert',
};

function ScoreRing({ value }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const tone = value >= 85 ? '#10b981' : value >= 50 ? '#f59e0b' : '#f04438';
  return (
    <div className="relative w-36 h-36 shrink-0">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={tone} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-5xl leading-none">{Math.round(value)}</span>
        <span className="text-[10px] tracking-[0.18em] uppercase text-white/50 mt-1">of 100</span>
      </div>
    </div>
  );
}

export default function Report({ analysis, videoUrl, onStartOver }) {
  const { report, movement, tracked, moments, confidence, lowConfidence, unmeasured } = analysis;
  const [jumpTo, setJumpTo] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [saved, setSaved] = useState(null);      // the stored report, once kept
  const [summary, setSummary] = useState(null);  // the AI's few sentences
  const [progress, setProgress] = useState([]);

  // Keep the report, then fetch the written summary and the progress line.
  // All of this is optional: in demo mode there is no account, the calls come
  // back empty, and the report still stands on its own.
  useEffect(() => {
    let alive = true;
    (async () => {
      const stored = await saveAnalysis(analysis);
      if (!alive || !stored) return;
      setSaved(stored);
      const [written, points] = await Promise.all([
        getSummary(stored.id),
        getProgress(movement.slug),
      ]);
      if (!alive) return;
      if (written?.summary) setSummary(written.summary);
      setProgress(points || []);
    })();
    return () => { alive = false; };
  }, [analysis, movement.slug]);

  const byMoment = useMemo(() => {
    const map = {};
    for (const m of movement.metrics) map[m.id] = m.moment;
    return map;
  }, [movement]);

  /** Freeze the clip on the moment a given mistake happened. */
  const showMoment = (metricId) => {
    const frameIndex = moments?.[byMoment[metricId]];
    if (frameIndex != null && tracked?.times?.[frameIndex] != null) {
      setJumpTo(tracked.times[frameIndex]);
      document.getElementById('report-video')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const visible = showAll ? report.all_results : report.fixes;

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="eyebrow mb-1">{movement.sport} · {movement.name}</p>
          <h1 className="font-display text-3xl sm:text-[2.6rem]">Your <em>report</em></h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()}
            className="px-5 py-2.5 rounded-full border border-line bg-paper text-sm font-semibold hover:border-ink/40 transition no-print">
            Save as PDF
          </button>
          <button onClick={onStartOver}
            className="px-5 py-2.5 rounded-full bg-brand text-white text-sm font-semibold hover:bg-brand-deep transition shadow-lg shadow-brand/25 no-print">
            Analyse another
          </button>
        </div>
      </div>

      {/* Honesty banners */}
      {report.unverified && (
        <div className="mb-3 px-5 py-3 rounded-3xl bg-amber/15 border border-amber/40 text-ink text-sm">
          <strong>Targets not yet coach-verified.</strong> These target ranges come from general
          coaching guidance and are waiting on sign-off from a qualified coach. Treat them as a
          guide, not gospel.
        </div>
      )}
      {lowConfidence && (
        <div className="mb-3 px-5 py-3 rounded-3xl bg-amber/15 border border-amber/40 text-ink text-sm">
          <strong>We could not see you clearly ({Math.round(confidence * 100)}%).</strong> Re-film
          from the side, further back, in better light for a more reliable report.
        </div>
      )}

      {/* Score + risk */}
      <section className="grid lg:grid-cols-3 gap-3 mb-3">
        <div className="relative overflow-hidden rounded-[2rem] bg-stage stage-grid text-white p-7 flex items-center gap-6">
          <div className="pointer-events-none absolute -bottom-24 -left-20 w-64 h-64 rounded-full bg-brand/30 blur-3xl" />
          <ScoreRing value={report.total} />
          <div className="relative">
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-white/50">Technique score</p>
            <p className="font-display text-2xl mt-1">{report.grade}</p>
            <p className="text-sm text-white/60 mt-2">
              From {report.measured} checks on this movement.
            </p>
          </div>
        </div>

        <div className="rounded-[2rem] bg-stage-soft text-white p-7">
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-white/50 mb-3">Injury risk</p>
          <span className={`inline-block px-4 py-1.5 rounded-full font-display text-sm ${RISK_TONE[report.injury_risk]}`}>
            {report.injury_risk}
          </span>
          <p className="text-sm text-white/70 mt-3 leading-relaxed">
            {report.injury_risk === 'Low'
              ? 'Nothing in this clip stands out as risky.'
              : 'Fixing the items below is what brings this down.'}
          </p>
          <p className="text-[11px] text-white/40 mt-3">Coaching guidance, not medical advice.</p>
        </div>

        <div className="rounded-[2rem] border border-line bg-paper p-7">
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-ink-soft mb-4">By area</p>
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

      {/* What the coach makes of it */}
      {summary && (
        <section className="mb-3 rounded-[2rem] bg-sand p-7 sm:p-8">
          <p className="eyebrow mb-2">Coach's read</p>
          <p className="text-lg leading-relaxed max-w-4xl">{summary}</p>
        </section>
      )}

      {/* Video */}
      <section id="report-video" className="mb-10">
        <SkeletonVideo videoUrl={videoUrl} tracked={tracked} jumpTo={jumpTo}
          title="Your video, with the tracking on top" />
      </section>

      {/* The fixes */}
      <section className="mb-10">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <h2 className="font-display text-xl sm:text-2xl">
            {report.fixes.length ? `${report.fixes.length} thing${report.fixes.length > 1 ? 's' : ''} to work on` : 'Nothing to fix — good clip'}
          </h2>
          <button onClick={() => setShowAll((v) => !v)}
            className="px-4 py-2 rounded-full border border-line bg-paper text-[13px] font-semibold hover:border-ink/40 transition no-print">
            {showAll ? 'Show only what needs work' : `Show all ${report.all_results.length} checks`}
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {visible.map((r) => (
            <div key={r.id}>
              <MetricGauge result={r} />
              <button onClick={() => showMoment(r.id)}
                className="mt-2 ml-4 text-xs font-semibold text-brand hover:text-brand-deep no-print">
                See this moment in your video →
              </button>
            </div>
          ))}
        </div>

        {!visible.length && (
          <p className="text-ink-soft">Every check on this movement came back inside its target zone.</p>
        )}
      </section>

      {/* Strengths */}
      {report.strengths.length > 0 && (
        <section className="mb-3 rounded-[2rem] border border-mint/30 bg-mint/10 p-7 sm:p-8">
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-emerald-700 mb-2">Strengths</p>
          <h2 className="font-display text-xl sm:text-2xl mb-4">What you are doing well</h2>
          <ul className="grid sm:grid-cols-3 gap-3">
            {report.strengths.map((s) => (
              <li key={s.id} className="text-sm">
                <span className="font-semibold">{s.name}</span>
                <span className="block text-ink-soft">{s.value_label} · {s.cue}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Progress over time */}
      {saved && (
        <section className="mb-3 rounded-[2rem] border border-line bg-paper p-7 sm:p-8 no-print">
          <p className="eyebrow mb-2">Progress</p>
          <h2 className="font-display text-xl sm:text-2xl mb-1">Your {movement.name} <em>over time</em></h2>
          <p className="text-sm text-ink-soft mb-4">Every analysis you save is a point on this line.</p>
          <ProgressChart points={progress} movementName={movement.name} />
        </section>
      )}

      {/* Ask Coach */}
      <section className="mb-6">
        <AskCoach analysisId={saved?.id} movementSlug={movement.slug} sport={movement.sport} />
      </section>

      {unmeasured?.length > 0 && (
        <p className="text-xs text-ink-soft">
          {unmeasured.length} check{unmeasured.length > 1 ? 's were' : ' was'} skipped because those
          body parts were not clearly visible. We leave them out rather than guess.
        </p>
      )}
    </main>
  );
}
