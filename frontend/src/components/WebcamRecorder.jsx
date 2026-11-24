import { useCallback, useEffect, useRef, useState } from 'react';
import { FILMING, MAX_CLIP_SECONDS } from '../data/filming';
import { clock } from '../lib/video';

const COUNTDOWN = 5; // seconds to walk back and get into position

/**
 * Records one clip from the camera.
 *
 * A short countdown gives the player time to step into frame, the
 * instruction stays on screen while recording, and recording stops by
 * itself at the analysis limit so no one films a minute we will not read.
 */
export function WebcamRecorder({ sport, onRecordingComplete, onCancel }) {
  const [phase, setPhase] = useState('idle'); // idle | countdown | recording
  const [count, setCount] = useState(COUNTDOWN);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startedAtRef = useRef(0);
  const film = FILMING[sport?.slug];

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  useEffect(() => {
    let alive = true;
    navigator.mediaDevices?.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      audio: false,
    }).then((stream) => {
      if (!alive) { stream.getTracks().forEach((t) => t.stop()); return; }
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setReady(true);
    }).catch(() => {
      setError('We could not open your camera. Allow the camera in your browser, or upload a video.');
    });
    return () => { alive = false; clearTimer(); stopCamera(); };
  }, [stopCamera]);

  const stop = useCallback(() => {
    clearTimer();
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
  }, []);

  const beginRecording = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    try {
      const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4']
        .find((t) => window.MediaRecorder?.isTypeSupported(t));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const seconds = (Date.now() - startedAtRef.current) / 1000;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'video/webm' });
        stopCamera();
        onRecordingComplete(blob, URL.createObjectURL(blob), seconds);
      };
      recorder.start();
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      setElapsed(0);
      setPhase('recording');
      timerRef.current = setInterval(() => {
        const s = (Date.now() - startedAtRef.current) / 1000;
        setElapsed(s);
        if (s >= MAX_CLIP_SECONDS) stop();
      }, 200);
    } catch {
      setError('Recording did not start in this browser. Please upload a video.');
    }
  }, [onRecordingComplete, stop, stopCamera]);

  const startCountdown = () => {
    setPhase('countdown');
    setCount(COUNTDOWN);
    let n = COUNTDOWN;
    timerRef.current = setInterval(() => {
      n -= 1;
      if (n <= 0) { clearTimer(); beginRecording(); } else setCount(n);
    }, 1000);
  };

  const cancel = () => { clearTimer(); stopCamera(); onCancel(); };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <p className="eyebrow mb-3">Step 1 of 3 · Record</p>
      <h1 className="font-display text-3xl sm:text-[2.6rem] mb-8">{film?.do || 'Record'} <em>on camera</em></h1>

      {error && (
        <div className="mb-3 px-5 py-3 rounded-3xl bg-alert/10 border border-alert/30 text-red-800 text-sm">{error}</div>
      )}

      <div className="grid lg:grid-cols-12 gap-3">
        <div className="lg:col-span-8 rounded-[2rem] bg-stage p-3">
          <div className="relative rounded-[1.5rem] overflow-hidden bg-black aspect-video">
            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover -scale-x-100" />

            {phase === 'countdown' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 text-white">
                <span className="font-display text-[7rem] leading-none">{count}</span>
                <span className="mt-4 text-sm text-white/80">Stand side-on. Your whole body must be in the picture</span>
              </div>
            )}

            {phase === 'recording' && (
              <>
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 text-white text-sm font-semibold tabular-nums">
                  <span className="w-2.5 h-2.5 rounded-full bg-brand animate-pulse" />
                  {clock(elapsed)} / {clock(MAX_CLIP_SECONDS)}
                </div>
                <div className="absolute top-4 right-4 px-4 py-1.5 rounded-full bg-black/60 text-white text-sm font-semibold">
                  {film?.do}
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/15">
                  <div className="h-full bg-brand transition-[width] duration-200"
                    style={{ width: `${Math.min(100, (elapsed / MAX_CLIP_SECONDS) * 100)}%` }} />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 rounded-[2rem] bg-paper border border-line p-7 flex flex-col">
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-ink-soft mb-2">What to do</p>
          <p className="font-display text-lg leading-tight mb-2">{film?.do}</p>
          <p className="text-sm text-ink-soft leading-relaxed mb-5">{film?.detail}</p>
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-ink-soft mb-2">Camera</p>
          <p className="text-sm text-ink-soft leading-relaxed mb-5">{film?.camera} Prop the phone up so it stays still.</p>
          <p className="text-xs text-ink-soft mb-6">
            You get {COUNTDOWN} seconds to get into position. Recording stops by itself at {MAX_CLIP_SECONDS} seconds.
          </p>

          <div className="mt-auto flex flex-col gap-2">
            {phase === 'idle' && (
              <button onClick={startCountdown} disabled={!ready}
                className="w-full px-6 py-4 rounded-full bg-brand text-white font-semibold hover:bg-brand-deep transition shadow-xl shadow-brand/25 disabled:opacity-40">
                Start recording
              </button>
            )}
            {phase === 'countdown' && (
              <button onClick={() => { clearTimer(); setPhase('idle'); }}
                className="w-full px-6 py-4 rounded-full bg-ink text-white font-semibold">
                Starting in {count}… (tap to stop)
              </button>
            )}
            {phase === 'recording' && (
              <button onClick={stop}
                className="w-full px-6 py-4 rounded-full bg-ink text-white font-semibold hover:bg-stage-soft transition">
                Stop recording
              </button>
            )}
            <button onClick={cancel}
              className="w-full px-6 py-4 rounded-full border border-line font-semibold hover:border-ink/40 transition">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
