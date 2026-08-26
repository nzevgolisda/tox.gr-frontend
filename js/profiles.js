import { apiUrl } from './config.js';
import { el } from './dom.js';
import { authHeaders, jsonHeaders } from './api.js';
import { esc, PP } from './utils.js';

let deps = {};

export function initProfiles(callbacks) {
  deps = callbacks;
  el('sidebar-avatar')?.addEventListener('click', () => { if (deps.loggedIn()) openOwnProfile(); });
  el('close-profile-btn')?.addEventListener('click', closeOwnProfile);
  el('profile-modal')?.addEventListener('click', event => { if (event.target === el('profile-modal')) closeOwnProfile(); });
  el('profile-pic-input')?.addEventListener('change', selectProfilePicture);
  el('remove-pic-btn')?.addEventListener('click', removeProfilePicture);
  el('close-user-profile-btn')?.addEventListener('click', closeUserProfile);
  el('user-profile-modal')?.addEventListener('click', event => { if (event.target === el('user-profile-modal')) closeUserProfile(); });
}

export function openOwnProfile() {
  const name = deps.username() || '';
  setAvatar(el('own-avatar-large'), name, PP.get(name));
  if (el('own-username-display')) el('own-username-display').textContent = name;
  el('profile-modal')?.classList.remove('hidden');
}
export function refreshSidebarAvatar() { setAvatar(el('sidebar-avatar'), deps.username() || '', PP.get(deps.username() || '')); }
function setAvatar(element, name, picture) {
  if (!element) return;
  element.innerHTML = picture ? `<img src="${picture}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">` : '';
  if (!picture) element.textContent = name[0]?.toUpperCase() || '?';
  element.style.background = picture ? 'none' : '';
}
function closeOwnProfile() { el('profile-modal')?.classList.add('hidden'); }
function closeUserProfile() { el('user-profile-modal')?.classList.add('hidden'); }
function selectProfilePicture() {
  const file = el('profile-pic-input')?.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => { PP.set(deps.username() || '', reader.result); openOwnProfile(); refreshSidebarAvatar(); };
  reader.readAsDataURL(file);
}
function removeProfilePicture() { PP.set(deps.username() || '', null); openOwnProfile(); refreshSidebarAvatar(); }

export async function openUserProfile(name) {
  if (name === deps.username()) { openOwnProfile(); return; }
  try {
    const response = await fetch(apiUrl(`/api/users/${encodeURIComponent(name)}/profile`), { headers: authHeaders() });
    const { user } = await response.json();
    setAvatar(el('up-avatar'), name, PP.get(name));
    if (el('up-username')) el('up-username').textContent = name;
    if (el('up-reputation')) el('up-reputation').textContent = `⭐ Υπόληψη: ${user.reputation}`;
    const giftRow = el('up-gift-row');
    giftRow?.classList.toggle('hidden', !deps.loggedIn());
    if (deps.loggedIn()) {
      const button = el('up-gift-btn');
      if (button) button.onclick = async () => {
        const result = await fetch(apiUrl(`/api/reputation/gift/${encodeURIComponent(name)}`), { method: 'POST', headers: jsonHeaders() });
        const data = await result.json(); button.textContent = result.ok ? '✓ Δόθηκε!' : data.error; button.disabled = !result.ok;
      };
    }
    const actions = el('up-actions');
    if (actions) { actions.replaceChildren(); if (deps.loggedIn()) renderActions(actions, user, name); }
    renderPosts(user.posts || []);
    el('user-profile-modal')?.classList.remove('hidden');
  } catch (error) { console.error('profile:', error); }
}
function renderActions(container, user, name) {
  const action = document.createElement('button'); action.className = 'up-action-btn';
  action.textContent = user.friendship_id ? 'Αφαίρεση φίλου' : '+ Αίτημα φιλίας';
  action.onclick = async () => {
    const endpoint = user.friendship_id ? `/api/friends/${user.friendship_id}` : '/api/friends/request';
    const options = user.friendship_id ? { method: 'DELETE', headers: jsonHeaders() } : { method: 'POST', headers: jsonHeaders(), body: JSON.stringify({ username: name }) };
    await fetch(apiUrl(endpoint), options); closeUserProfile(); deps.loadFriends();
  };
  container.append(action);
  const block = document.createElement('button'); block.className = 'up-action-btn up-block-btn'; block.textContent = user.is_blocked ? '🔓 Άρση αποκλεισμού' : '🚫 Αποκλεισμός';
  block.onclick = async () => { await fetch(apiUrl(`/api/users/${encodeURIComponent(name)}/block`), { method: 'POST', headers: jsonHeaders() }); closeUserProfile(); deps.loadFriends(); deps.loadFeed(); };
  container.append(block);
}
function renderPosts(posts) {
  const grid = el('up-posts-grid'); if (!grid) return; grid.replaceChildren();
  posts.forEach(post => { const item = document.createElement('div'); item.className = 'up-post-thumb'; item.style.backgroundImage = `url(${post.gif_url || post.media_data || ''})`; if (!post.gif_url && !post.media_data) item.textContent = (post.content || '').slice(0, 60); grid.append(item); });
}
