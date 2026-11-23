/**
 * Splits a clip into separate repetitions of the movement.
 *
 * Each movement has one simple signal that peaks once per repetition: the
 * hitting hand at its highest for overhead and throwing actions, the hips at
 * their lowest for a squat, the fastest leg swing for a kick. We find the
 * clear peaks in that signal and cut the clip half-way between them.
 *
 * Small peaks (walking back to your mark, a practice swing at half height)
 * are ignored: a repetition has to reach most of the height of the biggest
 * one. Running and cycling are continuous, so they are never split.
 */
import { point } from './geometry.js';

const SIGNAL = {
  'cricket-bowling': 'hand_high',
  'tennis-serve': 'hand_high',
  'badminton-smash': 'hand_high',
  'volleyball-spike': 'hand_high',
  'basketball-jumpshot': 'hand_high',
  'baseball-pitch': 'hand_high',
  'football-instep-kick': 'leg_speed',
  'gym-squat': 'hips_low',
};

/** The shortest gap between two repetitions, in seconds. */
const MIN_GAP_S = {
  'gym-squat': 1.2, 'football-instep-kick': 1.0, 'cricket-bowling': 1.5,
};
const MAX_REPS = 8;

/**
 * Each rep is measured over the SAME window around its key moment: this many
 * seconds before and after. That way three identical reps get three identical
 * scores, and one rep filmed on its own scores the same as that rep inside a
 * longer clip. Windows never overlap the next rep.
 */
const WINDOW_S = {
  'gym-squat': [1.2, 1.2],
  'football-instep-kick': [1.0, 0.6],
};
const DEFAULT_WINDOW_S = [1.2, 0.8];
const MIN_VIS = 0.3;

const seen = (p) => p && (p.visibility ?? 1) >= MIN_VIS;

function rawSignal(kind, frames, sides) {
  if (kind === 'hand_high') {
    const name = `${sides.bowl}_wrist`;
    // y grows downwards on screen, so a higher hand is a smaller y.
    return frames.map((f) => { const p = point(f, name); return seen(p) ? -p.y : null; });
  }
  if (kind === 'hips_low') {
    return frames.map((f) => { const p = point(f, 'mid_hip'); return seen(p) ? p.y : null; });
  }
  // leg_speed: how far either ankle moved since the last frame, whichever is faster.
  return frames.map((f, i) => {
    if (i === 0) return null;
    let best = null;
    for (const name of ['left_ankle', 'right_ankle']) {
      const p = point(f, name);
      const q = point(frames[i - 1], name);
      if (seen(p) && seen(q)) {
        const d = Math.hypot(p.x - q.x, p.y - q.y);
        best = best == null ? d : Math.max(best, d);
      }
    }
    return best;
  });
}

/** Fill short gaps by joining the dots, then smooth a little. */
function clean(series) {
  const out = [...series];
  let last = null;
  for (let i = 0; i < out.length; i += 1) {
    if (out[i] == null) continue;
    if (last != null && i - last > 1) {
      for (let k = last + 1; k < i; k += 1) {
        out[k] = out[last] + ((out[i] - out[last]) * (k - last)) / (i - last);
      }
    }
    last = i;
  }
  return out.map((_, i) => {
    const win = [out[i - 1], out[i], out[i + 1]].filter((v) => v != null);
    return win.length ? win.reduce((s, v) => s + v, 0) / win.length : null;
  });
}

/**
 * @param slug     movement slug
 * @param tracked  { frames, times, fps }
 * @param sides    from resolveSides()
 * @returns [{ start, end, peak }] frame indices (end exclusive). An empty list
 *          means "measure the whole clip" (a continuous movement, or no clear
 *          key moment). One item means one clear rep.
 */
export function findReps(slug, tracked, sides) {
  const kind = SIGNAL[slug];
  const { frames, fps } = tracked;
  if (!kind || frames.length < 3) return [];

  const s = clean(rawSignal(kind, frames, sides));
  const values = s.filter((v) => v != null);
  if (values.length < 3) return [];
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const range = hi - lo;
  if (range <= 0) return [];

  const gap = Math.max(2, Math.round((MIN_GAP_S[slug] ?? 0.9) * (fps || 15)));

  // Candidate peaks: the highest point within `gap` frames either side.
  const peaks = [];
  for (let i = 0; i < s.length; i += 1) {
    const v = s[i];
    if (v == null) continue;
    let isMax = true;
    for (let k = Math.max(0, i - gap); k <= Math.min(s.length - 1, i + gap); k += 1) {
      if (k !== i && s[k] != null && (s[k] > v || (s[k] === v && k < i))) { isMax = false; break; }
    }
    if (!isMax) continue;
    // A real repetition rises well above its surroundings and reaches most
    // of the height of the biggest one.
    const around = s.slice(Math.max(0, i - 2 * gap), Math.min(s.length, i + 2 * gap + 1))
      .filter((x) => x != null);
    const prominence = v - Math.min(...around);
    if (prominence >= 0.45 * range && v >= lo + 0.6 * range) peaks.push(i);
  }

  if (!peaks.length) return [];
  const kept = peaks.length > MAX_REPS
    ? [...peaks].sort((a, b) => s[b] - s[a]).slice(0, MAX_REPS).sort((a, b) => a - b)
    : peaks;

  const [before, after] = (WINDOW_S[slug] ?? DEFAULT_WINDOW_S).map((x) => Math.round(x * (fps || 15)));
  return kept.map((peak, i) => {
    const prevEdge = i === 0 ? 0 : Math.round((kept[i - 1] + peak) / 2);
    const nextEdge = i === kept.length - 1 ? frames.length : Math.round((peak + kept[i + 1]) / 2);
    return { peak, start: Math.max(prevEdge, peak - before), end: Math.min(nextEdge, peak + after + 1) };
  });
}

/** One repetition's part of the tracked clip. */
export function sliceTracked(tracked, rep) {
  return {
    ...tracked,
    frames: tracked.frames.slice(rep.start, rep.end),
    times: tracked.times.slice(rep.start, rep.end),
  };
}
