import { el } from './dom.js';
import { request } from './api.js';

let mode = 'login';
let deps = {};

export function initAuth(callbacks) {
  deps = callbacks;
  el('open-auth-btn')?.addEventListener('click', openAuth);
  el('feed-auth-link')?.addEventListener('click', openAuth);
  el('close-auth-btn')?.addEventListener('click', closeAuth);
  el('skip-auth-link')?.addEventListener('click', closeAuth);
  el('auth-overlay')?.addEventListener('click', event => {
    if (event.target === el('auth-overlay')) closeAuth();
  });
  el('auth-submit-btn')?.addEventListener('click', submitAuth);
  el('toggle-auth-link')?.addEventListener('click', toggleAuthMode);
  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !el('auth-overlay')?.classList.contains('hidden')) submitAuth();
  });
}

export function openAuth() {
  el('auth-overlay')?.classList.remove('hidden');
  el('auth-username')?.focus();
}

export function closeAuth() {
  el('auth-overlay')?.classList.add('hidden');
  el('auth-error')?.classList.add('hidden');
}

function toggleAuthMode() {
  mode = mode === 'login' ? 'signup' : 'login';
  el('auth-title').textContent = mode === 'login' ? 'Σύνδεση' : 'Εγγραφή';
  el('auth-submit-btn').textContent = mode === 'login' ? 'Είσοδος' : 'Δημιουργία λογαριασμού';
  el('toggle-auth-link').textContent = mode === 'login' ? 'Εγγραφή' : 'Σύνδεση';
  el('toggle-auth-text').firstChild.textContent = mode === 'login' ? 'Δεν έχετε λογαριασμό; ' : 'Έχετε λογαριασμό; ';
  el('auth-error')?.classList.add('hidden');
}

function showError(message, success = false) {
  const error = el('auth-error');
  if (!error) return;
  error.textContent = message;
  error.style.color = success ? 'var(--success)' : 'var(--danger)';
  error.style.background = success ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)';
  error.classList.remove('hidden');
}

async function submitAuth() {
  const username = el('auth-username')?.value.trim();
  const password = el('auth-password')?.value;
  if (!username || !password) return;
  const button = el('auth-submit-btn');
  button.disabled = true;
  button.textContent = '...';
  try {
    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    const { response, data } = await request(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!response.ok) {
      showError(data.error || 'Σφάλμα.');
    } else if (mode === 'login') {
      localStorage.setItem('tox_token', data.token);
      localStorage.setItem('tox_user', data.username);
      closeAuth();
      deps.applyLoggedIn(data.username);
      deps.loadSessions();
      deps.loadFeed();
      deps.heartbeat();
    } else {
      showError('Ο λογαριασμός δημιουργήθηκε! Συνδεθείτε.', true);
      mode = 'login';
      el('auth-title').textContent = 'Σύνδεση';
      el('auth-submit-btn').textContent = 'Είσοδος';
    }
  } catch {
    showError('Αδυναμία σύνδεσης.');
  } finally {
    button.disabled = false;
    button.textContent = mode === 'login' ? 'Είσοδος' : 'Δημιουργία λογαριασμού';
  }
}
