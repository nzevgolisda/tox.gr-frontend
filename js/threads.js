import { CAT_EMOJI } from './config.js';
import { el } from './dom.js';
import { authHeaders, request } from './api.js';
import { debounce, esc, PP, safeAttr, timeAgo } from './utils.js';

let currentThread = null;
let currentCategory = '';
let deps = {};

export function initThreads(callbacks) {
  deps = callbacks;
  el('thread-search')?.addEventListener('input', debounce(loadThreads, 400));
  document.querySelectorAll('.cat-chip').forEach(chip => chip.addEventListener('click', () => {
    document.querySelectorAll('.cat-chip').forEach(item => item.classList.remove('active'));
    chip.classList.add('active');
    currentCategory = chip.dataset.cat || '';
    loadThreads();
  }));
  el('create-thread-fab')?.addEventListener('click', () => {
    if (!deps.loggedIn()) { deps.openAuth(); return; }
    openCreateThread();
  });
  el('close-thread-modal-btn')?.addEventListener('click', closeCreateThread);
  el('create-thread-modal')?.addEventListener('click', event => {
    if (event.target === el('create-thread-modal')) closeCreateThread();
  });
  el('publish-thread-btn')?.addEventListener('click', publishThread);
  el('back-to-threads-btn')?.addEventListener('click', backToThreads);
  el('thread-reply-btn')?.addEventListener('click', sendThreadReply);
  el('thread-reply-input')?.addEventListener('keydown', event => {
    if (event.key === 'Enter') sendThreadReply();
  });
}

export async function loadThreads() {
  el('threads-loading')?.classList.remove('hidden');
  el('threads-empty')?.classList.add('hidden');
  const container = el('threads-container');
  if (container) container.replaceChildren();
  try {
    const params = new URLSearchParams({ limit: '40' });
    if (currentCategory) params.set('category', currentCategory);
    const search = el('thread-search')?.value.trim();
    if (search) params.set('search', search);
    const { response, data } = await request(`/api/threads?${params}`, { headers: authHeaders() });
    el('threads-loading')?.classList.add('hidden');
    if (!response.ok || !data.threads?.length) {
      el('threads-empty')?.classList.remove('hidden');
      return;
    }
    data.threads.forEach(thread => container?.appendChild(buildThreadCard(thread)));
  } catch (error) {
    el('threads-loading')?.classList.add('hidden');
    console.error('loadThreads:', error);
  }
}

function buildThreadCard(thread) {
  const card = document.createElement('div');
  card.className = 'thread-card';
  const badge = document.createElement('span');
  badge.className = 'cat-badge';
  badge.dataset.cat = thread.category;
  badge.textContent = `${CAT_EMOJI[thread.category] || ''} ${thread.category}`;
  const top = document.createElement('div');
  top.className = 'thread-card-top';
  top.appendChild(badge);
  card.append(top);

  const title = document.createElement('div');
  title.className = 'thread-card-title';
  title.textContent = thread.title;
  card.append(title);
  if (thread.content) {
    const excerpt = document.createElement('div');
    excerpt.className = 'thread-card-excerpt';
    excerpt.textContent = thread.content;
    card.append(excerpt);
  }
  const footer = document.createElement('div');
  footer.className = 'thread-card-footer';
  footer.innerHTML = `<span class="thread-card-author">${esc(thread.author)} · ${timeAgo(new Date(thread.created_at).getTime())}</span><span class="thread-stat">❤ ${thread.like_count}</span><span class="thread-stat">💬 ${thread.reply_count}</span>`;
  card.append(footer);
  card.addEventListener('click', () => openThread(thread));
  return card;
}

export function openThread(thread) {
  currentThread = thread;
  const badge = el('thread-detail-cat-badge');
  if (badge) {
    badge.dataset.cat = thread.category;
    badge.textContent = `${CAT_EMOJI[thread.category] || ''} ${thread.category}`;
  }
  if (el('thread-detail-title-header')) el('thread-detail-title-header').textContent = thread.title;
  ['thread-post-card', 'thread-replies-header', 'thread-replies-list'].forEach(id => el(id)?.replaceChildren());
  el('thread-list-view')?.classList.add('hidden');
  el('thread-detail-view')?.classList.remove('hidden');
  loadThreadDetail(thread.id);
}

export function backToThreads() {
  el('thread-detail-view')?.classList.add('hidden');
  el('thread-list-view')?.classList.remove('hidden');
  currentThread = null;
  if (el('thread-reply-input')) el('thread-reply-input').value = '';
}

