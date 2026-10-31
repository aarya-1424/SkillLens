/**
 * The target-zone bar.
 *
 * A bare "142°" means nothing to a player. This shows the green zone they are
 * aiming for, a marker where they actually are, and an arrow pointing the way
 * they need to move — with the amount in both numbers and plain words.
 *
 * A zone edge marked "open" has no wall on that side (you cannot be too
 * balanced, or have too fast an arm), so it fades out instead.
 */
const pct = (v, min, max) => Math.min(100, Math.max(0, ((v - min) / (max - min || 1)) * 100));

const TONE = {
  good: { bar: 'bg-mint', text: 'text-emerald-700', chip: 'bg-emerald-50 border-emerald-200' },
  minor: { bar: 'bg-amber', text: 'text-amber-700', chip: 'bg-amber-50 border-amber-200' },
  major: { bar: 'bg-amber', text: 'text-amber-800', chip: 'bg-amber-50 border-amber-300' },
  critical: { bar: 'bg-red-500', text: 'text-red-700', chip: 'bg-red-50 border-red-200' },
};

export default function MetricGauge({ result, compact = false }) {
  const { gauge, value_label: valueLabel, target_label: targetLabel } = result;
  const tone = TONE[result.severity] ?? TONE.good;
  const left = pct(gauge.zone_min, gauge.scale_min, gauge.scale_max);
  const right = pct(gauge.zone_max, gauge.scale_min, gauge.scale_max);
  const here = pct(gauge.value, gauge.scale_min, gauge.scale_max);
  const inZone = result.status === 'good';

  return (
    <div className={compact ? '' : 'rounded-2xl border border-line bg-white p-5'}>
      <div className="flex items-start justify-between gap-4 mb-1">
        <div>
          <h4 className="font-medium leading-tight">{result.name}</h4>
          {!compact && <p className="text-xs text-ink-soft mt-0.5">{result.means}</p>}
        </div>
        <span className={`shrink-0 text-lg font-semibold tabular-nums ${tone.text}`}>{valueLabel}</span>
      </div>

      {/* The bar */}
      <div className="relative mt-4 mb-1 h-2.5 rounded-full bg-sky" role="img"
        aria-label={`${result.name}: ${valueLabel}, target ${targetLabel}. ${result.headline}`}>
        <div
          className={`absolute inset-y-0 ${tone.bar} opacity-25`}
          style={{
            left: `${gauge.open_low ? 0 : left}%`,
            right: `${100 - (gauge.open_high ? 100 : right)}%`,
            borderTopLeftRadius: gauge.open_low ? 9999 : 4,
            borderBottomLeftRadius: gauge.open_low ? 9999 : 4,
            borderTopRightRadius: gauge.open_high ? 9999 : 4,
            borderBottomRightRadius: gauge.open_high ? 9999 : 4,
          }}
        />
        {!gauge.open_low && <span className="absolute inset-y-0 w-px bg-mint" style={{ left: `${left}%` }} />}
        {!gauge.open_high && <span className="absolute inset-y-0 w-px bg-mint" style={{ left: `${right}%` }} />}
        <span
          className={`absolute -top-1 w-4 h-4.5 rounded-full border-2 border-white shadow ${inZone ? 'bg-mint' : tone.bar}`}
          style={{ left: `${here}%`, transform: 'translateX(-50%)', height: '1.125rem' }}
        />
      </div>

      <div className="flex justify-between text-[11px] text-ink-soft mb-3">
        <span>{gauge.open_low ? 'less' : ''}</span>
        <span>target {targetLabel}</span>
        <span>{gauge.open_high ? 'more' : ''}</span>
      </div>

      {/* What to do about it */}
      <div className={`rounded-xl border px-3 py-2.5 ${tone.chip}`}>
        <p className={`text-sm font-medium ${tone.text} flex items-center gap-1.5`}>
          {result.direction === 'increase' && <span aria-hidden="true">▲</span>}
          {result.direction === 'decrease' && <span aria-hidden="true">▼</span>}
          {result.direction === 'hold' && <span aria-hidden="true">✓</span>}
          {result.headline}
        </p>
        {result.cue && <p className="text-sm text-ink mt-1.5 leading-relaxed">{result.cue}</p>}
      </div>
    </div>
  );
}
