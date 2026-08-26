import { el } from './dom.js';
import { request, jsonHeaders, authHeaders } from './api.js';
import { esc, timeAgo } from './utils.js';

const messages = {
  friend_request: u => `Ο ${u} σου έστειλε αίτημα φιλίας`,
  dm: u => `Νέο μήνυμα από τον ${u}`,
  post_like: u => `Ο ${u} άρεσε την ανάρτησή σου`,
  post_comment: u => `Ο ${u} σχολίασε την ανάρτησή σου`,
  thread_like: u => `Ο ${u} άρεσε το νήμα σου`,
  thread_reply: u => `Ο ${u} απάντησε στο νήμα σου`,
  reply_like: u => `Ο ${u} άρεσε την απάντησή σου`,
  reputation: u => `Ο ${u} σου έδωσε ⭐ υπόληψη`
};

const icons = {
  friend_request: '👤', dm: '💬', post_like: '❤️', post_comment: '💭',
  thread_like: '❤️', thread_reply: '💬', reply_like: '❤️', reputation: '⭐'
};

let poll = null;
let unreadCount = 0;
let dropdownOpen = false;
let navigate = () => {};

export function initNotifications(callbacks) {
  navigate = callbacks;
  el('notif-bell-btn')?.addEventListener('click', toggleDropdown);
  el('notif-mark-all-btn')?.addEventListener('click', markAllRead);
  el('mob-notif-btn')?.addEventListener('click', event => {
    event.stopPropagation();
    callbacks.closeMobMenu?.();
    if (callbacks.loggedIn()) toggleDropdown();
    else callbacks.openAuth();
  });
  document.addEventListener('click', event => {
    if (dropdownOpen && !event.target.closest('#notif-bell-btn') && !event.target.closest('#notif-dropdown')) closeNotificationDropdown();
  });
  document.addEventListener('visibilitychange', () => {
    if (!callbacks.loggedIn()) return;
    if (document.hidden) stopNotificationPoll();
    else { fetchNotifications(); startNotificationPoll(); }
  });
}

export async function fetchNotifications() {
  if (!navigate.loggedIn?.()) return;
  try {
    const { response, data } = await request('/api/notifications', { headers: jsonHeaders() });
    if (!response.ok) return;
    const notifications = data.notifications || [];
    unreadCount = notifications.filter(notification => !notification.read).length;
    updateBadge(unreadCount);
    if (dropdownOpen) renderList(notifications);
  } catch {}
}

export function startNotificationPoll() {
  stopNotificationPoll();
  fetchNotifications();
  poll = setInterval(fetchNotifications, 30000);
}

export function stopNotificationPoll() {
  if (poll) clearInterval(poll);
  poll = null;
}

export function resetNotifications() {
  unreadCount = 0;
  updateBadge(0);
  closeNotificationDropdown();
}

function updateBadge(count) {
  ['notif-badge', 'notif-badge-mob'].forEach(id => {
    const badge = el(id);
    if (!badge) return;
    badge.textContent = count > 99 ? '99+' : count;
    badge.classList.toggle('hidden', count === 0);
  });
}

function toggleDropdown() {
  if (dropdownOpen) { closeNotificationDropdown(); return; }
  dropdownOpen = true;
  el('notif-dropdown')?.classList.remove('hidden');
  fetchAndRender();
}

export function closeNotificationDropdown() {
  dropdownOpen = false;
  el('notif-dropdown')?.classList.add('hidden');
}

async function fetchAndRender() {
  if (!navigate.loggedIn?.()) return;
  const list = el('notif-list');
  if (list) list.innerHTML = '<div class="notif-loading">Φόρτωση...</div>';
  try {
    const { data } = await request('/api/notifications', { headers: jsonHeaders() });
    const notifications = data.notifications || [];
    unreadCount = notifications.filter(notification => !notification.read).length;
    updateBadge(unreadCount);
    renderList(notifications);
  } catch {
    if (list) list.innerHTML = '<div class="notif-empty">Αδυναμία φόρτωσης.</div>';
  }
}

function renderList(notifications) {
  const list = el('notif-list');
  if (!list) return;
  if (!notifications.length) { list.innerHTML = '<div class="notif-empty">Δεν έχεις ειδοποιήσεις.</div>'; return; }
  list.innerHTML = '';
  notifications.forEach(notification => {
    const item = document.createElement('div');
    item.className = `notif-item${notification.read ? '' : ' notif-unread'}`;
    item.dataset.id = notification.id;
    const message = messages[notification.type]?.(notification.from_user) || notification.message || 'Νέα ειδοποίηση';
    item.innerHTML = `<div class="notif-icon">${icons[notification.type] || '🔔'}</div><div class="notif-body"><div class="notif-msg">${esc(message)}</div><div class="notif-time">${timeAgo(new Date(notification.created_at).getTime())}</div></div>${notification.read ? '' : '<div class="notif-dot"></div>'}`;
    item.addEventListener('click', () => handleClick(notification));
    list.appendChild(item);
  });
}

async function handleClick(notification) {
  if (!notification.read) {
    try {
      const { response } = await request(`/api/notifications/${notification.id}/read`, { method: 'POST', headers: jsonHeaders() });
      if (response.ok) { notification.read = true; unreadCount = Math.max(0, unreadCount - 1); updateBadge(unreadCount); }
    } catch {}
  }
  closeNotificationDropdown();
  if (notification.type === 'friend_request' || notification.type === 'dm') {
    navigate.switchTab('messages');
    navigate.switchMsgSubTab('people');
  } else if (notification.type === 'post_like' || notification.type === 'post_comment') {
    navigate.switchTab('feed');
  } else if (['thread_like', 'thread_reply', 'reply_like'].includes(notification.type)) {
    navigate.switchTab('threads');
    if (notification.ref_id) {
      try {
        const { response, data } = await request(`/api/threads/${notification.ref_id}`, { headers: authHeaders() });
        if (response.ok) { navigate.openThread(data.thread); navigate.renderThreadDetail(data.thread, data.replies); }
      } catch {}
    }
  }
}

async function markAllRead() {
  try {
    const { response } = await request('/api/notifications/read-all', { method: 'POST', headers: jsonHeaders() });
    if (!response.ok) return;
    unreadCount = 0;
    updateBadge(0);
    el('notif-list')?.querySelectorAll('.notif-item').forEach(item => {
      item.classList.remove('notif-unread');
      item.querySelector('.notif-dot')?.remove();
    });
  } catch {}
}
