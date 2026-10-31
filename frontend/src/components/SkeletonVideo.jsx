import { useEffect, useRef, useState } from 'react';
import { BONES, INDEX } from '../lib/pose/geometry';
import { drawSkeleton } from '../lib/pose/tracker';

const BONE_PAIRS = BONES.map(([a, b]) => [INDEX[a], INDEX[b]]);

/**
 * The player's own video with the tracked skeleton drawn on top — the real
 * one, moving with their body, not a decoration.
 *
 * `jumpTo` seconds lets the report freeze the clip on the exact moment a
 * mistake happened.
 */
export default function SkeletonVideo({ videoUrl, tracked, jumpTo = null, title = 'Your video' }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [showSkeleton, setShowSkeleton] = useState(true);

  // Keep the overlay in step with whatever frame is on screen.
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !tracked) return undefined;

    let raf;
    const paint = () => {
      const { videoWidth: w, videoHeight: h } = video;
      if (w && h) {
        if (canvas.width !== w) { canvas.width = w; canvas.height = h; }
        const ctx = canvas.getContext('2d');
        if (!showSkeleton) ctx.clearRect(0, 0, w, h);
        else {
          // Nearest tracked frame to where the video is now.
          const t = video.currentTime;
          let nearest = 0;
          for (let i = 1; i < tracked.times.length; i += 1) {
            if (Math.abs(tracked.times[i] - t) < Math.abs(tracked.times[nearest] - t)) nearest = i;
          }
          drawSkeleton(ctx, tracked.frames[nearest], w, h, BONE_PAIRS);
        }
      }
      raf = requestAnimationFrame(paint);
    };
    raf = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(raf);
  }, [tracked, showSkeleton]);

  useEffect(() => {
    const video = videoRef.current;
    if (video && jumpTo != null && Number.isFinite(jumpTo)) {
      video.pause();
      video.currentTime = jumpTo;
    }
  }, [jumpTo]);

  return (
    <div className="rounded-2xl border border-line bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-line">
        <h3 className="font-medium">{title}</h3>
        <button
          onClick={() => setShowSkeleton((v) => !v)}
          aria-pressed={showSkeleton}
          className={`text-xs px-3 py-1.5 rounded-full border transition ${
            showSkeleton ? 'bg-brand text-white border-brand' : 'bg-white text-ink-soft border-line'}`}
        >
          Skeleton {showSkeleton ? 'on' : 'off'}
        </button>
      </div>
      <div className="relative bg-ink aspect-video">
        <video ref={videoRef} src={videoUrl} className="absolute inset-0 w-full h-full object-contain"
          controls loop playsInline muted />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
      </div>
    </div>
  );
}
