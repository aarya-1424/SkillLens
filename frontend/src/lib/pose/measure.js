/**
 * Turns tracked body points into the measurements the scoring engine expects.
 *
 * The backend owns WHAT to measure (every metric says which points, which
 * moment, and which kind of maths). This file does the measuring and hands
 * back `{ metric id -> value }`. Nothing here decides what is good or bad.
 *
 * Honest limits of a single side-on camera:
 *  - Rotation towards the camera is judged from how the hip and shoulder
 *    lines narrow on screen. It is a fair proxy, not a motion-capture lab.
 *  - A metric whose points are not clearly visible is SKIPPED, never guessed.
 */
import {
  angleAt, angleSeries, angleToVertical, bodyHeight, cadence, confidenceOf,
  horizontalGapPct, peakIndex, peakSpeed, point, verticalRangePct,
} from './geometry';

/** Below this average visibility we refuse to report a measurement. */
const MIN_VISIBILITY = 0.5;

/** Which three points make the angle at a named joint. */
const JOINT_TRIPLE = {
  knee: (s) => [`${s}_hip`, `${s}_knee`, `${s}_ankle`],
  elbow: (s) => [`${s}_shoulder`, `${s}_elbow`, `${s}_wrist`],
  shoulder: (s) => [`${s}_hip`, `${s}_shoulder`, `${s}_elbow`],
  hip: (s) => [`${s}_shoulder`, `${s}_hip`, `${s}_knee`],
};

// ── which side is which ──────────────────────────────────────────────────────

function travel(frames, name) {
  let total = 0;
  let prev = null;
  for (const f of frames) {
    const p = f && point(f, name);
    if (p && prev) total += Math.hypot(p.x - prev.x, p.y - prev.y);
    prev = p || prev;
  }
  return total;
}

function meanVisibility(frames, names) {
  let sum = 0;
  let n = 0;
  for (const f of frames) {
    if (!f) continue;
    sum += confidenceOf(f, names);
    n += 1;
  }
  return n ? sum / n : 0;
}

/**
 * Work out which arm is doing the action and which leg is in front, so the
 * same metric definition works for a right-arm and a left-arm athlete.
 */
export function resolveSides(frames) {
  const live = frames.filter(Boolean);
  const action = travel(live, 'right_wrist') >= travel(live, 'left_wrist') ? 'right' : 'left';

  // Lead leg: the ankle that spends most of the clip further forward, in
  // whichever direction the body is facing.
  let leadScore = 0;
  for (const f of live) {
    const l = point(f, 'left_ankle');
    const r = point(f, 'right_ankle');
    if (l && r) leadScore += r.x > l.x ? 1 : -1;
  }
  let lead = leadScore >= 0 ? 'right' : 'left';
  // For movements with no stride, prefer whichever side the camera sees best.
  const leftSeen = meanVisibility(live, ['left_hip', 'left_knee', 'left_ankle']);
  const rightSeen = meanVisibility(live, ['right_hip', 'right_knee', 'right_ankle']);
  if (Math.abs(leftSeen - rightSeen) > 0.15) lead = rightSeen > leftSeen ? 'right' : 'left';

  return { bowl: action, lead, trail: lead === 'right' ? 'left' : 'right' };
}

const fill = (name, sides) =>
  name.replace('{bowl}', sides.bowl).replace('{lead}', sides.lead).replace('{trail}', sides.trail);

// ── key moments ──────────────────────────────────────────────────────────────

/** Width of the hip or shoulder line on screen — narrows as the body turns. */
function lineWidthSeries(frames, which) {
  const a = which === 'hip_line' ? 'left_hip' : 'left_shoulder';
  const b = which === 'hip_line' ? 'right_hip' : 'right_shoulder';
  return frames.map((f) => {
    if (!f) return null;
    const p = point(f, a);
    const q = point(f, b);
    return p && q ? Math.abs(p.x - q.x) : null;
  });
}

function seriesY(frames, name) {
  return frames.map((f) => (f ? point(f, name)?.y ?? null : null));
}

/**
 * Find the frame each key moment refers to.
 * Remember y grows downwards: "highest" means the smallest y.
 */
export function findMoments(frames, times, sides) {
  const wristY = seriesY(frames, `${sides.bowl}_wrist`);
  const hipY = seriesY(frames, 'mid_hip');
  const leadAnkleY = seriesY(frames, `${sides.lead}_ankle`);
  const elbow = angleSeries(frames, `${sides.bowl}_shoulder`, `${sides.bowl}_elbow`, `${sides.bowl}_wrist`);

  const release = peakIndex(wristY, { lowest: true });   // wrist at its highest
  const lowest = peakIndex(hipY);                        // hips at their lowest
  const highest = peakIndex(hipY, { lowest: true });     // hips at their highest
  const footStrike = peakIndex(leadAnkleY);              // lead ankle at its lowest

  // The loaded position: the most cocked the arm gets before release.
  let trophy = null;
  if (release != null) {
    let best = null;
    for (let i = 0; i < release; i += 1) {
      if (elbow[i] == null) continue;
      if (best == null || elbow[i] < elbow[best]) best = i;
    }
    trophy = best;
  }

  // Arm horizontal: the frame before release where the upper arm is level
  // with the ground. Cricket's legal-elbow rule is measured from here to
  // release, NOT from wherever the arm happens to be most folded.
  let armHorizontal = null;
  if (release != null) {
    let bestGap = Infinity;
    for (let i = 0; i < release; i += 1) {
      const sh = frames[i] && point(frames[i], `${sides.bowl}_shoulder`);
      const el = frames[i] && point(frames[i], `${sides.bowl}_elbow`);
      if (!sh || !el) continue;
      const fromHorizontal = Math.abs(sh.y - el.y); // 0 when perfectly level
      if (fromHorizontal < bestGap) { bestGap = fromHorizontal; armHorizontal = i; }
    }
  }

  // Take-off: the first frame after the lowest point where the hips rise.
  let takeoff = null;
  if (lowest != null) {
    for (let i = lowest + 1; i < hipY.length; i += 1) {
      if (hipY[i] != null && hipY[lowest] != null && hipY[i] < hipY[lowest]) { takeoff = i; break; }
    }
  }

  return {
    whole_clip: null,
    release, contact: release, trophy: trophy ?? release,
    arm_horizontal: armHorizontal ?? trophy ?? release,
    foot_strike: footStrike, lowest, highest, takeoff: takeoff ?? highest,
  };
}

