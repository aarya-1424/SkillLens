/**
 * Privacy & data: the buttons behind every right in the Privacy Policy.
 * All of these need a signed-in account; demo mode keeps nothing on our servers.
 */
import { del, get, post, put } from './api';

export const getPrivacyStatus = () => get('/me/privacy');
export const setAiPaused = (paused) => put('/me/privacy/ai', { paused });
export const clearCoachHistory = () => del('/me/privacy/chat');
export const requestAccountDeletion = () => del('/me/privacy/account', { data: { confirm: true } });
export const cancelAccountDeletion = () => post('/me/privacy/account/cancel', {});
export const sendPrivacyRequest = (kind, details) => post('/me/privacy/requests', { kind, details });

/** Fetch everything we hold and save it as a file on this device. */
export async function downloadMyData() {
  const bundle = await get('/me/privacy/export');
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `skilllens-my-data-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Tell the rest of the app (menu banner, etc.) that privacy settings changed. */
export const announcePrivacyChange = () => window.dispatchEvent(new Event('skilllens:privacy'));
