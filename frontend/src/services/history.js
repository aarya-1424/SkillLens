/**
 * Saved reports and progress.
 *
 * Everything here needs a signed-in account. In demo mode there is no token,
 * so the backend says 401 and we quietly carry on without history rather
 * than throwing an error at someone just trying the app out.
 */
import { del, get, post } from './api';

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
    results: report.all_results.map((r) => ({
      id: r.id, name: r.name, group: r.group, layer: r.layer, unit: r.unit,
      value: r.value, value_label: r.value_label, target_label: r.target_label,
      score: r.score, severity: r.severity, status: r.status,
      direction: r.direction, amount: r.amount, headline: r.headline, cue: r.cue,
    })),
  };
}

export const saveAnalysis = (analysis) => soft(post('/analyses', toSavePayload(analysis)));
export const listAnalyses = (params = '') => soft(get(`/analyses${params}`), []);
export const getAnalysis = (id) => soft(get(`/analyses/${id}`));
export const getStats = () => soft(get('/analyses/stats'));
export const getProgress = (movement) =>
  soft(get(`/analyses/progress?movement=${encodeURIComponent(movement)}`), []);
export const getSummary = (id) => soft(post(`/analyses/${id}/summary`, {}));