// ── the measurements ─────────────────────────────────────────────────────────

function valueAtMoment(metric, ctx, frameIndex) {
  const { frames, times, sides } = ctx;
  const frame = frames[frameIndex];
  if (!frame) return null;
  const pts = metric.points.map((p) => fill(p, sides));

  switch (metric.how) {
    case 'angle':
      return angleAt(point(frame, pts[0]), point(frame, pts[1]), point(frame, pts[2]));

    case 'vert':
      return angleToVertical(point(frame, pts[0]), point(frame, pts[1]));

    case 'hgap':
      return horizontalGapPct(frame, pts[0], pts[1]);

    case 'change': {
      const b = ctx.moments[metric.moment_b];
      if (b == null || !frames[b]) return null;
      const at = (i) => angleAt(point(frames[i], pts[0]), point(frames[i], pts[1]), point(frames[i], pts[2]));
      const first = at(frameIndex);
      const second = at(b);
      return first == null || second == null ? null : Math.abs(second - first);
    }

    case 'lrgap': {
      const [a, b] = pts;
      const joint = a.split('_').slice(1).join('_');
      // Hip or shoulder LINE tilt (one side dropping), not two joint angles.
      if (joint === 'hip' || joint === 'shoulder') {
        const p = point(frame, a);
        const q = point(frame, b);
        if (!p || !q) return null;
        return (Math.atan2(Math.abs(p.y - q.y), Math.abs(p.x - q.x) || 1e-9) * 180) / Math.PI;
      }
      const triple = JOINT_TRIPLE[joint];
      if (!triple) return null;
      const left = angleAt(...triple('left').map((n) => point(frame, n)));
      const right = angleAt(...triple('right').map((n) => point(frame, n)));
      return left == null || right == null ? null : Math.abs(left - right);
    }

    default:
      return null;
  }
}

function wholeClipValue(metric, ctx) {
  const { frames, times, sides } = ctx;
  const pts = metric.points.map((p) => fill(p, sides));

  switch (metric.how) {
    case 'vrange':
      return verticalRangePct(frames.filter(Boolean), pts[0]);

    case 'cadence':
      return cadence(frames, pts[0], times);

    case 'speed': {
      const series = frames.map((f) =>
        f ? angleToVertical(point(f, pts[0]), point(f, pts[1])) : null);
      return peakSpeed(series, times);
    }

    case 'order': {
      // When did each thing move fastest? The gap between those two moments
      // tells us the order the body fired in. Negative = the wrong way round.
      const speedPeak = (name) => {
        const series = name.endsWith('_line')
          ? lineWidthSeries(frames, name)
          : seriesY(frames, name);
        const rates = series.map((v, i) =>
          i === 0 || v == null || series[i - 1] == null
            ? null
            : Math.abs(v - series[i - 1]) / (times[i] - times[i - 1] || 1));
        return peakIndex(rates);
      };
      const i1 = speedPeak(pts[0]);
      const i2 = speedPeak(pts[1]);
      if (i1 == null || i2 == null) return null;
      return (times[i2] - times[i1]) * 1000;
    }

    default: {
      // An ordinary angle with no single moment: take the average.
      const vals = frames
        .map((_, i) => valueAtMoment(metric, ctx, i))
        .filter((v) => v != null);
      return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
    }
  }
}

/**
 * Measure every metric of a movement.
 *
 * @param metrics  from GET /movements/{slug} (needs how, points, moment)
 * @param tracked  from trackVideo()
 * @returns {{values: Object, moments: Object, sides: Object, skipped: string[]}}
 */
export function measureAll(metrics, tracked) {
  const { frames, times } = tracked;
  const sides = resolveSides(frames);
  const moments = findMoments(frames, times, sides);
  const ctx = { frames, times, sides, moments };

  const values = {};
  const skipped = [];

  for (const metric of metrics) {
    const wholeClip = metric.moment === 'whole_clip';
    const frameIndex = wholeClip ? null : moments[metric.moment];

    // Can we actually see the body parts this measurement needs?
    const names = metric.points
      .map((p) => fill(p, sides))
      .filter((n) => !n.endsWith('_line'));
    const check = wholeClip
      ? frames.find(Boolean)
      : frames[frameIndex];
    if (!check || (names.length && confidenceOf(check, names) < MIN_VISIBILITY)) {
      skipped.push(metric.id);
      continue;
    }

    const value = wholeClip || frameIndex == null
      ? wholeClipValue(metric, ctx)
      : valueAtMoment(metric, ctx, frameIndex);

    if (value == null || !Number.isFinite(value)) skipped.push(metric.id);
    else values[metric.id] = +(value * (metric.scale ?? 1)).toFixed(2);
  }

  return { values, moments, sides, skipped };
}
