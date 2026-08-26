import { apiUrl } from './config.js';
import { el } from './dom.js';
import { jsonHeaders } from './api.js';

let onlineUsers = new Set();
let poll = null;
let heartbeatStarted = false;
let deps = {};

export function initPresence(callbacks) { deps = callbacks; }
export function heartbeat() {
  if (!deps.loggedIn()) return;
  fetch(apiUrl('/api/online'), { method: 'POST', headers: jsonHeaders() }).catch(() => {});
  if (!heartbeatStarted) {
    heartbeatStarted = true;
    setInterval(() => { if (deps.loggedIn()) fetch(apiUrl('/api/online'), { method: 'POST', headers: jsonHeaders() }).catch(() => {}); }, 4 * 60 * 1000);
  }
}
export async function fetchOnlineUsers() {
  if (!deps.loggedIn()) return;
  try { const response = await fetch(apiUrl('/api/online'), { headers: jsonHeaders() }); const data = await response.json(); onlineUsers = new Set(data.online || []); updateOnlineDots(); } catch {}
}
export function updateOnlineDots() {
  document.querySelectorAll('#friends-list .friend-avatar[data-uname]').forEach(avatar => avatar.closest('.friend-item')?.classList.toggle('friend-online', onlineUsers.has(avatar.dataset.uname)));
  const friend = deps.currentDmFriend?.(); if (friend) el('dm-header')?.classList.toggle('peer-online', onlineUsers.has(friend.username));
}
export function startOnlinePoll() { stopOnlinePoll(); fetchOnlineUsers(); poll = setInterval(fetchOnlineUsers, 30000); }
export function stopOnlinePoll() { if (poll) clearInterval(poll); poll = null; }
