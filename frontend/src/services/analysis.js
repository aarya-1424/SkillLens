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
import { measureAll } from '../lib/pose/measure';

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
 */
export async function analyse(videoUrl, slug, { onStage, signal } = {}) {
  const stage = (key, p = 0) => onStage?.(key, p);

  stage('model');
  const movement = await getMovement(slug);

  stage('track');
  const tracked = await trackVideo(videoUrl, {
    signal,
    onProgress: (p) => stage('track', p),
  });

  if (!tracked.seen) {
    throw new Error(
      'We could not find a person in that video. Film from the side with your whole body in frame, in good light.',
    );
  }

  stage('measure', 1);
  const { values, moments, sides, skipped } = measureAll(movement.metrics, tracked);
  if (!Object.keys(values).length) {
    throw new Error(
      'We could see you, but not clearly enough to measure anything. Try again from the side, further back, in better light.',
    );
  }

  stage('score');
  const report = await post(`/movements/${slug}/score`, { values });
  stage('done', 1);

  return {
    report,
    movement,
    tracked,
    moments,
    sides,
    unmeasured: skipped,
    confidence: tracked.confidence,
    lowConfidence: tracked.confidence < LOW_CONFIDENCE,
  };
}
