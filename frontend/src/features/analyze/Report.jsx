import { useMemo, useState } from 'react';
import MetricGauge from '../../components/MetricGauge';
import SkeletonVideo from '../../components/SkeletonVideo';

const RISK_TONE = {
  Low: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Medium: 'bg-amber-50 text-amber-800 border-amber-300',
  High: 'bg-red-50 text-red-800 border-red-200',
};

function ScoreRing({ value }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const tone = value >= 85 ? '#10b981' : value >= 70 ? '#2563eb' : value >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative w-36 h-36 shrink-0">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#dbeafe" strokeWidth="11" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={tone} strokeWidth="11" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-5xl leading-none">{Math.round(value)}</span>
        <span className="text-xs text-ink-soft mt-1">out of 100</span>
      </div>
    </div>
  );
}

export default function Report({ analysis, videoUrl, onStartOver }) {
  const { report, movement, tracked, moments, confidence, lowConfidence, unmeasured } = analysis;
  const [jumpTo, setJumpTo] = useState(null);
  const [showAll, setShowAll] = useState(false);

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
          <h1 className="font-serif text-4xl">Your report</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()}
            className="px-4 py-2.5 rounded-full border border-line bg-white text-sm font-medium hover:border-brand transition no-print">
            Save as PDF
          </button>
          <button onClick={onStartOver}
            className="px-4 py-2.5 rounded-full bg-brand text-white text-sm font-medium hover:bg-brand-deep transition no-print">
            Analyse another
          </button>
        </div>
      </div>

      {/* Honesty banners */}
      {report.unverified && (
        <div className="mb-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
          <strong>Targets not yet coach-verified.</strong> These target ranges come from general
          coaching guidance and are waiting on sign-off from a qualified coach. Treat them as a
          guide, not gospel.
        </div>
      )}
      {lowConfidence && (
        <div className="mb-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm">
          <strong>We could not see you clearly ({Math.round(confidence * 100)}%).</strong> Re-film
          from the side, further back, in better light for a more reliable report.
        </div>
      )}

      {/* Score + risk */}
      <section className="grid lg:grid-cols-3 gap-5 mb-6">
        <div className="rounded-2xl border border-line bg-white p-6 flex items-center gap-6">
          <ScoreRing value={report.total} />
          <div>
            <p className="text-xs font-semibold tracking-wider uppercase text-ink-soft">Technique score</p>
            <p className="font-serif text-3xl mt-1">{report.grade}</p>
            <p className="text-sm text-ink-soft mt-2">
              From {report.measured} checks on this movement.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-6">
          <p className="text-xs font-semibold tracking-wider uppercase text-ink-soft mb-3">Injury risk</p>
          <span className={`inline-block px-3 py-1.5 rounded-full border text-sm font-semibold ${RISK_TONE[report.injury_risk]}`}>
            {report.injury_risk}
          </span>
          <p className="text-sm text-ink-soft mt-3 leading-relaxed">
            {report.injury_risk === 'Low'
              ? 'Nothing in this clip stands out as risky.'
              : 'Fixing the items below is what brings this down.'}
          </p>
          <p className="text-[11px] text-ink-soft mt-3">Coaching guidance, not medical advice.</p>
        </div>

        <div className="rounded-2xl border border-line bg-white p-6">
          <p className="text-xs font-semibold tracking-wider uppercase text-ink-soft mb-3">By area</p>
          <div className="space-y-2">
            {Object.entries(report.groups).map(([group, score]) => (
              <div key={group} className="flex items-center gap-3 text-xs">
                <span className="w-16 capitalize text-ink-soft">{group}</span>
                <div className="flex-1 h-1.5 rounded-full bg-sky overflow-hidden">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${score}%` }} />
                </div>
                <span className="w-8 text-right tabular-nums">{Math.round(score)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video */}
      <section id="report-video" className="mb-6">
        <SkeletonVideo videoUrl={videoUrl} tracked={tracked} jumpTo={jumpTo}
          title="Your video, with the tracking on top" />
      </section>

      {/* The fixes */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-3xl">
            {report.fixes.length ? `${report.fixes.length} thing${report.fixes.length > 1 ? 's' : ''} to work on` : 'Nothing to fix — good clip'}
          </h2>
          <button onClick={() => setShowAll((v) => !v)}
            className="text-sm text-brand hover:text-brand-deep underline no-print">
            {showAll ? 'Show only what needs work' : `Show all ${report.all_results.length} checks`}
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {visible.map((r) => (
            <div key={r.id}>
              <MetricGauge result={r} />
              <button onClick={() => showMoment(r.id)}
                className="mt-1.5 text-xs text-brand hover:text-brand-deep underline no-print">
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
        <section className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6">
          <h2 className="font-serif text-2xl mb-3">What you are doing well</h2>
          <ul className="grid sm:grid-cols-3 gap-3">
            {report.strengths.map((s) => (
              <li key={s.id} className="text-sm">
                <span className="font-medium">{s.name}</span>
                <span className="block text-ink-soft">{s.value_label} · {s.cue}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {unmeasured?.length > 0 && (
        <p className="text-xs text-ink-soft">
          {unmeasured.length} check{unmeasured.length > 1 ? 's were' : ' was'} skipped because those
          body parts were not clearly visible. We leave them out rather than guess.
        </p>
      )}
    </main>
  );
}
