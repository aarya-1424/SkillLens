import { useEffect, useRef, useState } from 'react';
import { analyse, STAGES } from '../../services/analysis';

const ORDER = ['model', 'track', 'measure', 'score'];

/** Real progress, driven by the tracker — not a fake timer. */
export default function Analysing({ videoUrl, slug, onDone, onError, onCancel }) {
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
      onStage: (key, p) => { setStage(key); setProgress(p ?? 0); },
    })
      .then(onDone)
      .catch((err) => {
        if (err.name === 'AbortError') return;
        onError(err.message || 'Something went wrong while analysing that video.');
      });
  }, [videoUrl, slug, onDone, onError]);

  const cancel = () => { abort.current?.abort(); onCancel(); };

  const stepIndex = ORDER.indexOf(stage);
  const overall = stage === 'track'
    ? (1 + progress * 2) / 4           // tracking is the long part
    : (stepIndex + 1) / ORDER.length;

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="relative w-20 h-20 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-sky" />
          <div className="absolute inset-0 rounded-full border-4 border-brand border-t-transparent animate-spin" />
        </div>

        <h2 className="font-serif text-3xl mb-2">Analysing your technique</h2>
        <p className="text-ink-soft mb-8">{STAGES[stage]}</p>

        <div className="h-2 rounded-full bg-sky overflow-hidden mb-3">
          <div className="h-full bg-brand rounded-full transition-all duration-300"
            style={{ width: `${Math.round(overall * 100)}%` }} />
        </div>

        <ol className="text-left space-y-2 mt-8">
          {ORDER.map((key, i) => {
            const done = i < stepIndex;
            const now = i === stepIndex;
            return (
              <li key={key} className={`flex items-center gap-3 text-sm ${now ? 'text-ink font-medium' : done ? 'text-ink-soft' : 'text-ink-soft/50'}`}>
                <span className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px]
                  ${done ? 'bg-mint text-white' : now ? 'bg-brand text-white' : 'bg-sky'}`}>
                  {done ? '✓' : i + 1}
                </span>
                {STAGES[key]}
              </li>
            );
          })}
        </ol>

        <p className="text-xs text-ink-soft mt-8">
          Your video is being read on this device — it is not uploaded for tracking.
        </p>
        <button onClick={cancel} className="mt-4 text-sm text-ink-soft hover:text-ink underline">
          Cancel
        </button>
      </div>
    </div>
  );
}