async function loadThreadDetail(threadId) {
  try {
    const { response, data } = await request(`/api/threads/${threadId}`, { headers: authHeaders() });
    if (!response.ok) { backToThreads(); return; }
    renderThreadDetail(data.thread, data.replies || []);
  } catch (error) { console.error('loadThreadDetail:', error); }
}

export function renderThreadDetail(thread, replies) {
  const postCard = el('thread-post-card');
  if (postCard) {
    postCard.replaceChildren();
    const title = document.createElement('div');
    title.className = 'thread-post-title';
    title.textContent = thread.title;
    postCard.append(title);
    if (thread.content) {
      const body = document.createElement('div');
      body.className = 'thread-post-body';
      body.textContent = thread.content;
      postCard.append(body);
    }
    const meta = document.createElement('div');
    meta.className = 'thread-post-meta';
    const author = document.createElement('span');
    author.textContent = thread.author;
    author.style.cssText = 'cursor:pointer;color:var(--accent);font-weight:500';
    author.addEventListener('click', () => deps.openUserProfile(thread.author));
    meta.append(author);
    meta.insertAdjacentHTML('beforeend', ` <span>·</span> <span>${timeAgo(new Date(thread.created_at).getTime())}</span>`);
    postCard.append(meta);

    const footer = document.createElement('div');
    footer.className = 'thread-post-footer';
    const likeButton = document.createElement('button');
    likeButton.className = `thread-like-btn${thread.liked ? ' liked' : ''}`;
    likeButton.innerHTML = `❤ <span>${thread.like_count}</span>`;
    likeButton.addEventListener('click', () => {
      if (!deps.loggedIn()) { deps.openAuth(); return; }
      likeThread(thread.id, likeButton);
    });
    footer.append(likeButton);
    if (thread.author === deps.username()) {
      const deleteButton = document.createElement('button');
      deleteButton.className = 'thread-delete-btn';
      deleteButton.title = 'Διαγραφή νήματος';
      deleteButton.textContent = '🗑';
      deleteButton.addEventListener('click', async () => {
        if (confirm('Διαγραφή νήματος;')) await deleteThread(thread.id);
      });
      footer.append(deleteButton);
    }
    postCard.append(footer);
  }

  const header = el('thread-replies-header');
  if (header) header.textContent = replies.length ? `${replies.length} ${replies.length === 1 ? 'Απάντηση' : 'Απαντήσεις'}` : 'Καμία απάντηση ακόμα';
  const list = el('thread-replies-list');
  if (list) { list.replaceChildren(); replies.forEach(reply => list.append(buildReplyCard(reply))); }
  const bar = el('thread-reply-bar');
  if (bar) bar.style.display = deps.loggedIn() ? 'flex' : 'none';
  if (el('thread-detail-scroll')) el('thread-detail-scroll').scrollTop = 0;
}

function buildReplyCard(reply) {
  const card = document.createElement('div');
  card.className = 'thread-reply-card';
  const header = document.createElement('div');
  header.className = 'thread-reply-header';
  const avatar = document.createElement('div');
  avatar.className = 'reply-avatar';
  const picture = PP.get(reply.author);
  const authorInitial = (reply.author || '?')[0].toUpperCase();
  avatar.innerHTML = picture ? `<img src="${safeAttr(picture)}" alt="${safeAttr(authorInitial)}">` : safeAttr(authorInitial);
  const author = document.createElement('span');
  author.className = 'reply-author';
  author.textContent = reply.author;
  author.style.cursor = 'pointer';
  author.addEventListener('click', () => deps.openUserProfile(reply.author));
  const time = document.createElement('span');
  time.className = 'reply-time';
  time.textContent = timeAgo(new Date(reply.created_at).getTime());
  header.append(avatar, author, time);
  card.append(header);

  const body = document.createElement('div');
  body.className = 'thread-reply-body';
  body.textContent = reply.content;
  card.append(body);
  const footer = document.createElement('div');
  footer.className = 'thread-reply-footer';
  const likeButton = document.createElement('button');
  likeButton.className = `reply-like-btn${reply.liked ? ' liked' : ''}`;
  likeButton.innerHTML = `❤ <span>${reply.like_count}</span>`;
  likeButton.addEventListener('click', () => {
    if (!deps.loggedIn()) { deps.openAuth(); return; }
    likeReply(reply.id, likeButton);
  });
  footer.append(likeButton);
  if (reply.author === deps.username()) {
    const deleteButton = document.createElement('button');
    deleteButton.className = 'reply-delete-btn';
    deleteButton.title = 'Διαγραφή';
    deleteButton.textContent = '🗑';
    deleteButton.addEventListener('click', () => deleteReply(reply.id, card));
    footer.append(deleteButton);
  }
  card.append(footer);
  return card;
}

