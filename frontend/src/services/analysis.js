/**
 * One analysis, end to end.
 *
 *   1. Ask the backend WHAT to measure for this movement.
 *   2. Track the body in the browser (the video stays on the device).
 *   3. Take the measurements.
 *   4. Send the numbers to the backend, which scores them and writes the
 *      coaching words.
 *
 * Scoring never happens in the browser, so one video always gets one score
 * no matter whose phone it ran on.
 */
import { get, post } from './api';
import { trackVideo } from '../lib/pose/tracker';
import { measureAll, resolveSides } from '../lib/pose/measure';
import { findReps, sliceTracked } from '../lib/pose/reps';

export const STAGES = {
  model: 'Getting the tracker ready…',
  track: 'Following your body, frame by frame…',
  measure: 'Measuring your joint angles…',
  score: 'Comparing with correct form…',
  done: 'Done',
};

/** If we could see the body this poorly, say so rather than pretend. */
export const LOW_CONFIDENCE = 0.6;

export async function getMovement(slug) {
  return get(`/movements/${slug}`);
}

export async function listMovements() {
  return get('/movements');
}

/**
 * @param videoUrl  object URL of the recorded or uploaded clip
 * @param slug      movement slug, e.g. "cricket-bowling"
 * @param onStage   (stageKey, progress 0..1) => void
 * @param start     where in the video to begin (seconds)
 * @param length    real length of the video from `start`, when known
 */
export async function analyse(videoUrl, slug, { onStage, signal, start = 0, length } = {}) {
  const stage = (key, p = 0) => onStage?.(key, p);

  stage('model');
  const movement = await getMovement(slug);

  stage('track');
  const tracked = await trackVideo(videoUrl, {
    signal,
    start,
    length,
    onProgress: (p) => stage('track', p),
  });

  if (!tracked.seen) {
    throw new Error(
      'We could not find a person in that video. Film from the side with your whole body in frame, in good light.',
    );
  }

  stage('measure', 1);
  const sides = resolveSides(tracked.frames);
  const found = findReps(slug, tracked, sides);

  // One part per repetition (measured over a fixed window around its key
  // moment), or the whole clip for continuous movements like running.
  const parts = (found.length ? found : [{ start: 0, end: tracked.frames.length, peak: null }])
    .map((rep) => ({ rep, ...measureAll(movement.metrics, found.length ? sliceTracked(tracked, rep) : tracked, { sides }) }))
    .filter((p) => Object.keys(p.values).length);
  if (!parts.length) {
    throw new Error(
      'We could see you, but not clearly enough to measure anything. Try again from the side, further back, in better light.',
    );
  }

  stage('score');
  const scored = await Promise.all(parts.map(async (p) => ({
    ...p, report: await post(`/movements/${slug}/score`, { values: p.values }),
  })));

  // Report the TYPICAL repetition (the middle score), not the luckiest one,
  // and say how the others went.
  const byScore = [...scored].sort((a, b) => a.report.total - b.report.total);
  const typical = byScore[Math.floor((byScore.length - 1) / 2)];
  const best = byScore[byScore.length - 1];
  const { report, values, skipped } = typical;
  // Moments were found inside the repetition; move them back onto the full clip.
  const moments = Object.fromEntries(Object.entries(typical.moments)
    .map(([k, v]) => [k, v == null ? null : v + typical.rep.start]));
  const reps = found.length > 1 ? scored.map((p, i) => ({
    number: i + 1,
    total: p.report.total,
    grade: p.report.grade,
    peak_time: p.rep.peak != null ? tracked.times[p.rep.peak] : null,
    typical: p === typical,
    best: p === best,
  })) : null;
  stage('done', 1);

  return {
    report,
    movement,
    tracked,
    moments,
    sides,
    unmeasured: skipped,
    values,
    reps,
    consistency: reps && reps.length > 1 ? +(best.report.total - byScore[0].report.total).toFixed(1) : null,
    confidence: tracked.confidence,
    window: { start: tracked.start, end: tracked.start + tracked.duration },
    lowConfidence: tracked.confidence < LOW_CONFIDENCE,
  };
}
