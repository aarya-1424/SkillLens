import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

const shortDate = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/** Real scores over time for one movement. No sample data. */
export default function ProgressChart({ points, movementName }) {
  if (!points || points.length < 2) {
    return (
      <div className="h-48 flex flex-col items-center justify-center text-center text-sm text-ink-soft">
        <p>Your progress line appears once you have analysed {movementName || 'this movement'} twice.</p>
        <p className="text-xs mt-1">
          {points?.length === 1 ? 'One analysis so far.' : 'No analyses yet.'}
        </p>
      </div>
    );
  }

  const data = points.map((p) => ({ ...p, label: shortDate(p.date) }));
  const first = data[0].total;
  const last = data[data.length - 1].total;
  const change = Math.round((last - first) * 10) / 10;

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className="font-display text-3xl">{Math.round(last)}</span>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${change >= 0 ? 'bg-mint/15 text-emerald-700' : 'bg-amber/20 text-amber-800'}`}>
          {change >= 0 ? '▲' : '▼'} {Math.abs(change)} since your first
        </span>
      </div>
      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 12, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e9e6de" />
            <XAxis dataKey="label" stroke="#625f58" fontSize={11} tickLine={false} />
            <YAxis domain={[0, 100]} stroke="#625f58" fontSize={11} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid #d8d4c9', fontSize: 13 }}
              formatter={(v) => [`${v} / 100`, 'Score']}
            />
            <Line type="monotone" dataKey="total" stroke="#d7282f" strokeWidth={2.5}
              dot={{ r: 4, fill: '#fff', stroke: '#d7282f', strokeWidth: 2 }}
              activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
