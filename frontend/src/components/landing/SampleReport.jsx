import { Link } from 'react-router-dom';

const joints = [['Shoulder', 27, 30], ['Elbow', 16, 25], ['Hip', 22, 25], ['Knee', 15, 20], ['Spine', 18, 20]];
const progress = [58, 64, 71, 69, 78, 82];

export default function SampleReport({ cta }) {
  const max = Math.max(...progress);
  const points = progress.map((v, i) => `${(i / (progress.length - 1)) * 100},${40 - (v / max) * 36}`).join(' ');

  return (
    <section id="report" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <p className="eyebrow mb-4">Sample report</p>
        <h2 className="font-serif text-4xl sm:text-5xl leading-[1.05] mb-4">
          This is what you get <em className="text-brand">after one video.</em>
        </h2>
        <p className="text-ink-soft text-lg">Sample athlete, sample data. Nothing here is saved.</p>
      </div>

      <div className="rounded-3xl border border-line bg-white shadow-[0_40px_100px_-40px_rgba(11,31,75,0.25)] overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-line bg-sky">
          <span className="w-2.5 h-2.5 rounded-full bg-brand/40" /><span className="w-2.5 h-2.5 rounded-full bg-brand/40" /><span className="w-2.5 h-2.5 rounded-full bg-brand/40" />
          <span className="ml-3 text-xs text-ink-soft">skilllens · Report · Cricket bowling · 15 Oct</span>
        </div>

        <div className="p-5 sm:p-8 grid lg:grid-cols-3 gap-6">
          {/* Score card */}
          <div className="rounded-2xl border border-line p-5 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-ink-soft">Technique score</p>
              <div className="flex items-end gap-2 mt-2">
                <span className="font-serif text-7xl leading-none">82</span>
                <span className="text-ink-soft mb-2">/ 100</span>
              </div>
              <span className="inline-block mt-3 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Good · up 4 from last week</span>
            </div>
            <div className="mt-6 space-y-2">
              {joints.map(([l, s, m]) => (
                <div key={l} className="flex items-center gap-3 text-xs">
                  <span className="w-14 text-ink-soft">{l}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-sky overflow-hidden"><div className="h-full bg-brand rounded-full" style={{ width: `${(s / m) * 100}%` }} /></div>
                  <span className="w-10 text-right tabular-nums">{s}/{m}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mistakes + risk */}
          <div className="rounded-2xl border border-line p-5 space-y-4">
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-ink-soft mb-2">2 things to fix</p>
              <div className="space-y-2 text-sm">
                <div className="p-3 rounded-xl bg-amber/10 border border-amber/30">
                  <div className="font-medium">Elbow straightens 18° in delivery</div>
                  <div className="text-xs text-ink-soft mt-0.5">↳ Wall-hold delivery drill · 5 min</div>
                </div>
                <div className="p-3 rounded-xl bg-sky border border-line">
                  <div className="font-medium">Front knee collapses to 142°</div>
                  <div className="text-xs text-ink-soft mt-0.5">↳ Single-leg landings · 3 × 8</div>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-ink-soft mb-2">Injury risk</p>
              <div className="flex items-center gap-2 text-sm"><span className="px-2 py-0.5 rounded-full bg-amber/15 text-amber-800 text-xs font-semibold">Medium</span> Lower back under strain</div>
            </div>
          </div>

          {/* Progress */}
          <div className="rounded-2xl border border-line p-5 flex flex-col">
            <p className="text-xs font-semibold tracking-wider uppercase text-ink-soft mb-2">Progress · 6 weeks</p>
            <svg viewBox="0 0 100 44" className="w-full h-28 mt-auto" aria-hidden="true">
              <polyline points={points} fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              {progress.map((v, i) => (
                <circle key={i} cx={(i / (progress.length - 1)) * 100} cy={40 - (v / max) * 36} r="1.8" fill="#fff" stroke="#2563eb" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
              ))}
            </svg>
            <div className="flex justify-between text-[10px] text-ink-soft mt-1"><span>Week 1 · 58</span><span>Week 6 · 82</span></div>
            <div className="mt-4 p-3 rounded-xl bg-brand-soft/50 border border-brand-soft text-xs leading-relaxed">
              <span className="font-semibold">Coach's note:</span> your elbow is the one thing holding the score back. Fix that and the back strain goes with it.
            </div>
          </div>
        </div>

        <div className="px-5 sm:px-8 py-4 border-t border-line bg-sky flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-sm text-ink-soft">Want this for your own video?</span>
          <Link to={cta} className="px-5 py-2.5 rounded-full bg-brand text-white text-sm font-medium hover:bg-brand-deep transition shadow-md shadow-brand/25">Analyse my technique →</Link>
        </div>
      </div>
    </section>
  );
}
