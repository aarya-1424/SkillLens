/**
 * The maths that turns tracked body points into measurements.
 *
 * MediaPipe gives 33 points per frame, each with x, y (0–1 across the frame),
 * z, and a visibility score. Everything SkillLens measures is built from
 * those points, so this file is deliberately small and heavily tested.
 *
 * Note on y: in image coordinates y grows DOWNWARDS. Anything that talks
 * about "higher" or "lower" on the body has to remember that.
 */

// MediaPipe Pose landmark order.
export const LANDMARKS = [
  'nose', 'left_eye_inner', 'left_eye', 'left_eye_outer', 'right_eye_inner', 'right_eye',
  'right_eye_outer', 'left_ear', 'right_ear', 'mouth_left', 'mouth_right',
  'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist',
  'left_pinky', 'right_pinky', 'left_index', 'right_index', 'left_thumb', 'right_thumb',
  'left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle',
  'left_heel', 'right_heel', 'left_foot_index', 'right_foot_index',
];

export const INDEX = Object.fromEntries(LANDMARKS.map((n, i) => [n, i]));

/** The skeleton lines we draw over the video. */
export const BONES = [
  ['left_shoulder', 'right_shoulder'], ['left_hip', 'right_hip'],
  ['left_shoulder', 'left_hip'], ['right_shoulder', 'right_hip'],
  ['left_shoulder', 'left_elbow'], ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'], ['right_elbow', 'right_wrist'],
  ['left_hip', 'left_knee'], ['left_knee', 'left_ankle'], ['left_ankle', 'left_foot_index'],
  ['right_hip', 'right_knee'], ['right_knee', 'right_ankle'], ['right_ankle', 'right_foot_index'],
];

/**
 * Read one point out of a frame. Virtual points are worked out on the fly.
 * A frame is null wherever the tracker found no body, so every read has to
 * cope with that rather than assume a person was there.
 */
export function point(frame, name) {
  if (!frame) return null;
  if (name === 'mid_hip') return midpoint(frame, 'left_hip', 'right_hip');
  if (name === 'mid_shoulder') return midpoint(frame, 'left_shoulder', 'right_shoulder');
  const i = INDEX[name];
  return i === undefined ? null : frame[i] ?? null;
}

function midpoint(frame, a, b) {
  const p = frame[INDEX[a]];
  const q = frame[INDEX[b]];
  if (!p || !q) return null;
  return {
    x: (p.x + q.x) / 2,
    y: (p.y + q.y) / 2,
    z: ((p.z ?? 0) + (q.z ?? 0)) / 2,
    visibility: Math.min(p.visibility ?? 1, q.visibility ?? 1),
  };
}

/** Angle in degrees at point b, between a and c. 180 = straight. */
export function angleAt(a, b, c) {
  if (!a || !b || !c) return null;
  const v1x = a.x - b.x;
  const v1y = a.y - b.y;
  const v2x = c.x - b.x;
  const v2y = c.y - b.y;
  const len = Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y);
  if (len < 1e-9) return null;
  const cos = Math.min(1, Math.max(-1, (v1x * v2x + v1y * v2y) / len));
  return (Math.acos(cos) * 180) / Math.PI;
}

/**
 * How far the line a->b tips away from straight up, in degrees.
 * 0 = perfectly upright, 90 = horizontal. Always positive.
 */
export function angleToVertical(a, b) {
  if (!a || !b) return null;
  const dx = b.x - a.x;
  const dy = b.y - a.y; // image y grows downwards
  if (Math.hypot(dx, dy) < 1e-9) return null;
  return (Math.atan2(Math.abs(dx), Math.abs(dy)) * 180) / Math.PI;
}

/** Rough body height in frame units, used to turn pixels into "% of height". */
export function bodyHeight(frame) {
  const head = point(frame, 'nose');
  const hip = point(frame, 'mid_hip');
  const la = point(frame, 'left_ankle');
  const ra = point(frame, 'right_ankle');
  const foot = la && ra ? { y: Math.max(la.y, ra.y) } : la || ra;
  if (!head || !foot) return hip && head ? Math.abs(hip.y - head.y) * 2.2 : null;
  return Math.abs(foot.y - head.y) || null;
}

/** Sideways gap between two points, as a percentage of body height. */
export function horizontalGapPct(frame, aName, bName) {
  const a = point(frame, aName);
  const b = point(frame, bName);
  const h = bodyHeight(frame);
  if (!a || !b || !h) return null;
  return (Math.abs(a.x - b.x) / h) * 100;
}

/** How far a point travels up and down across frames, as a % of body height. */
export function verticalRangePct(frames, name) {
  const ys = [];
  let heights = 0;
  let n = 0;
  for (const f of frames) {
    const p = point(f, name);
    const h = bodyHeight(f);
    if (p && h) { ys.push(p.y); heights += h; n += 1; }
  }
  if (ys.length < 2 || !n) return null;
  return ((Math.max(...ys) - Math.min(...ys)) / (heights / n)) * 100;
}

/** The angle series for a named joint, one value per frame (null where unseen). */
export function angleSeries(frames, aName, bName, cName) {
  return frames.map((f) => angleAt(point(f, aName), point(f, bName), point(f, cName)));
}

/** Fastest rate of change of an angle series, in degrees per second. */
export function peakSpeed(series, times) {
  let best = 0;
  for (let i = 1; i < series.length; i += 1) {
    const a = series[i - 1];
    const b = series[i];
    const dt = times[i] - times[i - 1];
    if (a == null || b == null || !dt) continue;
    best = Math.max(best, Math.abs(b - a) / dt);
  }
  return best || null;
}

/**
 * Repeats per minute (strides, pedal turns) from a point's up-and-down motion.
 * Counts how many times the series crosses its own average going downwards.
 */
export function cadence(frames, name, times) {
  const ys = frames.map((f) => point(f, name)?.y ?? null);
  const seen = ys.filter((y) => y != null);
  if (seen.length < 6) return null;
  const mean = seen.reduce((s, y) => s + y, 0) / seen.length;
  let crossings = 0;
  let prev = null;
  for (const y of ys) {
    if (y == null) continue;
    if (prev != null && prev < mean && y >= mean) crossings += 1;
    prev = y;
  }
  const seconds = times[times.length - 1] - times[0];
  if (!seconds || !crossings) return null;
  return (crossings / seconds) * 60;
}

/** Index of the frame where a series peaks (or bottoms out). */
export function peakIndex(series, { lowest = false } = {}) {
  let best = null;
  let bestI = null;
  series.forEach((v, i) => {
    if (v == null) return;
    if (best == null || (lowest ? v < best : v > best)) { best = v; bestI = i; }
  });
  return bestI;
}

/** Average visibility of the points a measurement depends on. */
export function confidenceOf(frame, names) {
  if (!frame) return 0;
  const vals = names.map((n) => point(frame, n)?.visibility ?? 0);
  return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
}
