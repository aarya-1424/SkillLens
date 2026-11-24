import { scoreColour } from './Bits';

/**
 * "We found 3 repetitions": each rep's score, which one the report is about
 * (the typical one), the best one, and how consistent they were.
 * `onPick(rep)` lets the live report jump the video to that rep.
 */
export default function RepStrip({ reps, consistency, onPick }) {
  if (!reps || reps.length < 2) return null;
  const spread = consistency ?? (Math.max(...reps.map((r) => r.total)) - Math.min(...reps.map((r) => r.total)));
  const steady = spread <= 8;
  return (
    <section className="mb-3 p-6 sm:p-7 rounded-[2rem] bg-paper border border-line">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-4">
        <div>
          <p className="eyebrow mb-1">Each time you did the movement</p>
          <h2 className="font-display text-lg sm:text-xl">We found <em>{reps.length} reps</em></h2>
        </div>
        <p className="text-sm text-ink-soft max-w-md">
          A rep is one time you do the movement. This report uses your <strong className="text-ink">normal rep</strong> (the middle score), not your best one.{' '}
          {steady ? 'All your reps were similar. Good.' : `Your reps were ${Math.round(spread)} points apart. Try to do it the same way every time.`}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {reps.map((r) => {
          const Tag = onPick && r.peak_time != null ? 'button' : 'div';
          return (
            <Tag key={r.number} type={Tag === 'button' ? 'button' : undefined}
              onClick={Tag === 'button' ? () => onPick(r) : undefined}
              className={`flex items-center gap-3 pl-2 pr-4 py-2 rounded-full border transition ${r.typical ? 'border-ink bg-sand' : 'border-line bg-canvas'} ${Tag === 'button' ? 'hover:border-ink/50' : ''}`}>
              <span className="w-9 h-9 rounded-full text-white font-display text-xs flex items-center justify-center tabular-nums"
                style={{ background: scoreColour(r.total) }}>{Math.round(r.total)}</span>
              <span className="text-left">
                <span className="block text-sm font-semibold">Rep {r.number}</span>
                <span className="block text-[11px] text-ink-soft">
                  {r.typical ? 'Normal · this report' : r.best ? 'Your best' : r.grade}
                </span>
              </span>
            </Tag>
          );
        })}
      </div>
      {onPick && <p className="text-xs text-ink-soft mt-3">Tap a rep to see it in your video.</p>}
    </section>
  );
}