async function likeThread(threadId, button) {
  try {
    const { response, data } = await request(`/api/threads/${threadId}/like`, { method: 'POST', headers: jsonHeaders() });
    if (!response.ok) return;
    button.classList.toggle('liked', data.liked);
    const count = button.querySelector('span');
    if (count) count.textContent = data.count;
  } catch {}
}

async function likeReply(replyId, button) {
  try {
    const { response, data } = await request(`/api/threads/replies/${replyId}/like`, { method: 'POST', headers: jsonHeaders() });
    if (!response.ok) return;
    button.classList.toggle('liked', data.liked);
    const count = button.querySelector('span');
    if (count) count.textContent = data.count;
  } catch {}
}

async function sendThreadReply() {
  if (!currentThread || !deps.loggedIn()) return;
  const input = el('thread-reply-input');
  const content = input?.value.trim();
  if (!content) return;
  input.value = '';
  try {
    const { response, data } = await request(`/api/threads/${currentThread.id}/replies`, { method: 'POST', headers: jsonHeaders(), body: JSON.stringify({ content }) });
    if (!response.ok) { alert(data.error); input.value = content; return; }
    el('thread-replies-list')?.append(buildReplyCard(data.reply));
    if (el('thread-detail-scroll')) el('thread-detail-scroll').scrollTop = 99999;
    const count = el('thread-replies-list')?.querySelectorAll('.thread-reply-card').length || 0;
    if (el('thread-replies-header')) el('thread-replies-header').textContent = `${count} ${count === 1 ? 'Απάντηση' : 'Απαντήσεις'}`;
  } catch (error) { console.error('sendThreadReply:', error); }
}

async function deleteThread(threadId) {
  try {
    const { response, data } = await request(`/api/threads/${threadId}`, { method: 'DELETE', headers: jsonHeaders() });
    if (!response.ok) { alert(data.error); return; }
    backToThreads();
    loadThreads();
  } catch {}
}

async function deleteReply(replyId, card) {
  if (!confirm('Διαγραφή απάντησης;')) return;
  try {
    const { response } = await request(`/api/threads/replies/${replyId}`, { method: 'DELETE', headers: jsonHeaders() });
    if (!response.ok) return;
    card.style.transition = 'opacity 0.25s, height 0.25s';
    card.style.opacity = '0';
    card.style.overflow = 'hidden';
    card.style.height = `${card.offsetHeight}px`;
    requestAnimationFrame(() => { card.style.height = '0'; card.style.padding = '0'; card.style.margin = '0'; });
    setTimeout(() => {
      card.remove();
      const count = el('thread-replies-list')?.querySelectorAll('.thread-reply-card').length || 0;
      if (el('thread-replies-header')) el('thread-replies-header').textContent = count ? `${count} ${count === 1 ? 'Απάντηση' : 'Απαντήσεις'}` : 'Καμία απάντηση ακόμα';
    }, 280);
  } catch {}
}

function openCreateThread() {
  if (el('thread-cat-select')) el('thread-cat-select').value = '';
  if (el('thread-title-input')) el('thread-title-input').value = '';
  if (el('thread-content-input')) el('thread-content-input').value = '';
  el('thread-modal-err')?.classList.add('hidden');
  el('create-thread-modal')?.classList.remove('hidden');
  setTimeout(() => el('thread-title-input')?.focus(), 80);
}

function closeCreateThread() { el('create-thread-modal')?.classList.add('hidden'); }

async function publishThread() {
  const title = el('thread-title-input')?.value.trim();
  const content = el('thread-content-input')?.value.trim();
  const category = el('thread-cat-select')?.value;
  const errorElement = el('thread-modal-err');
  const showError = message => {
    if (!errorElement) return;
    errorElement.textContent = message;
    errorElement.style.color = 'var(--danger)';
    errorElement.style.background = 'rgba(220,38,38,0.08)';
    errorElement.classList.remove('hidden');
  };
  if (!category) { showError('Επιλέξτε κατηγορία.'); return; }
  if (!title) { showError('Δώστε τίτλο.'); return; }
  const button = el('publish-thread-btn');
  if (button) { button.disabled = true; button.textContent = '...'; }
  try {
    const { response, data } = await request('/api/threads', { method: 'POST', headers: jsonHeaders(), body: JSON.stringify({ title, content: content || null, category }) });
    if (!response.ok) { showError(data.error); return; }
    closeCreateThread();
    loadThreads();
  } catch { showError('Σφάλμα σύνδεσης.'); }
  finally { if (button) { button.disabled = false; button.textContent = 'Δημοσίευση'; } }
}
