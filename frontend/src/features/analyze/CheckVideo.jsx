import { useEffect, useRef, useState } from 'react';
import { FILMING, MAX_CLIP_SECONDS, MIN_CLIP_SECONDS, SHORT_CLIP_SECONDS } from '../../data/filming';
import { clock, readDuration } from '../../lib/video';

/**
 * Between "record / upload" and "analysing": show the clip, catch videos we
 * cannot use, and let the user pick the 20 seconds to analyse in a long one.
 */
export default function CheckVideo({ sport, videoUrl, knownDuration, source, onAnalyse, onBack }) {
  const [duration, setDuration] = useState(null); // null while reading
  const [start, setStart] = useState(0);
  const videoRef = useRef(null);
  const film = FILMING[sport.slug];

  useEffect(() => {
    let alive = true;
    readDuration(videoUrl).then((d) => {
      if (alive) setDuration(d || knownDuration || 0);
    });
    return () => { alive = false; };
  }, [videoUrl, knownDuration]);

  const reading = duration == null;
  const tooShort = !reading && duration < MIN_CLIP_SECONDS;
  const short = !reading && !tooShort && duration < SHORT_CLIP_SECONDS;
  const long = !reading && duration > MAX_CLIP_SECONDS;
  const end = long ? start + MAX_CLIP_SECONDS : duration ?? 0;
  const maxStart = long ? Math.floor((duration - MAX_CLIP_SECONDS) * 2) / 2 : 0;

  // Keep the preview playing inside the chosen part only.
  const keepInWindow = () => {
    const v = videoRef.current;
    if (!v || !long) return;
    if (v.currentTime < start || v.currentTime >= end) v.currentTime = start;
  };
  const moveStart = (value) => {
    setStart(value);
    if (videoRef.current) videoRef.current.currentTime = value;
  };

  const checks = [
    `Only the ${sport.movement.toLowerCase()}. No other movements in the clip.`,
    film?.reps ? `${film.do}, with a short pause between each.` : `${film?.do}, at a steady pace.`,
    'Your whole body is in frame, filmed from the side.',
  ];

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <p className="fade-up eyebrow mb-3">Step 2 of 3 · Check your video</p>
      <h1 className="fade-up font-display text-3xl sm:text-[2.6rem] mb-8">Ready to <em>analyse?</em></h1>

      <div className="grid lg:grid-cols-12 gap-3">
        {/* The clip */}
        <div className="fade-up lg:col-span-7 rounded-[2rem] bg-stage p-3">
          <div className="relative rounded-[1.5rem] overflow-hidden bg-black aspect-video">
            <video ref={videoRef} src={videoUrl} className="absolute inset-0 w-full h-full object-contain"
              autoPlay muted loop playsInline controls onTimeUpdate={keepInWindow} />
          </div>
          {long && (
            <div className="px-3 pt-4 pb-2 text-white">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold">Choose the {MAX_CLIP_SECONDS} seconds to analyse</span>
                <span className="text-white/60 tabular-nums">{clock(start)} to {clock(end)}</span>
              </div>
              {/* The whole video, with the chosen part lit up */}
              <div className="relative h-2.5 rounded-full bg-white/10 mb-3">
                <div className="absolute inset-y-0 rounded-full bg-brand"
                  style={{ left: `${(start / duration) * 100}%`, width: `${(MAX_CLIP_SECONDS / duration) * 100}%` }} />
              </div>
              <input type="range" min={0} max={maxStart} step={0.5} value={start}
                onChange={(e) => moveStart(Number(e.target.value))}
                aria-label="Where the analysed part starts" className="w-full accent-[#d7282f]" />
              <p className="text-xs text-white/50 mt-1">Move the sliders until your whole movement is inside the red part.</p>
            </div>
          )}
        </div>

        {/* The verdict */}
        <div className="fade-up delay-1 lg:col-span-5 rounded-[2rem] bg-paper border border-line p-7 sm:p-8 flex flex-col">
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="px-3 py-1 rounded-full bg-sand text-xs font-semibold">{sport.icon} {sport.movement}</span>
            <span className="px-3 py-1 rounded-full bg-sand text-xs font-semibold tabular-nums">
              {reading ? 'Reading length…' : `${clock(duration)} long`}
            </span>
          </div>

          {tooShort ? (
            <div className="px-5 py-4 rounded-3xl bg-alert/10 border border-alert/30 text-sm mb-6">
              <p className="font-semibold text-red-800">This video is too short.</p>
              <p className="text-ink mt-1 leading-relaxed">
                It is only {duration.toFixed(1)} seconds. We need at least {MIN_CLIP_SECONDS} seconds, and 10 to 15
                seconds is best: {film?.do.toLowerCase()}.
              </p>
            </div>
          ) : (
            <>
              {short && (
                <div className="px-5 py-3 rounded-3xl bg-amber/15 border border-amber/40 text-sm mb-5">
                  <strong>This video is short.</strong> It can work, but check that one full movement is in it.
                  10 to 15 seconds is best.
                </div>
              )}
              {long && (
                <div className="px-5 py-3 rounded-3xl bg-amber/15 border border-amber/40 text-sm mb-5">
                  <strong>Longer than {MAX_CLIP_SECONDS} seconds.</strong> We analyse {MAX_CLIP_SECONDS} seconds of it.
                  Use the slider under the video to pick the part with your repetitions.
                </div>
              )}
              <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-ink-soft mb-4">Before you analyse, check</p>
              <ul className="space-y-3 mb-6">
                {checks.map((c) => (
                  <li key={c} className="flex gap-3 text-sm">
                    <span className="w-6 h-6 shrink-0 rounded-full bg-ink text-white text-[11px] flex items-center justify-center" aria-hidden="true">✓</span>
                    <span className="text-ink-soft leading-relaxed">{c}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-ink-soft mb-6">
                If not, the report can measure the wrong moment. It is quicker to film again now.
              </p>
            </>
          )}

          <div className="mt-auto flex flex-col gap-2">
            {!tooShort && (
              <button disabled={reading}
                onClick={() => onAnalyse({ start: long ? start : 0, length: long ? MAX_CLIP_SECONDS : duration })}
                className="w-full px-6 py-4 rounded-full bg-brand text-white font-semibold hover:bg-brand-deep transition shadow-xl shadow-brand/25 disabled:opacity-50">
                {long ? `Analyse ${clock(start)} to ${clock(end)}` : 'Analyse this video'}
              </button>
            )}
            <button onClick={onBack}
              className="w-full px-6 py-4 rounded-full border border-line font-semibold hover:border-ink/40 transition">
              {source === 'record' ? 'Record again' : 'Choose a different video'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
