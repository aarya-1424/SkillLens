import { useEffect, useRef, useState } from 'react';

/**
 * The hero picture: a looping figure with the body-tracking skeleton drawn on top,
 * and live angle readouts that are really computed from the drawing.
 *
 * Pass `videoSrc` to play a real clip underneath (our own recording, never stock
 * footage). Without one, a stylised field is drawn instead.
 */

// 14 joints, side view, in a 100x100 box.
// 0 head 1 neck 2 lShoulder 3 rShoulder 4 lElbow 5 rElbow 6 lWrist 7 rWrist
// 8 lHip 9 rHip 10 lKnee 11 rKnee 12 lAnkle 13 rAnkle
const POSES = [
  [[52, 12], [52, 20], [53, 23], [51, 23], [61, 31], [43, 31], [65, 25], [39, 39], [51, 47], [49, 47], [42, 61], [60, 59], [36, 75], [63, 75]],
  [[52, 11], [52, 19], [53, 22], [51, 22], [55, 33], [49, 33], [57, 41], [47, 41], [51, 46], [49, 46], [50, 61], [53, 61], [48, 77], [57, 73]],
  [[52, 12], [52, 20], [53, 23], [51, 23], [43, 31], [61, 31], [39, 39], [65, 25], [51, 47], [49, 47], [60, 59], [42, 61], [63, 75], [36, 75]],
  [[52, 11], [52, 19], [53, 22], [51, 22], [49, 33], [55, 33], [47, 41], [57, 41], [51, 46], [49, 46], [53, 61], [50, 61], [57, 73], [48, 77]],
];

const BONES = [[0, 1], [1, 2], [1, 3], [2, 4], [4, 6], [3, 5], [5, 7], [1, 8], [1, 9], [8, 9], [8, 10], [10, 12], [9, 11], [11, 13]];

const ease = (t) => 0.5 - Math.cos(Math.PI * t) / 2;

function lerpPose(a, b, t) {
  return a.map(([x, y], i) => [x + (b[i][0] - x) * t, y + (b[i][1] - y) * t]);
}

/** Angle (degrees) at point b between a and c. */
function angleAt(a, b, c) {
  const v1 = [a[0] - b[0], a[1] - b[1]];
  const v2 = [c[0] - b[0], c[1] - b[1]];
  const dot = v1[0] * v2[0] + v1[1] * v2[1];
  const len = Math.hypot(...v1) * Math.hypot(...v2);
  return Math.round((Math.acos(Math.min(1, Math.max(-1, dot / len))) * 180) / Math.PI);
}

const CYCLE_MS = 1400;

export default function HeroVisual({ videoSrc, compact = false }) {
  const [pose, setPose] = useState(POSES[0]);
  const frame = useRef(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return undefined;
    const start = performance.now();
    const tick = (now) => {
      // rAF's timestamp can be a hair before `start`, so keep the phase in [0, 1).
      const t = (((now - start) % CYCLE_MS) + CYCLE_MS) % CYCLE_MS / CYCLE_MS;
      const seg = Math.min(t * POSES.length, POSES.length - 0.0001);
      const i = Math.floor(seg);
      const next = POSES[(i + 1) % POSES.length];
      setPose(lerpPose(POSES[i], next, ease(seg - i)));
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, []);

  const knee = angleAt(pose[9], pose[11], pose[13]);
  const elbow = angleAt(pose[3], pose[5], pose[7]);
  const kneeOk = knee > 120;

  return (
    <div className={`relative w-full ${compact ? 'aspect-[4/3]' : 'aspect-[4/5] max-w-md'} rounded-3xl overflow-hidden border border-line bg-white shadow-[0_30px_80px_-30px_rgba(37,99,235,0.35)]`}>
      {videoSrc ? (
        <video src={videoSrc} className="absolute inset-0 w-full h-full object-cover" autoPlay muted loop playsInline />
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-sky via-white to-[#e4f3ea]" />
          <div className="absolute inset-x-0 bottom-0 h-[28%] bg-gradient-to-t from-[#cfe8d8] to-transparent" />
          <div className="absolute inset-x-6 bottom-[22%] h-px bg-ink/10" />
        </>
      )}

      <div className="scan-line absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand to-transparent" />

      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" aria-hidden="true">
        {BONES.map(([a, b], i) => (
          <line key={i} x1={pose[a][0]} y1={pose[a][1]} x2={pose[b][0]} y2={pose[b][1]} stroke="#2563eb" strokeWidth="1.3" strokeLinecap="round" />
        ))}
        {pose.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i === 0 ? 4.2 : 1.6} fill={i === 0 ? 'none' : '#fff'} stroke="#2563eb" strokeWidth={i === 0 ? 1.3 : 0.9} />
        ))}
        {/* Knee angle arc on the right leg */}
        <circle cx={pose[11][0]} cy={pose[11][1]} r="4.5" fill="none" stroke={kneeOk ? '#10b981' : '#f59e0b'} strokeWidth="0.8" strokeDasharray="3 2" />
      </svg>

      {/* Readouts */}
      <div className="absolute left-3 top-3 flex items-center gap-2 text-[11px] font-medium">
        <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/90 text-ink border border-line">
          <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" /> Tracking · 33 points
        </span>
      </div>
      <div className="absolute right-3 bottom-3 flex flex-col items-end gap-1.5 text-[11px] font-medium tabular-nums">
        <span className={`px-2 py-1 rounded-md bg-white/90 border border-line ${kneeOk ? 'text-emerald-700' : 'text-amber-700'}`}>Knee {knee}°</span>
        <span className="px-2 py-1 rounded-md bg-white/90 border border-line text-ink">Elbow {elbow}°</span>
      </div>
    </div>
  );
}
