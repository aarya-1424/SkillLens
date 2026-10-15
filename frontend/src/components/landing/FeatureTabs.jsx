import { useState } from 'react';
import { FEATURES } from '../../data/landing';

/* ---------- Small sample panels, one per feature ---------- */

const Bar = ({ label, pct, tone = 'brand' }) => (
  <div>
    <div className="flex justify-between text-xs mb-1">
      <span className="text-ink-soft">{label}</span>
      <span className="font-medium tabular-nums">{pct}%</span>
    </div>
    <div className="h-2 rounded-full bg-sky overflow-hidden">
      <div className={`h-full rounded-full ${tone === 'amber' ? 'bg-amber' : tone === 'mint' ? 'bg-mint' : 'bg-brand'}`} style={{ width: `${pct}%` }} />
    </div>
  </div>
);

const Ring = ({ value }) => {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#eaf1ff" strokeWidth="8" />
        <circle cx="40" cy="40" r={r} fill="none" stroke="#2563eb" strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        <span className="text-[10px] text-ink-soft">of 100</span>
      </div>
    </div>
  );
};

function SampleScore() {
  return (
    <div className="flex gap-5 items-center">
      <Ring value={82} />
      <div className="flex-1 space-y-2.5">
        <Bar label="Shoulder" pct={90} tone="mint" />
        <Bar label="Elbow" pct={64} tone="amber" />
        <Bar label="Hip" pct={88} tone="mint" />
        <Bar label="Knee" pct={76} />
        <Bar label="Spine" pct={92} tone="mint" />
      </div>
    </div>
  );
}

function SampleMistakes() {
  return (
    <div className="space-y-3">
      <div className="p-3 rounded-xl border border-amber/40 bg-amber/5">
        <div className="flex justify-between text-sm font-medium">
          <span>Elbow straightens during delivery</span>
          <span className="text-amber-700 tabular-nums">18°</span>
        </div>
        <p className="text-xs text-ink-soft mt-1">Legal limit is 15°. Work on keeping the arm fixed from horizontal to release.</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {['Wall-hold delivery drill', 'Towel-under-arm bowling'].map((d) => (
            <span key={d} className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-line">↳ {d}</span>
          ))}
        </div>
      </div>
      <div className="p-3 rounded-xl border border-line bg-white">
        <div className="flex justify-between text-sm font-medium">
          <span>Front knee collapses at landing</span>
          <span className="text-ink-soft tabular-nums">142°</span>
        </div>
        <p className="text-xs text-ink-soft mt-1">Aim for a firmer brace. Drill: single-leg landings, 3 × 8.</p>
      </div>
    </div>
  );
}

function SampleInjury() {
  const rows = [['Lower back', 62, 'amber'], ['Shoulder', 38, 'brand'], ['Knee', 24, 'mint'], ['Elbow', 20, 'mint']];
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber/15 text-amber-800">Medium risk</span>
        <span className="text-xs text-ink-soft">Lower back is taking the strain</span>
      </div>
      <div className="space-y-2.5">
        {rows.map(([l, p, t]) => <Bar key={l} label={l} pct={p} tone={t} />)}
      </div>
      <p className="text-[11px] text-ink-soft mt-3">Prevention: core bracing, neutral spine at release. Coaching guidance, not medical advice.</p>
    </div>
  );
}

function SamplePlan() {
  const days = [['Mon', 'Bowling drills · 60 min'], ['Tue', 'Legs & core strength'], ['Wed', 'Agility & sprints'], ['Thu', 'Match simulation'], ['Fri', 'Shoulder stability'], ['Sat', 'Easy session'], ['Sun', 'Rest & stretching']];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
      {days.map(([d, t]) => (
        <div key={d} className="flex gap-3 py-1 border-b border-line/70">
          <span className="w-9 text-ink-soft text-xs pt-0.5">{d}</span>
          <span>{t}</span>
        </div>
      ))}
      <div className="sm:col-span-2 mt-2 text-[11px] text-ink-soft">Diet: 1.6 g protein / kg · 3.5 L water · anti-inflammatory foods for recovery.</div>
    </div>
  );
}

function SampleCoach() {
  return (
    <div className="space-y-3 text-sm">
      <div className="ml-auto max-w-[85%] px-3 py-2 rounded-2xl rounded-br-sm bg-brand text-white">Why does my lower back hurt after bowling?</div>
      <div className="max-w-[92%] px-3 py-2 rounded-2xl rounded-bl-sm bg-white border border-line">
        Your report shows an 18° elbow change and a 14° trunk lean at release. A mixed action like this loads the lower back on every ball. Start with the core-bracing drill, and keep your hips and shoulders facing the same way at release.
        <div className="mt-2 flex flex-wrap gap-1.5">
          {['Mixed bowling action', 'Lower back stress', 'Core bracing drill'].map((s) => (
            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-sky text-brand-deep">Source · {s}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

const SAMPLES = { score: SampleScore, mistakes: SampleMistakes, injury: SampleInjury, plan: SamplePlan, coach: SampleCoach };

/* ---------- The section ---------- */

export default function FeatureTabs() {
  const [active, setActive] = useState(FEATURES[0].key);
  const feature = FEATURES.find((f) => f.key === active);
  const Sample = SAMPLES[feature.sample.kind];

  return (
    <section id="features" className="relative">
      {/* Pinned tab bar */}
      <div className="sticky top-16 z-10 bg-canvas/85 backdrop-blur border-y border-line">
        <div role="tablist" aria-label="What you get" className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-2 overflow-x-auto py-3 [scrollbar-width:none]">
          {FEATURES.map((f) => {
            const on = f.key === active;
            return (
              <button key={f.key} role="tab" aria-selected={on} onClick={() => setActive(f.key)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition ${on ? 'bg-ink text-white border-ink' : 'bg-white text-ink-soft border-line hover:border-ink/40 hover:text-ink'}`}>
                {f.tab}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div key={active} className="fade-up grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="eyebrow mb-4">{feature.tab}</p>
            <h3 className="font-serif text-4xl sm:text-5xl leading-[1.05] mb-5">{feature.title}</h3>
            <p className="text-ink-soft text-lg leading-relaxed">{feature.body}</p>
          </div>
          <div className="rounded-3xl border border-line bg-sky/60 p-5 sm:p-7">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold tracking-wider uppercase text-ink-soft">Sample · Cricket bowling</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-line text-ink-soft">Sample data</span>
            </div>
            <div className="rounded-2xl bg-white border border-line p-4 sm:p-5">
              <Sample />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
