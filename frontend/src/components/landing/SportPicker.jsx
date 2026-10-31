import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SPORTS } from '../../data/landing';

export default function SportPicker({ cta }) {
  const [name, setName] = useState(SPORTS[0].name);
  const sport = SPORTS.find((s) => s.name === name);

  return (
    <section id="sports" className="bg-gradient-to-b from-sky-deep/70 to-sky border-y border-line">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
        <div className="max-w-2xl mb-10">
          <p className="eyebrow mb-4">Pick your sport</p>
          <h2 className="font-serif text-4xl sm:text-5xl leading-[1.05] mb-4">
            Ten sports. <em className="text-brand not-italic font-serif italic">One key movement each.</em>
          </h2>
          <p className="text-ink-soft text-lg">Choose a sport to see what SkillLens checks, and where to put your camera.</p>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {SPORTS.map((s) => {
            const on = s.name === name;
            return (
              <button key={s.name} onClick={() => setName(s.name)} aria-pressed={on}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-sm font-medium transition ${on ? 'bg-brand text-white border-brand shadow-md shadow-brand/25' : 'bg-white border-line text-ink hover:border-brand'}`}>
                <span aria-hidden="true">{s.icon}</span>{s.name}
              </button>
            );
          })}
        </div>

        <div key={name} className="fade-up grid md:grid-cols-5 gap-6 rounded-3xl bg-white border border-line p-6 sm:p-8">
          <div className="md:col-span-2">
            <div className="text-5xl mb-3" aria-hidden="true">{sport.icon}</div>
            <h3 className="font-serif text-3xl mb-1">{sport.movement}</h3>
            <p className="text-sm text-ink-soft mb-5">{sport.view}</p>
            <Link to={`${cta}?sport=${encodeURIComponent(sport.name)}`} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand text-white text-sm font-medium hover:bg-brand-deep transition">
              Analyse my {sport.name.toLowerCase()} <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="md:col-span-3 grid sm:grid-cols-2 gap-5">
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-ink-soft mb-3">What we check <span className="normal-case tracking-normal text-brand">· {sport.metrics} checks</span></p>
              <ul className="space-y-2">
                {sport.checks.map((c) => (
                  <li key={c} className="flex gap-2.5 text-sm"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand shrink-0" />{c}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wider uppercase text-ink-soft mb-3">Camera tip</p>
              <div className="rounded-2xl bg-brand-soft/60 border border-brand-soft p-4 text-sm leading-relaxed">📐 {sport.tip}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
