import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SPORTS } from '../../data/landing';

/** "Choose your sport": ten tiles, and what we check for the one you pick. */
export default function SportPicker({ cta }) {
  const [name, setName] = useState(SPORTS[0].name);
  const sport = SPORTS.find((s) => s.name === name);

  return (
    <section id="sports" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <p className="eyebrow mb-4">Choose your sport</p>
          <h2 className="font-display text-3xl sm:text-[2.6rem]">
            Ten sports. <em>One key movement each.</em>
          </h2>
        </div>
        <p className="text-ink-soft max-w-sm">Pick one to see exactly what SkillLens checks, and where to put your camera.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {SPORTS.map((s) => {
          const on = s.name === name;
          return (
            <button key={s.name} onClick={() => setName(s.name)} aria-pressed={on}
              className={`group p-5 rounded-3xl border text-left transition ${on
                ? 'bg-brand text-white border-brand shadow-xl shadow-brand/25'
                : 'bg-paper border-line hover:border-ink/30 hover:-translate-y-0.5'}`}>
              <div className="text-3xl mb-6" aria-hidden="true">{s.icon}</div>
              <div className="font-display text-[0.8rem] leading-tight">{s.name}</div>
              <div className={`text-xs mt-1 ${on ? 'text-white/80' : 'text-ink-soft'}`}>{s.movement}</div>
            </button>
          );
        })}
      </div>

      <div key={name} className="fade-up grid md:grid-cols-5 gap-6 rounded-[2rem] bg-stage text-white p-7 sm:p-10">
        <div className="md:col-span-2">
          <p className="eyebrow mb-3">{sport.name}</p>
          <h3 className="font-display text-2xl sm:text-3xl mb-2">{sport.movement}</h3>
          <p className="text-sm text-white/60 mb-7">{sport.view}</p>
          <Link to={`${cta}?sport=${encodeURIComponent(sport.name)}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand text-white text-sm font-semibold hover:bg-brand-deep transition">
            Analyse my {sport.name.toLowerCase()} <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="md:col-span-3 grid sm:grid-cols-2 gap-5">
          <div className="rounded-3xl bg-stage-soft p-6">
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-white/50 mb-4">
              What we check · {sport.metrics} checks
            </p>
            <ul className="space-y-2.5">
              {sport.checks.map((c) => (
                <li key={c} className="flex gap-3 text-sm text-white/90">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand shrink-0" />{c}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl bg-stage-soft p-6">
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-white/50 mb-4">Camera tip</p>
            <p className="text-sm leading-relaxed text-white/90">{sport.tip}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
