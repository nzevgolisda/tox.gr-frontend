import { apiUrl } from './config.js';
import { el } from './dom.js';
import { jsonHeaders } from './api.js';
import { esc, PP } from './utils.js';

let friends = [];
let dmFriend = null;
let dmTimer = null;
let dmSince = new Date(0).toISOString();
let group = null;
let groupTimer = null;
let groupSince = new Date(0).toISOString();
let pendingDmGif = null;
let pendingGroupGif = null;
const dmIds = new Set();
const groupIds = new Set();
let deps = {};

export function initMessaging(callbacks) {
  deps = callbacks;
  el('add-friend-fab')?.addEventListener('click', () => el('add-friend-row')?.classList.toggle('hidden'));
  el('send-friend-request-btn')?.addEventListener('click', sendFriendRequest);
  el('friend-username-input')?.addEventListener('keydown', event => { if (event.key === 'Enter') sendFriendRequest(); });
  el('friend-search-input')?.addEventListener('input', filterFriends);
  el('back-to-friends-btn')?.addEventListener('click', backToFriends);
  el('dm-send-btn')?.addEventListener('click', sendDm);
  el('dm-input')?.addEventListener('keydown', event => { if (event.key === 'Enter') sendDm(); });
    el('dm-gif-btn')?.addEventListener('click', () => deps.openGifPicker('dm'));
  el('new-group-btn')?.addEventListener('click', () => { if (!deps.loggedIn()) deps.openAuth(); else openGroupModal(); });
  el('close-group-modal-btn')?.addEventListener('click', closeGroupModal);
  el('group-modal-overlay')?.addEventListener('click', event => { if (event.target === el('group-modal-overlay')) closeGroupModal(); });
  el('create-group-btn')?.addEventListener('click', createGroup);
  el('back-to-groups-btn')?.addEventListener('click', backToGroups);
  el('grp-send-btn')?.addEventListener('click', sendGroupMessage);
  el('grp-input')?.addEventListener('keydown', event => { if (event.key === 'Enter') sendGroupMessage(); });
    el('grp-gif-btn')?.addEventListener('click', () => deps.openGifPicker('grp'));
  el('delete-group-btn')?.addEventListener('click', deleteGroup);
}
export async function loadFriends() {
  if (!deps.loggedIn()) { el('friends-list').innerHTML = '<p class="empty-note">Συνδεθείτε για να δείτε τους φίλους σας.</p>'; return; }
  try { const response = await fetch(apiUrl('/api/friends'), { headers: jsonHeaders() }); const data = await response.json(); friends = data.friends || []; renderFriends(); } catch {}
}
function filterFriends() { const query = el('friend-search-input')?.value.toLowerCase() || ''; document.querySelectorAll('#friends-list .friend-item').forEach(item => { item.style.display = item.querySelector('.friend-name')?.textContent.toLowerCase().includes(query) ? 'flex' : 'none'; }); deps.updateOnlineDots(); }
function renderFriends() {
  const list = el('friends-list'); if (!list) return; list.replaceChildren();
  if (!friends.length) { list.innerHTML = '<p class="empty-note">Δεν έχετε φίλους ακόμα.</p>'; return; }
  friends.forEach(friend => {
    const item = document.createElement('div'); item.className = 'friend-item'; const picture = PP.get(friend.username); const avatar = picture ? `<img src="${picture}">` : friend.username[0].toUpperCase();
    item.innerHTML = `<div class="friend-avatar clickable" data-uname="${esc(friend.username)}">${avatar}</div><div class="friend-info"><div class="friend-name">${esc(friend.username)}</div><div class="friend-sub">${friend.status === 'accepted' ? 'Φίλος' : 'Εκκρεμές...'}</div></div>`;
    if (friend.status === 'accepted') { item.querySelector('.friend-avatar').addEventListener('click', () => deps.openUserProfile(friend.username)); item.addEventListener('click', event => { if (!event.target.closest('.friend-avatar')) openDm(friend.friend_id, friend.username); }); }
    list.append(item);
  });
  deps.updateOnlineDots();
}
async function sendFriendRequest() {
  const name = el('friend-username-input')?.value.trim(); if (!name || !deps.loggedIn()) return;
  const response = await fetch(apiUrl('/api/friends/request'), { method: 'POST', headers: jsonHeaders(), body: JSON.stringify({ username: name }) }); const data = await response.json();
  const status = el('im-status-msg'); if (status) { status.textContent = data.error || data.message; status.classList.remove('hidden'); setTimeout(() => status.classList.add('hidden'), 3000); }
  if (response.ok) { el('friend-username-input').value = ''; loadFriends(); }
}
function openDm(id, name) { dmFriend = { id, username: name }; pendingDmGif = null; dmSince = new Date(0).toISOString(); dmIds.clear(); el('dm-friend-name').textContent = name; el('dm-messages').replaceChildren(); el('msg-friends-view').classList.add('hidden'); el('msg-dm-view').classList.remove('hidden'); fetchDmMessages(); stopDmPoll(); dmTimer = setInterval(fetchDmMessages, 3000); deps.updateOnlineDots(); }
export function currentDmFriend() { return dmFriend; }
export function backToFriends() { el('msg-dm-view').classList.add('hidden'); el('msg-friends-view').classList.remove('hidden'); stopDmPoll(); dmFriend = null; }
async function fetchDmMessages() { if (!dmFriend || !deps.loggedIn()) return; try { const response = await fetch(apiUrl(`/api/dm/${dmFriend.id}?since=${encodeURIComponent(dmSince)}`), { headers: jsonHeaders() }); const data = await response.json(); (data.messages || []).forEach(message => { dmSince = message.created_at; if (!dmIds.has(message.id)) { dmIds.add(message.id); const item = document.createElement('div'); item.className = `dm-msg ${message.sender_username === deps.username() ? 'mine' : 'theirs'}`; item.textContent = message.content || ''; el('dm-messages').append(item); } }); } catch {} }
async function sendDm() { const content = el('dm-input')?.value.trim(); if ((!content && !pendingDmGif) || !dmFriend || !deps.loggedIn()) return; el('dm-input').value = ''; const gifUrl = pendingDmGif; pendingDmGif = null; await fetch(apiUrl(`/api/dm/${dmFriend.id}`), { method: 'POST', headers: jsonHeaders(), body: JSON.stringify({ content: content || '', gif_url: gifUrl, aiReply: el('ai-reply-toggle')?.checked }) }); }
function stopDmPoll() { if (dmTimer) clearInterval(dmTimer); dmTimer = null; }
export async function loadGroups() { if (!deps.loggedIn()) return; try { const response = await fetch(apiUrl('/api/groups'), { headers: jsonHeaders() }); const data = await response.json(); renderGroups(data.groups || []); } catch {} }
function renderGroups(groups) { const list = el('groups-list'); if (!list) return; list.replaceChildren(); el('groups-empty')?.classList.toggle('hidden', groups.length > 0); groups.forEach(item => { const row = document.createElement('div'); row.className = 'friend-item'; row.innerHTML = `<div class="friend-avatar grp-color">G</div><div class="friend-info"><div class="friend-name">${esc(item.name)}</div><div class="friend-sub">${item.member_count} μέλη</div></div>`; row.addEventListener('click', () => openGroup(item)); list.append(row); }); }
function openGroup(item) { group = item; pendingGroupGif = null; groupSince = new Date(0).toISOString(); groupIds.clear(); el('grp-chat-name').textContent = item.name; el('grp-messages').replaceChildren(); el('grp-list-view').classList.add('hidden'); el('grp-chat-view').classList.remove('hidden'); fetchGroupMessages(); stopGroupPoll(); groupTimer = setInterval(fetchGroupMessages, 3000); }
export function backToGroups() { el('grp-chat-view').classList.add('hidden'); el('grp-list-view').classList.remove('hidden'); stopGroupPoll(); group = null; }
async function fetchGroupMessages() { if (!group || !deps.loggedIn()) return; try { const response = await fetch(apiUrl(`/api/groups/${group.id}/messages?since=${encodeURIComponent(groupSince)}`), { headers: jsonHeaders() }); const data = await response.json(); (data.messages || []).forEach(message => { groupSince = message.created_at; if (!groupIds.has(message.id)) { groupIds.add(message.id); const item = document.createElement('div'); item.className = 'dm-msg'; item.textContent = `${message.sender_username}: ${message.content || ''}`; el('grp-messages').append(item); } }); } catch {} }
async function sendGroupMessage() { const content = el('grp-input')?.value.trim(); if ((!content && !pendingGroupGif) || !group || !deps.loggedIn()) return; el('grp-input').value = ''; const gifUrl = pendingGroupGif; pendingGroupGif = null; await fetch(apiUrl(`/api/groups/${group.id}/messages`), { method: 'POST', headers: jsonHeaders(), body: JSON.stringify({ content: content || '', gif_url: gifUrl }) }); }
function stopGroupPoll() { if (groupTimer) clearInterval(groupTimer); groupTimer = null; }
function openGroupModal() { el('group-name-input').value = ''; el('group-modal-overlay').classList.remove('hidden'); }
function closeGroupModal() { el('group-modal-overlay').classList.add('hidden'); }
async function createGroup() { const name = el('group-name-input')?.value.trim(); if (!name) return; const ids = [...document.querySelectorAll('.grp-member-row.selected')].map(row => Number(row.dataset.uid)); const response = await fetch(apiUrl('/api/groups'), { method: 'POST', headers: jsonHeaders(), body: JSON.stringify({ name, member_ids: ids }) }); if (response.ok) { closeGroupModal(); loadGroups(); } }
async function deleteGroup() { if (!group || !confirm(`Διαγραφή ομάδας "${group.name}";`)) return; const response = await fetch(apiUrl(`/api/groups/${group.id}`), { method: 'DELETE', headers: jsonHeaders() }); if (response.ok) { backToGroups(); loadGroups(); } }

export function setMessageGif(type, url) { if (type === 'dm') pendingDmGif = url; else pendingGroupGif = url; }
export function resetMessaging() { stopDmPoll(); stopGroupPoll(); dmFriend = null; group = null; pendingDmGif = null; pendingGroupGif = null; }
