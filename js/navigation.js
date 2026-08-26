import { apiUrl } from './config.js';
import { el } from './dom.js';
import { esc } from './utils.js';

let subTab = 'people';
let deps = {};
const sections = { feed: 'feed-section', chat: 'chat-section', messages: 'messages-section', threads: 'threads-section' };

export function initNavigation(callbacks) {
  deps = callbacks;
  document.querySelectorAll('.tab-btn[data-tab], .btm-tab[data-tab]').forEach(button => button.addEventListener('click', () => switchTab(button.dataset.tab)));
  document.querySelectorAll('.msg-sub-tab[data-msub]').forEach(button => button.addEventListener('click', () => switchMsgSubTab(button.dataset.msub)));
  el('mob-menu-btn')?.addEventListener('click', event => { event.stopPropagation(); toggleMobMenu(); });
  el('mob-overlay')?.addEventListener('click', closeMobMenu);
  el('mob-history-btn')?.addEventListener('click', () => { closeMobMenu(); openHistory(); });
  el('mob-profile-btn')?.addEventListener('click', () => { closeMobMenu(); deps.loggedIn() ? deps.openOwnProfile() : deps.openAuth(); });
  el('mob-settings-btn')?.addEventListener('click', () => { closeMobMenu(); openSettings(); });
  el('mob-theme-btn')?.addEventListener('click', () => { closeMobMenu(); deps.toggleTheme(); });
  el('mob-auth-btn')?.addEventListener('click', () => { closeMobMenu(); deps.loggedIn() ? deps.logout() : deps.openAuth(); });
  el('settings-gear-btn')?.addEventListener('click', openSettings);
  el('close-settings-btn')?.addEventListener('click', () => el('settings-panel')?.classList.add('hidden'));
  el('settings-theme-row')?.addEventListener('click', deps.toggleTheme);
  el('delete-account-btn')?.addEventListener('click', deleteAccount);
  el('close-history-btn')?.addEventListener('click', () => el('history-panel')?.classList.add('hidden'));
}

export function switchTab(tab) {
  Object.entries(sections).forEach(([name, id]) => el(id)?.classList.toggle('hidden', name !== tab));
  document.querySelectorAll('.tab-btn[data-tab], .btm-tab[data-tab]').forEach(button => button.classList.toggle('active', button.dataset.tab === tab));
  deps.stopOnlinePoll();
  if (tab === 'feed') deps.loadFeed();
  if (tab === 'messages') { switchMsgSubTab(subTab); deps.startOnlinePoll(); }
  if (tab === 'threads') deps.loadThreads();
  closeMobMenu();
}

export function switchMsgSubTab(value) {
  subTab = value;
  el('msg-people-pane')?.classList.toggle('hidden', value !== 'people');
  el('msg-groups-pane')?.classList.toggle('hidden', value !== 'groups');
  document.querySelectorAll('.msg-sub-tab[data-msub]').forEach(button => button.classList.toggle('active', button.dataset.msub === value));
  if (value === 'people') { deps.loadFriends(); deps.backToFriends(); }
  if (value === 'groups') { deps.backToGroups(); deps.loadGroups(); }
}

function toggleMobMenu() {
  const dropdown = el('mob-dropdown');
  const open = !dropdown?.classList.contains('hidden');
  dropdown?.classList.toggle('hidden', open);
  el('mob-overlay')?.classList.toggle('hidden', open);
}
export function closeMobMenu() { el('mob-dropdown')?.classList.add('hidden'); el('mob-overlay')?.classList.add('hidden'); }

function openSettings() {
  if (deps.loggedIn() && el('settings-username-val')) el('settings-username-val').textContent = localStorage.getItem('tox_user') || '';
  el('settings-panel')?.classList.remove('hidden');
}

function openHistory() {
  const list = el('history-list');
  const empty = el('history-empty');
  const sessions = JSON.parse(localStorage.getItem('tox_sessions') || '[]');
  if (!list) return;
  list.replaceChildren();
  empty?.classList.toggle('hidden', sessions.length > 0);
  sessions.forEach(session => {
    const row = document.createElement('div'); row.className = 'history-row';
    row.innerHTML = `<span class="history-label">${esc(session.label || session.id)}</span><div class="history-actions"><button class="history-load-btn">Άνοιγμα</button><button class="history-del-btn">✕</button></div>`;
    row.querySelector('.history-load-btn').addEventListener('click', () => { el('history-panel')?.classList.add('hidden'); deps.loadSessionHistory(session.id); switchTab('chat'); });
    row.querySelector('.history-del-btn').addEventListener('click', async () => { await deleteSession(session.id); openHistory(); });
    list.append(row);
  });
  el('history-panel')?.classList.remove('hidden');
}

async function deleteSession(id) {
  const sessions = JSON.parse(localStorage.getItem('tox_sessions') || '[]').filter(session => session.id !== id);
  localStorage.setItem('tox_sessions', JSON.stringify(sessions));
  if (deps.loggedIn()) await fetch(apiUrl(`/api/sessions/${id}`), { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('tox_token')}` } }).catch(() => {});
}

async function deleteAccount() {
  if (!confirm('Διαγραφή λογαριασμού; Μη αναστρέψιμη ενέργεια.')) return;
  try {
    const response = await fetch(apiUrl('/api/users/me'), { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('tox_token')}` } });
    if (!response.ok) { alert('Αδυναμία διαγραφής λογαριασμού.'); return; }
    deps.logout();
    el('settings-panel')?.classList.add('hidden');
    alert('Ο λογαριασμός διαγράφηκε.');
  } catch { alert('Σφάλμα.'); }
}
