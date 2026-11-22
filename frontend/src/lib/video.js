/**
 * Small helpers for reading a video file before we analyse it.
 */

/**
 * The length of a video in seconds, or 0 if it cannot be read.
 *
 * Videos recorded in the browser (WebM) often report their length as
 * Infinity until the player has been asked to jump to the very end. We do
 * that jump here, so the check screen shows the real length.
 */
export function readDuration(url) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      video.removeAttribute('src');
      video.load();
      resolve(Number.isFinite(value) && value > 0 ? value : 0);
    };
    const timer = setTimeout(() => finish(video.duration), 6000);

    video.onloadedmetadata = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        finish(video.duration);
        return;
      }
      video.ondurationchange = () => {
        if (Number.isFinite(video.duration) && video.duration > 0) finish(video.duration);
      };
      video.currentTime = 1e7; // forces the browser to find the real end
    };
    video.onerror = () => finish(0);
    video.src = url;
  });
}

/** 75 -> "1:15" */
export function clock(seconds) {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
