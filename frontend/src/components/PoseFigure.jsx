/** Animated "body tracking" illustration used on the landing page. */
const BONES = [
  [50, 18, 50, 46], // spine
  [36, 24, 64, 24], // shoulders
  [36, 24, 26, 38], [26, 38, 20, 24], // left arm (raised)
  [64, 24, 74, 36], [74, 36, 80, 48], // right arm
  [42, 46, 58, 46], // hips
  [42, 46, 36, 64], [36, 64, 30, 82], // left leg
  [58, 46, 66, 62], [66, 62, 64, 82], // right leg
];
const JOINTS = [[50, 12], [36, 24], [64, 24], [26, 38], [20, 24], [74, 36], [80, 48], [42, 46], [58, 46], [36, 64], [30, 82], [66, 62], [64, 82]];

export default function PoseFigure({ className = '' }) {
  return (
    <div className={`relative aspect-[4/5] w-full max-w-sm rounded-3xl overflow-hidden border border-teal-400/20 bg-gradient-to-b from-gray-900 to-gray-950 shadow-2xl shadow-teal-500/10 ${className}`}>
      <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-teal-400/10 to-transparent" />
      <div className="scan-line absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-300 to-transparent" />
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full float">
        <circle cx="50" cy="12" r="5" fill="none" stroke="#5eead4" strokeWidth="1.2" />
        {BONES.map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#5eead4" strokeWidth="1.4" strokeLinecap="round"
            className="bone" style={{ animationDelay: `${i * 0.08}s` }} />
        ))}
        {JOINTS.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="2.2" fill="#60a5fa" className="joint" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
        <path d="M 30 64 A 8 8 0 0 1 40 58" fill="none" stroke="#facc15" strokeWidth="0.8" />
        <text x="41" y="60" fontSize="4" fill="#facc15">142°</text>
      </svg>
      <div className="absolute left-3 bottom-3 right-3 flex justify-between text-xs">
        <span className="px-2 py-1 rounded-md bg-black/50 text-teal-300">33 body points</span>
        <span className="px-2 py-1 rounded-md bg-black/50 text-yellow-300">Knee 142°</span>
      </div>
    </div>
  );
}
