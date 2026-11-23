/** Coaches and teams. Signed-in people use the API; the tour shows an example squad, read-only. */
import { del, get, post, put } from './api';
import { isGuest } from './auth';
import { loadTour, tourOnly } from './tour';

const tour = (fn, real) => (...args) => (isGuest() ? fn(...args) : real(...args));
const readOnly = async () => { throw tourOnly('The tour is read-only. Sign in to coach a team or join one.'); };

export const myTeams = tour(async () => (await loadTour()).teams, () => get('/teams/mine'));
export const createTeam = tour(readOnly, (name, sportSlug) => post('/teams', { name, sport_slug: sportSlug || null }));
export const previewInvite = (code) => get(`/teams/invite/${encodeURIComponent(code)}`);
export const joinTeam = (code, consent, guardianConsent) =>
  post('/teams/join', { code, consent, guardian_consent: guardianConsent });
export const leaveTeam = tour(readOnly, (teamId) => post(`/teams/${teamId}/leave`, {}));

export const getSquad = tour(async (id) => (await loadTour()).squads[id], (teamId) => get(`/teams/${teamId}`));
export const closeTeam = tour(readOnly, (teamId) => del(`/teams/${teamId}`));
export const newInviteCode = tour(readOnly, (teamId) => post(`/teams/${teamId}/code`, {}));
export const getPlayer = tour(async (t, a) => (await loadTour()).players[`${t}/${a}`], (teamId, athleteId) => get(`/teams/${teamId}/players/${athleteId}`));
export const getPlayerReport = tour(async (t, a, r) => (await loadTour()).player_reports[r],
  (teamId, athleteId, reportId) => get(`/teams/${teamId}/players/${athleteId}/reports/${reportId}`));
export const removePlayer = tour(readOnly, (teamId, athleteId) => del(`/teams/${teamId}/players/${athleteId}`));

export const listDrills = () => get('/drills');
export const teamAssignments = tour(async (id) => (await loadTour()).team_assignments[id] || [], (teamId) => get(`/teams/${teamId}/assignments`));
export const assignDrill = tour(readOnly, (teamId, body) => post(`/teams/${teamId}/assignments`, body));
export const removeAssignment = tour(readOnly, (teamId, id) => del(`/teams/${teamId}/assignments/${id}`));

export const myAssignments = tour(async () => (await loadTour()).my_assignments, () => get('/me/assignments'));
// In the tour, ticking a drill works on screen but is not saved.
export const markAssignment = tour(async () => ({}), (id, done) => put(`/me/assignments/${id}`, { done }));

export const inviteLink = (code) => `${window.location.origin}/app/join/${code}`;
