// Run with:  npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INDEX } from '../geometry.js';
import { findReps, sliceTracked } from '../reps.js';

const FPS = 15;

/** A fake clip: 33 points per frame, with the right wrist following `wristY(t)`. */
function clip(seconds, wristY, hipY = () => 0.55) {
  const frames = [];
  const times = [];
  for (let i = 0; i < seconds * FPS; i += 1) {
    const t = i / FPS;
    const f = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0.9 }));
    f[INDEX.right_wrist] = { x: 0.5, y: wristY(t), visibility: 0.9 };
    f[INDEX.left_hip] = { x: 0.48, y: hipY(t), visibility: 0.9 };
    f[INDEX.right_hip] = { x: 0.52, y: hipY(t), visibility: 0.9 };
    frames.push(f);
    times.push(t);
  }
  return { frames, times, fps: FPS };
}

const sides = { bowl: 'right', lead: 'left', trail: 'right' };
// A bump of height 0.4 centred at each time in `at`.
const bumps = (at, width = 0.35) => (t) =>
  0.8 - at.reduce((s, c) => s + 0.4 * Math.exp(-((t - c) ** 2) / (2 * width ** 2) * 4), 0);

test('three smashes are found as three reps, each measured over the same window', () => {
  const tracked = clip(10, bumps([2, 5, 8]));
  const reps = findReps('badminton-smash', tracked, sides);
  assert.equal(reps.length, 3);
  reps.forEach((r, i) => assert.ok(Math.abs(r.peak / FPS - [2, 5, 8][i]) < 0.3));
  // Same length and same position around each peak, so identical reps score identically.
  const shapes = reps.map((r) => [r.peak - r.start, r.end - r.peak]);
  assert.ok(shapes.every(([b, a]) => b === shapes[0][0] && a === shapes[0][1]));
  reps.slice(1).forEach((r, i) => assert.ok(r.start >= reps[i].end));   // never overlap
});

test('a single rep gets the same window as it would inside a longer clip', () => {
  const [alone] = findReps('badminton-smash', clip(5, bumps([2.5])), sides);
  const [, middle] = findReps('badminton-smash', clip(10, bumps([2, 5, 8])), sides);
  assert.deepEqual([alone.peak - alone.start, alone.end - alone.peak],
    [middle.peak - middle.start, middle.end - middle.peak]);
});

test('a small half-height swing is not counted as a rep', () => {
  const big = bumps([2, 7]);
  const tracked = clip(10, (t) => big(t) - (Math.abs(t - 4.5) < 0.3 ? 0.12 : 0));
  assert.equal(findReps('badminton-smash', tracked, sides).length, 2);
});

test('running and cycling are never split', () => {
  assert.deepEqual(findReps('running-stride', clip(10, bumps([2, 5, 8])), sides), []);
  assert.deepEqual(findReps('cycling-pedal', clip(10, bumps([2, 5, 8])), sides), []);
});

test('squats are found from the hips going down', () => {
  const hips = (t) => 0.55 + 0.15 * Math.max(0, Math.sin((t / 2.5) * Math.PI * 2));
  const tracked = clip(10, () => 0.6, hips);
  const reps = findReps('gym-squat', tracked, sides);
  assert.ok(reps.length >= 3 && reps.length <= 4, `found ${reps.length}`);
});

test('a slice keeps the original clip times', () => {
  const tracked = clip(10, bumps([2, 5, 8]));
  const [, second] = findReps('badminton-smash', tracked, sides);
  const part = sliceTracked(tracked, second);
  assert.equal(part.times[0], tracked.times[second.start]);
  assert.equal(part.frames.length, second.end - second.start);
});
