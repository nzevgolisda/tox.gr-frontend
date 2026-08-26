import { el } from './js/dom.js';
import { initNotifications, startNotificationPoll, stopNotificationPoll, closeNotificationDropdown, resetNotifications } from './js/notifications.js';
import { initKeyboard } from './js/keyboard.js';
import { initThreads, loadThreads, openThread, renderThreadDetail } from './js/threads.js';
import { initAuth, openAuth } from './js/auth.js';
import { toggleTheme, updateTheme } from './js/theme.js';
import { initChat, newChat, loadSessions, loadSessionHistory } from './js/chat.js';
import { initNavigation, switchTab, switchMsgSubTab, closeMobMenu } from './js/navigation.js';
import { initProfiles, openOwnProfile, openUserProfile, refreshSidebarAvatar } from './js/profiles.js';
import { initPresence, heartbeat, startOnlinePoll, stopOnlinePoll, updateOnlineDots } from './js/presence.js';
import { initGifs, openGifPicker } from './js/gifs.js';
import { initFeed, loadFeed, updateLimitInfo, setPostGif } from './js/feed.js';
import { initMessaging, loadFriends, backToFriends, loadGroups, backToGroups, currentDmFriend, setMessageGif, resetMessaging } from './js/messaging.js';

const token    = () => localStorage.getItem('tox_token');
const username = () => localStorage.getItem('tox_user');
const loggedIn = () => !!token();

// ── STATE ────────────────────────────────────────────────────
// ── INIT ─────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  initChat({ loggedIn, logout, switchTab });
  initNavigation({ loggedIn, openAuth, openOwnProfile, logout, toggleTheme, loadFeed, loadThreads, loadFriends, loadGroups, backToFriends, backToGroups, startOnlinePoll, stopOnlinePoll, loadSessionHistory });
  initProfiles({ loggedIn, username, loadFriends, loadFeed });
  initMessaging({ loggedIn, username, openAuth, openUserProfile, openGifPicker, updateOnlineDots });
  initFeed({ loggedIn, username, openAuth, openUserProfile, openGifPicker });
  initPresence({ loggedIn, currentDmFriend });
  initGifs({ setPostGif, setMessageGif });
  updateTheme(localStorage.getItem('theme') || 'light');
  if (loggedIn()) { applyLoggedIn(username()); loadSessions(); }
  else { applyGuest(); }
  switchTab('feed');
  wireListeners();
  initAuth({ applyLoggedIn, loadSessions, loadFeed, heartbeat });
  initThreads({ loggedIn, username, openAuth, openUserProfile });
  initNotifications({ loggedIn, openAuth, closeMobMenu, switchTab, switchMsgSubTab, openThread, renderThreadDetail });
  initKeyboard({ closeMobMenu, closeNotifDropdown: closeNotificationDropdown });
  if (loggedIn()) heartbeat();
});

function wireListeners() {
  el('logout-btn')?.addEventListener('click', logout);
  el('sidebar-hera-btn')?.addEventListener('click', () => switchTab('chat'));
  el('new-chat-btn')?.addEventListener('click', newChat);
  el('theme-toggle-btn')?.addEventListener('click', toggleTheme);
}

function applyLoggedIn(uname) {
  el('account-badge')?.classList.remove('hidden');
  el('guest-badge')?.classList.add('hidden');
  if (el('user-display')) el('user-display').textContent = uname;
  el('feed-guest-notice')?.classList.add('hidden');
  if (el('create-post-card')) el('create-post-card').style.display = 'flex';
  el('sessions-guest-note')?.classList.add('hidden');
  if (el('mob-auth-label')) el('mob-auth-label').textContent = 'Αποσύνδεση';
  if (el('settings-username-val')) el('settings-username-val').textContent = uname;
  refreshSidebarAvatar();
  loadFriends();
  updateLimitInfo();
  startNotificationPoll();
}

function applyGuest() {
  el('account-badge')?.classList.add('hidden');
  el('guest-badge')?.classList.remove('hidden');
  el('feed-guest-notice')?.classList.remove('hidden');
  if (el('create-post-card')) el('create-post-card').style.display = 'none';
  el('sessions-guest-note')?.classList.remove('hidden');
  if (el('mob-auth-label')) el('mob-auth-label').textContent = 'Σύνδεση';
}

function logout() {
  localStorage.removeItem('tox_token');
  localStorage.removeItem('tox_user');
  resetMessaging(); stopOnlinePoll(); stopNotificationPoll();
  resetNotifications();
  applyGuest();
  el('chat-logs')?.replaceChildren();
  el('chat-logs')?.classList.add('hidden');
  el('greeting')?.classList.remove('hidden');
  loadFeed();
}


