import { useRef, useState } from 'react';
import { SPORTS } from '../../data/landing';
import { AVOID, FILMING, MAX_CLIP_SECONDS, MAX_FILE_MB, rulesFor } from '../../data/filming';

const LABEL = 'text-[11px] font-bold tracking-[0.18em] uppercase';

/** Step 1 of an analysis: choose sport, learn how to film it, then record or upload. */
export const HomePage = ({ onVideoSelect, onRecordClick, onError, initialSport }) => {
  const fileInputRef = useRef(null);
  const [selectedSport, setSelectedSport] = useState(
    SPORTS.some((s) => s.name === initialSport) ? initialSport : 'Cricket',
  );
  const sport = SPORTS.find((s) => s.name === selectedSport);
  const film = FILMING[sport.slug];
  const rules = rulesFor(sport.slug, sport.movement);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // lets the same file be picked again later
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      onError?.('That file is not a video. Choose an MP4, MOV or WebM video.');
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      onError?.(`That video is bigger than ${MAX_FILE_MB} MB. Cut it to the part with your movement, or film a shorter video.`);
      return;
    }
    onVideoSelect(file, selectedSport);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <p className="fade-up eyebrow mb-3">Step 1 of 3 · New analysis</p>
      <h1 className="fade-up font-display text-3xl sm:text-[2.6rem] mb-3">Choose <em>your sport</em></h1>
      <p className="fade-up delay-1 text-ink-soft mb-9">Then follow the filming guide below. A clear video gives a better report.</p>

      <div className="fade-up delay-1 grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3">
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

      <div className="grid lg:grid-cols-12 gap-3">
        {/* How to film */}
        <section className="fade-up delay-2 lg:col-span-8 p-7 sm:p-9 rounded-[2rem] bg-paper border border-line">
          <p className="eyebrow mb-3">How to film your {sport.movement.toLowerCase()}</p>
          <h2 className="font-display text-2xl sm:text-[2rem] leading-[1.05]">{film.do}</h2>
          <p className="text-ink-soft mt-3 leading-relaxed max-w-2xl">{film.detail}</p>
          <div className="mt-4 inline-flex items-start gap-2 px-4 py-2.5 rounded-2xl bg-sand text-sm">
            <span aria-hidden="true">📷</span>
            <span><strong>Camera:</strong> {film.camera}</span>
          </div>

          <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-5 mt-8">
            {rules.map((r, i) => (
              <li key={r.title} className="flex gap-4">
                <span className="w-7 h-7 shrink-0 rounded-full bg-ink text-white text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
                <span>
                  <span className="block font-semibold text-sm">{r.title}</span>
                  <span className="block text-sm text-ink-soft leading-relaxed mt-0.5">{r.text}</span>
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-8 pt-6 border-t border-line">
            <p className={`${LABEL} text-ink-soft mb-3`}>Avoid</p>
            <div className="flex flex-wrap gap-2">
              {AVOID.map((a) => (
                <span key={a} className="px-3 py-1.5 rounded-full bg-alert/10 text-red-800 text-xs font-semibold">✕ {a}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Record or upload */}
        <div className="fade-up delay-3 lg:col-span-4 relative overflow-hidden p-8 rounded-[2rem] bg-stage stage-grid text-white flex flex-col justify-center gap-3">
          <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-brand/30 blur-3xl" />
          <p className="relative font-display text-lg">Ready when you are</p>
          <p className="relative text-sm text-white/60 mb-3">
            {sport.metrics} checks on your {sport.movement.toLowerCase()}. You will see your clip before we analyse it.
          </p>
          <button onClick={() => onRecordClick(selectedSport)}
            className="relative w-full px-6 py-4 font-semibold rounded-full bg-brand text-white hover:bg-brand-deep transition shadow-xl shadow-brand/30">
            Record with camera
          </button>
          <button onClick={() => fileInputRef.current?.click()}
            className="relative w-full px-6 py-4 font-semibold rounded-full border border-white/20 hover:bg-white/10 transition">
            Upload a video
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*" className="hidden" />
          <p className="relative text-xs text-white/50 text-center mt-1">
            MP4, MOV or WebM · up to {MAX_FILE_MB} MB · we analyse up to {MAX_CLIP_SECONDS} seconds
          </p>
        </div>
      </div>
    </div>
  );
};
