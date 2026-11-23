/** Coaches and teams. Every call needs a signed-in account. */
import { del, get, post, put } from './api';

export const myTeams = () => get('/teams/mine');
export const createTeam = (name, sportSlug) => post('/teams', { name, sport_slug: sportSlug || null });
export const previewInvite = (code) => get(`/teams/invite/${encodeURIComponent(code)}`);
export const joinTeam = (code, consent, guardianConsent) =>
  post('/teams/join', { code, consent, guardian_consent: guardianConsent });
export const leaveTeam = (teamId) => post(`/teams/${teamId}/leave`, {});

export const getSquad = (teamId) => get(`/teams/${teamId}`);
export const closeTeam = (teamId) => del(`/teams/${teamId}`);
export const newInviteCode = (teamId) => post(`/teams/${teamId}/code`, {});
export const getPlayer = (teamId, athleteId) => get(`/teams/${teamId}/players/${athleteId}`);
export const getPlayerReport = (teamId, athleteId, reportId) =>
  get(`/teams/${teamId}/players/${athleteId}/reports/${reportId}`);
export const removePlayer = (teamId, athleteId) => del(`/teams/${teamId}/players/${athleteId}`);

export const listDrills = () => get('/drills');
export const teamAssignments = (teamId) => get(`/teams/${teamId}/assignments`);
export const assignDrill = (teamId, body) => post(`/teams/${teamId}/assignments`, body);
export const removeAssignment = (teamId, id) => del(`/teams/${teamId}/assignments/${id}`);

export const myAssignments = () => get('/me/assignments');
export const markAssignment = (id, done) => put(`/me/assignments/${id}`, { done });

export const inviteLink = (code) => `${window.location.origin}/app/join/${code}`;
