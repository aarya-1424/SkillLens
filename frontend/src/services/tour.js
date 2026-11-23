/**
 * "Take the tour": a complete example account for visitors who have not
 * signed in. The data (public/tour/tour.json) was made by the real SkillLens
 * engine for a sample athlete and a sample squad. Nothing here touches any
 * real account, and nothing a visitor does in the tour is saved anywhere.
 *
 * Dates are moved forward so the example always looks recent: "3 days ago"
 * stays 3 days ago whenever someone takes the tour.
 */
const DATE_KEYS = new Set([
  'created_at', 'date', 'last_active', 'joined_at', 'consented_at', 'due_date', 'goal_date',
  'updated_at', 'terms_accepted_at', 'based_on_report', 'latest_date',
]);
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

let loading = null;
const local = { analyses: [], details: {} };   // the visitor's own analyses, this visit only

function shiftAll(value, ms, days) {
  if (Array.isArray(value)) return value.map((v) => shiftAll(v, ms, days));
  if (!value || typeof value !== 'object') return value;
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (DATE_KEYS.has(k) && typeof v === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
        const d = new Date(`${v}T12:00:00`);
        d.setDate(d.getDate() + days);
        out[k] = d.toISOString().slice(0, 10);
      } else {
        const t = Date.parse(v.endsWith('Z') || /[+-]\d\d:\d\d$/.test(v) ? v : `${v}Z`);
        out[k] = Number.isNaN(t) ? v : new Date(t + ms).toISOString();
      }
    } else {
      out[k] = shiftAll(v, ms, days);
    }
  }
  if (out.weekday && typeof out.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(out.date)) {
    out.weekday = WEEKDAYS[new Date(`${out.date}T12:00:00`).getDay()];
  }
  return out;
}

export function loadTour() {
  if (!loading) {
    loading = fetch('/tour/tour.json').then((r) => r.json()).then((raw) => {
      const made = new Date(raw.generated_at);
      const ms = Date.now() - made.getTime();
      const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const days = Math.round((startOfDay(new Date()) - startOfDay(made)) / 86_400_000);
      return shiftAll(raw, ms, days);
    }).catch((err) => { loading = null; throw err; });
  }
  return loading;
}

/** An error shaped like the API's, for things the tour cannot do. */
export function tourOnly(message = 'This needs an account. In the tour you can look around, and try your own video.') {
  const err = new Error(message);
  err.status = 403;
  err.detail = message;
  return err;
}

// ── reports ──
export async function tourAnalyses(params = '') {
  const t = await loadTour();
  const q = new URLSearchParams(params.replace(/^\?/, ''));
  const movement = q.get('movement');
  const limit = Number(q.get('limit') || 50);
  return [...local.analyses, ...t.analyses]
    .filter((a) => !movement || a.movement_slug === movement)
    .slice(0, limit);
}
export async function tourAnalysis(id) {
  const t = await loadTour();
  return local.details[id] || t.details[id] || null;
}

/** The visitor's own analysis in the tour: kept for this visit only, never sent anywhere. */
export function tourKeep(analysis, payload) {
  const id = `visit-${Date.now()}`;
  const now = new Date().toISOString();
  const summary = {
    id, movement_slug: payload.movement_slug, sport: payload.sport, movement_name: payload.movement_name,
    total: payload.total, grade: payload.grade, injury_risk: payload.injury_risk,
    confidence: payload.confidence, measured: payload.measured, created_at: now, is_sample: false, visit_only: true,
  };
  local.analyses.unshift(summary);
  local.details[id] = {
    ...summary, groups: payload.groups, scoring_version: payload.scoring_version, unverified: payload.unverified,
    skipped: payload.skipped, ai_summary: null, reps: payload.reps,
    results: analysis.report.all_results.map((r) => ({ ...r, drills: r.drills || [] }))
      .sort((a, b) => a.score - b.score),
  };
  return { ...local.details[id], visit_only: true };
}
