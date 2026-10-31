/**
 * Body tracking. Runs Google's MediaPipe Pose in the browser, so the video
 * never has to leave the phone for this step.
 *
 * We step through the clip at a fixed rate rather than playing it, because a
 * played video drops frames on a slow phone and we need the same answer every
 * time. Same video in, same landmarks out.
 */
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.0/wasm';
const MODEL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

/** Frames per second we sample. Enough for technique, kind to slow phones. */
export const SAMPLE_FPS = 15;
const MAX_SECONDS = 20;

let landmarkerPromise = null;

/** Loads the model once and reuses it for every later video. */
export function loadTracker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const fileset = await FilesetResolver.forVisionTasks(WASM);
      return PoseLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL, delegate: 'GPU' },
        // IMAGE, deliberately, not VIDEO. Video mode carries tracking state
        // from frame to frame and from clip to clip, so the SAME video
        // analysed twice came back with different angles. Treating every
        // frame as a fresh image costs a little smoothness and buys us the
        // promise the whole product rests on: one video, one score, always.
        runningMode: 'IMAGE',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    })().catch((err) => {
      landmarkerPromise = null; // let the next attempt retry
      throw err;
    });
  }
  return landmarkerPromise;
}

function videoFrom(url) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.onloadeddata = () => resolve(video);
    video.onerror = () => reject(new Error('That video could not be opened.'));
    video.src = url;
  });
}

/**
 * Move the video to `time` and wait for the frame to be ready.
 *
 * Two traps here, both of which hang the whole analysis if missed:
 *  - setting currentTime to the value it already holds fires no 'seeked'
 *    event at all, which is exactly what happens on the very first frame;
 *  - a browser can occasionally swallow a seek, so we never wait forever.
 */
function seek(video, time) {
  if (Math.abs(video.currentTime - time) < 1e-3 && video.readyState >= 2) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    let timer;
    const done = () => {
      clearTimeout(timer);
      video.removeEventListener('seeked', done);
      resolve();
    };
    video.addEventListener('seeked', done);
    timer = setTimeout(done, 2000);
    video.currentTime = time;
  });
}

/**
 * Track one video.
 *
 * @returns {Promise<{frames: Array, times: number[], fps: number,
 *                    duration: number, confidence: number, seen: number}>}
 *   `frames[i]` is the array of 33 landmarks at `times[i]` seconds, or null
 *   if no body was found in that frame.
 */
export async function trackVideo(url, { onProgress, signal } = {}) {
  const landmarker = await loadTracker();
  const video = await videoFrom(url);
  const duration = Math.min(video.duration || 0, MAX_SECONDS);
  if (!duration || !Number.isFinite(duration)) {
    throw new Error('That video has no length we can read.');
  }

  const step = 1 / SAMPLE_FPS;
  const frames = [];
  const times = [];
  let visibilitySum = 0;
  let seen = 0;

  for (let t = 0; t < duration; t += step) {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
    await seek(video, t);
    const result = landmarker.detect(video);
    const marks = result?.landmarks?.[0] ?? null;
    frames.push(marks);
    times.push(t);
    if (marks) {
      seen += 1;
      // The torso and legs are what our measurements lean on.
      const core = [11, 12, 23, 24, 25, 26, 27, 28];
      visibilitySum += core.reduce((s, i) => s + (marks[i]?.visibility ?? 0), 0) / core.length;
    }
    onProgress?.(Math.min(1, t / duration));
  }

  video.src = '';
  onProgress?.(1);

  return {
    frames,
    times,
    fps: SAMPLE_FPS,
    duration,
    seen,
    // How clearly we could see the body: 0 when we never found it.
    confidence: seen ? +(visibilitySum / seen).toFixed(3) : 0,
  };
}

/** Draws the skeleton for one frame onto a canvas sized to the video. */
export function drawSkeleton(ctx, frame, width, height, bones, opts = {}) {
  const { line = '#2563eb', dot = '#ffffff', ring = '#1d4ed8' } = opts;
  ctx.clearRect(0, 0, width, height);
  if (!frame) return;

  ctx.lineWidth = Math.max(2, width / 260);
  ctx.strokeStyle = line;
  ctx.lineCap = 'round';
  for (const [a, b] of bones) {
    const p = frame[a];
    const q = frame[b];
    if (!p || !q || (p.visibility ?? 1) < 0.4 || (q.visibility ?? 1) < 0.4) continue;
    ctx.beginPath();
    ctx.moveTo(p.x * width, p.y * height);
    ctx.lineTo(q.x * width, q.y * height);
    ctx.stroke();
  }

  const r = Math.max(3, width / 190);
  for (const p of frame) {
    if (!p || (p.visibility ?? 1) < 0.4) continue;
    ctx.beginPath();
    ctx.arc(p.x * width, p.y * height, r, 0, Math.PI * 2);
    ctx.fillStyle = dot;
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, width / 420);
    ctx.strokeStyle = ring;
    ctx.stroke();
  }
}
