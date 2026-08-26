import { el } from './dom.js';
import { apiUrl } from './config.js';
import { esc, genId, md } from './utils.js';

let sessionId = null;
let anonymousHistory = [];
let attachedFile = null;
let deps = {};

export function initChat(callbacks) {
  deps = callbacks;
  el('send-action-btn')?.addEventListener('click', sendChat);
  el('user-input')?.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); sendChat(); }
  });
  el('file-input')?.addEventListener('change', selectFile);
  el('clear-file-action')?.addEventListener('click', clearFile);
}

export function newChat() {
  sessionId = genId();
  anonymousHistory = [];
  el('chat-logs')?.replaceChildren();
  el('chat-logs')?.classList.add('hidden');
  el('greeting')?.classList.remove('hidden');
  if (el('user-input')) el('user-input').value = '';
  highlightSession();
  deps.switchTab('chat');
}

export function loadSessions() {
  const sessions = JSON.parse(localStorage.getItem('tox_sessions') || '[]');
  document.querySelectorAll('.session-item').forEach(item => item.remove());
  const list = el('sessions-list');
  sessions.forEach(session => {
    const item = document.createElement('button');
    item.className = 'session-item';
    item.dataset.sid = session.id;
    item.innerHTML = `<span class="session-label">${esc(session.label || session.id)}</span><button class="session-del" title="Διαγραφή">✕</button>`;
    item.querySelector('.session-label').addEventListener('click', () => loadSessionHistory(session.id));
    item.querySelector('.session-del').addEventListener('click', async event => {
      event.stopPropagation(); await deleteSession(session.id); loadSessions();
    });
    list?.insertBefore(item, el('sessions-guest-note'));
  });
  highlightSession();
}

function highlightSession() {
  document.querySelectorAll('.session-item').forEach(item => item.classList.toggle('active', item.dataset.sid === sessionId));
}

export async function loadSessionHistory(id) {
  if (!deps.loggedIn()) return;
  sessionId = id; el('chat-logs')?.replaceChildren(); highlightSession();
  try {
    const response = await fetch(apiUrl(`/api/history/${id}`), { headers: { Authorization: `Bearer ${localStorage.getItem('tox_token')}` } });
    const data = await response.json();
    if (response.status === 401) { deps.logout(); return; }
    const history = data.history || [];
    el('greeting')?.classList.toggle('hidden', history.length > 0);
    el('chat-logs')?.classList.toggle('hidden', history.length === 0);
    history.forEach(message => appendMessage(message.content || '', message.role === 'user' ? 'Εσείς' : 'ΗΡΑ', message.role === 'user' ? 'user-msg' : 'agent-msg', false));
  } catch { appendMessage('Αδυναμία φόρτωσης.', 'ΗΡΑ', 'agent-msg'); }
}

function selectFile() {
  const file = el('file-input')?.files[0]; if (!file) return;
  attachedFile = file;
  if (el('attached-filename')) el('attached-filename').textContent = file.name;
  el('file-preview')?.classList.remove('hidden');
}
function clearFile() { attachedFile = null; if (el('file-input')) el('file-input').value = ''; el('file-preview')?.classList.add('hidden'); }

async function sendChat() {
  const text = el('user-input')?.value.trim();
  if (!text && !attachedFile) return;
  if (el('user-input')) el('user-input').value = '';
  const file = attachedFile; clearFile();
  el('greeting')?.classList.add('hidden'); el('chat-logs')?.classList.remove('hidden');
  if (!sessionId) sessionId = genId();
  if (deps.loggedIn() && text) saveSession(text);
  appendMessage(text || `📎 ${file.name}`, 'Εσείς', 'user-msg');
  const typing = appendTyping();
  try {
    const body = new FormData(); if (text) body.append('message', text); if (file) body.append('file', file);
    const headers = deps.loggedIn() ? { Authorization: `Bearer ${localStorage.getItem('tox_token')}` } : {};
    if (deps.loggedIn()) body.append('sessionId', sessionId); else body.append('anonHistory', JSON.stringify(anonymousHistory));
    const response = await fetch(apiUrl('/api/chat'), { method: 'POST', headers, body });
    const data = await response.json();
    if (response.status === 401) { deps.logout(); return; }
    const reply = response.ok ? data.reply : (data.error || 'Σφάλμα.');
    typing.remove(); appendMessage(reply, 'ΗΡΑ', 'agent-msg');
    if (!deps.loggedIn()) { if (text) anonymousHistory.push({ role: 'user', content: text }); anonymousHistory.push({ role: 'model', content: reply }); }
  } catch { typing.remove(); appendMessage('Αδυναμία σύνδεσης.', 'ΗΡΑ', 'agent-msg'); }
}

function saveSession(text) {
  const sessions = JSON.parse(localStorage.getItem('tox_sessions') || '[]');
  if (sessions.some(session => session.id === sessionId)) return;
  sessions.unshift({ id: sessionId, label: text.slice(0, 40) });
  localStorage.setItem('tox_sessions', JSON.stringify(sessions.slice(0, 30)));
  loadSessions();
}
function appendMessage(text, sender, className, animate = true) {
  const logs = el('chat-logs'); if (!logs) return null;
  const row = document.createElement('div'); row.className = `msg-row ${className} ${className === 'user-msg' ? 'user-row' : 'agent-row'}`;
  if (!animate) row.style.animation = 'none';
  row.innerHTML = `<div class="msg-sender">${sender}</div><div class="msg-text">${className === 'agent-msg' ? md(text) : esc(text)}</div>`;
  logs.append(row); logs.scrollTop = 99999; return row;
}
function appendTyping() {
  const row = document.createElement('div'); row.className = 'msg-row agent-msg agent-row';
  row.innerHTML = '<div class="msg-sender">ΗΡΑ</div><div class="msg-text"><span class="typing-indicator"><span></span><span></span><span></span></span></div>';
  el('chat-logs')?.append(row); return row;
}
async function deleteSession(id) {
  const sessions = JSON.parse(localStorage.getItem('tox_sessions') || '[]').filter(session => session.id !== id);
  localStorage.setItem('tox_sessions', JSON.stringify(sessions));
  if (deps.loggedIn()) await fetch(apiUrl(`/api/sessions/${id}`), { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('tox_token')}` } }).catch(() => {});
}
