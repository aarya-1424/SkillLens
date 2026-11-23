/**
 * Saved reports and progress.
 *
 * Everything here needs a signed-in account. In demo mode there is no token,
 * so the backend says 401 and we quietly carry on without history rather
 * than throwing an error at someone just trying the app out.
 */
import { del, get, post } from './api';
import { isGuest } from './auth';
import { loadTour, tourAnalyses, tourAnalysis, tourKeep, tourOnly } from './tour';

/** Errors that simply mean "history is not available for this person". */
const isUnavailable = (err) => [401, 403, 503].includes(err?.status);

async function soft(promise, fallback = null) {
  try {
    return await promise;
  } catch (err) {
    if (isUnavailable(err)) return fallback;
    throw err;
  }
}

/** Turn a finished analysis into the shape the backend stores. */
export function toSavePayload(analysis) {
  const { report, movement } = analysis;
  return {
    movement_slug: movement.slug,
    sport: movement.sport,
    movement_name: movement.name,
    total: report.total,
    grade: report.grade,
    injury_risk: report.injury_risk,
    confidence: analysis.confidence ?? 0,
    measured: report.measured,
    skipped: (report.skipped || []).length,
    groups: report.groups,
    scoring_version: report.scoring_version,
    unverified: report.unverified,
    reps: analysis.reps ? analysis.reps.map((r) => ({ number: r.number, total: r.total, grade: r.grade, typical: r.typical, best: r.best })) : null,
    results: report.all_results.map((r) => ({
      id: r.id, name: r.name, group: r.group, layer: r.layer, unit: r.unit,
      value: r.value, value_label: r.value_label, target_label: r.target_label,
      score: r.score, severity: r.severity, status: r.status,
      direction: r.direction, amount: r.amount, headline: r.headline, cue: r.cue,
    })),
  };
}

// In the tour (not signed in), everything comes from the example account.
const tour = (fn, real) => (...args) => (isGuest() ? fn(...args) : real(...args));

export const saveAnalysis = tour(async (analysis) => tourKeep(analysis, toSavePayload(analysis)),
  (analysis) => soft(post('/analyses', toSavePayload(analysis))));
export const listAnalyses = tour(tourAnalyses, (params = '') => soft(get(`/analyses${params}`), []));
export const getAnalysis = tour(tourAnalysis, (id) => soft(get(`/analyses/${id}`)));
export const getStats = tour(async () => (await loadTour()).stats, () => soft(get('/analyses/stats')));
export const getProgress = tour(async (m) => (await loadTour()).progress[m] || [],
  (movement) => soft(get(`/analyses/progress?movement=${encodeURIComponent(movement)}`), []));
export const getSummary = tour(async () => ({ summary: null, tour: true }), (id) => soft(post(`/analyses/${id}/summary`, {})));

/** Delete one saved report for good (and the Ask Coach messages about it). */
export const deleteAnalysis = tour(async () => { throw tourOnly(); }, (id) => del(`/analyses/${id}`));
export const getCheckTrends = tour(async (m) => (await loadTour()).checks[m] || [],
  (movement) => soft(get(`/analyses/checks?movement=${encodeURIComponent(movement)}`), []));
export const getCoachHistory = (analysisId) => isGuest() ? Promise.resolve([]) :
  soft(get(`/coach/history${analysisId ? `?analysis_id=${encodeURIComponent(analysisId)}` : ''}`), []);
export const getInsights = tour(async () => (await loadTour()).insights, () => soft(get('/analyses/insights'), []));

/** This week's plan. In the tour: the example athlete's plan. */
export const getPlan = tour(async () => (await loadTour()).plan, () => get('/me/plan'));
