import { useEffect, useRef, useState } from 'react';
import { analyse, STAGES } from '../../services/analysis';

const ORDER = ['model', 'track', 'measure', 'score'];

/** Real progress, driven by the tracker — not a fake timer. */
export default function Analysing({ videoUrl, slug, start = 0, length, onDone, onError, onCancel }) {
  const [stage, setStage] = useState('model');
  const [progress, setProgress] = useState(0);
  const started = useRef(false);
  const abort = useRef(null);

  useEffect(() => {
    // Run once. React mounts effects twice in development, so the guard has
    // to survive that — and crucially the cleanup must NOT abort, or the
    // second mount finds `started` already set and nothing ever runs.
    // Cancelling is the Cancel button's job instead.
    if (started.current) return;
    started.current = true;
    abort.current = new AbortController();

    analyse(videoUrl, slug, {
      signal: abort.current.signal,
      start,
      length,
      onStage: (key, p) => { setStage(key); setProgress(p ?? 0); },
    })
      .then(onDone)
      .catch((err) => {
        if (err.name === 'AbortError') return;
        onError(err.message || 'Something went wrong while analysing that video.');
      });
  }, [videoUrl, slug, start, length, onDone, onError]);

  const cancel = () => { abort.current?.abort(); onCancel(); };

  const stepIndex = ORDER.indexOf(stage);
  const overall = stage === 'track'
    ? (1 + progress * 2) / 4           // tracking is the long part
    : (stepIndex + 1) / ORDER.length;

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 py-8">
      <div className="relative overflow-hidden w-full max-w-xl text-center rounded-[2.2rem] bg-stage stage-grid text-white px-7 sm:px-12 py-12">
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-brand/30 blur-3xl glow" />
        <div className="relative w-20 h-20 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-white/10" />
          <div className="absolute inset-0 rounded-full border-4 border-brand border-t-transparent animate-spin" />
        </div>

        <h2 className="relative font-display text-2xl sm:text-3xl mb-3">Analysing <em>your technique</em></h2>
        <p className="relative text-white/60 mb-8">{STAGES[stage]}</p>

        <div className="relative h-2 rounded-full bg-white/10 overflow-hidden mb-3">
          <div className="h-full bg-brand rounded-full transition-all duration-300"
            style={{ width: `${Math.round(overall * 100)}%` }} />
        </div>

        <ol className="relative text-left space-y-3 mt-8">
          {ORDER.map((key, i) => {
            const done = i < stepIndex;
            const now = i === stepIndex;
            return (
              <li key={key} className={`flex items-center gap-3 text-sm ${now ? 'text-white font-semibold' : done ? 'text-white/60' : 'text-white/30'}`}>
                <span className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[10px]
                  ${done ? 'bg-mint text-white' : now ? 'bg-brand text-white' : 'bg-white/10'}`}>
                  {done ? '✓' : i + 1}
                </span>
                {STAGES[key]}
              </li>
            );
          })}
        </ol>

        <p className="relative text-xs text-white/40 mt-8">
          Your video is being read on this device — it is not uploaded for tracking.
        </p>
        <button onClick={cancel} className="relative mt-5 px-5 py-2 rounded-full border border-white/20 text-sm font-semibold hover:bg-white/10 transition">
          Cancel
        </button>
      </div>
    </div>
  );
}
