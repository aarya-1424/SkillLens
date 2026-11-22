import { useRef, useState } from 'react';
import { SPORTS } from '../../data/landing';

const TIPS = [
  'Place the camera at your side, about hip height, 3–5 metres away.',
  'Keep your whole body in the frame — head to toes.',
  'Use good light. Avoid a bright window behind you.',
  'Record 5–15 seconds: 2–3 repetitions of the movement.',
];

/** Step 1 of an analysis: choose sport, read tips, then record or upload. */
export const HomePage = ({ onVideoSelect, onRecordClick, initialSport }) => {
  const fileInputRef = useRef(null);
  const [selectedSport, setSelectedSport] = useState(
    SPORTS.some((s) => s.name === initialSport) ? initialSport : 'Cricket',
  );
  const sport = SPORTS.find((s) => s.name === selectedSport);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) onVideoSelect(file, selectedSport);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <p className="fade-up eyebrow mb-3">New analysis</p>
      <h1 className="fade-up font-display text-3xl sm:text-[2.6rem] mb-3">Choose <em>your sport</em></h1>
      <p className="fade-up delay-1 text-ink-soft mb-9">Then record or upload a short video.</p>

      <div className="fade-up delay-1 grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {SPORTS.map((s) => {
          const active = s.name === selectedSport;
          return (
            <button key={s.name} onClick={() => setSelectedSport(s.name)} aria-pressed={active}
              className={`p-5 rounded-3xl border text-left transition ${active
                ? 'bg-brand text-white border-brand shadow-xl shadow-brand/25'
                : 'bg-paper border-line hover:border-ink/30 hover:-translate-y-0.5'}`}>
              <div className="text-3xl mb-5" aria-hidden="true">{s.icon}</div>
              <div className="font-display text-[0.78rem] leading-tight">{s.name}</div>
              <div className={`text-xs mt-1 ${active ? 'text-white/80' : 'text-ink-soft'}`}>{s.movement}</div>
            </button>
          );
        })}
      </div>

      <div className="grid md:grid-cols-5 gap-3">
        <div className="fade-up delay-2 md:col-span-3 p-8 rounded-[2rem] bg-paper border border-line">
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-ink-soft">Movement we will analyse</p>
          <div className="font-display text-2xl mt-2">{sport.movement}</div>
          <div className="text-sm text-ink-soft mt-1 mb-7">{sport.view} · {sport.metrics} checks</div>
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-ink-soft mb-4">Recording tips</p>
          <ul className="space-y-3">
            {TIPS.map((t, i) => (
              <li key={t} className="flex gap-4 text-sm">
                <span className="w-6 h-6 shrink-0 rounded-full bg-sand text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
                <span className="text-ink-soft leading-relaxed">{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="fade-up delay-3 md:col-span-2 relative overflow-hidden p-8 rounded-[2rem] bg-stage stage-grid text-white flex flex-col justify-center gap-3">
          <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-brand/30 blur-3xl" />
          <p className="relative font-display text-lg mb-3">Ready when you are</p>
          <button onClick={() => onRecordClick(selectedSport)}
            className="relative w-full px-6 py-4 font-semibold rounded-full bg-brand text-white hover:bg-brand-deep transition shadow-xl shadow-brand/30">
            Record with camera
          </button>
          <button onClick={() => fileInputRef.current?.click()}
            className="relative w-full px-6 py-4 font-semibold rounded-full border border-white/20 hover:bg-white/10 transition">
            Upload a video
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*" className="hidden" />
          <p className="relative text-xs text-white/50 text-center mt-1">MP4, WebM or MOV · up to 50 MB</p>
        </div>
      </div>
    </div>
  );
};
