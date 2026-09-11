import { apiUrl } from './config.js';
import { el } from './dom.js';
import { authHeaders, jsonHeaders } from './api.js';
import { esc, PP, safeAttr, timeAgo } from './utils.js';

let offset = 0;
let pendingGif = null;
let deps = {};

export function initFeed(callbacks) {
  deps = callbacks;
  el('post-type-select')?.addEventListener('change', updateLimitInfo);
  el('post-media-input')?.addEventListener('change', selectMedia);
  el('clear-post-media-btn')?.addEventListener('click', clearMedia);
  el('clear-post-gif')?.addEventListener('click', clearPostGif);
  el('post-gif-btn')?.addEventListener('click', () => deps.openGifPicker('post'));
  el('publish-btn')?.addEventListener('click', publishPost);
  el('load-more-btn')?.addEventListener('click', () => loadFeed(true));
  el('lightbox')?.addEventListener('click', event => { if (event.target.id === 'lightbox' || event.target.id === 'lightbox-img') el('lightbox').classList.add('hidden'); });
  el('lightbox-close')?.addEventListener('click', () => el('lightbox').classList.add('hidden'));
}
export async function loadFeed(append = false) {
  if (!append) offset = 0;
  el('feed-loading')?.classList.remove('hidden');
  try {
    const response = await fetch(apiUrl(`/api/posts?limit=20&offset=${offset}`), { headers: authHeaders() });
    const data = await response.json(); el('feed-loading')?.classList.add('hidden');
    if (!response.ok || !data.posts) { if (!append) el('posts-container').innerHTML = '<p class="feed-empty-sub">Αδυναμία φόρτωσης</p>'; return; }
    if (!append) el('posts-container')?.replaceChildren();
    el('feed-empty')?.classList.toggle('hidden', data.posts.length > 0 || append);
    data.posts.forEach(post => el('posts-container')?.append(buildPostCard(post)));
    offset += data.posts.length; el('load-more-btn')?.classList.toggle('hidden', data.posts.length < 20);
    if (deps.loggedIn()) { el('create-post-card').style.display = 'flex'; el('feed-guest-notice')?.classList.add('hidden'); }
  } catch (error) { el('feed-loading')?.classList.add('hidden'); console.error('feed:', error); }
}
export function updateLimitInfo() { const info = el('post-limit-info'); if (info && deps.loggedIn()) info.textContent = `max ${el('post-type-select')?.value === 'public' ? 3 : 10}/ημέρα`; }
function selectMedia() {
  const file = el('post-media-input')?.files[0]; if (!file) return;
  const reader = new FileReader(); reader.onload = event => { const image = new Image(); image.onload = () => { const max = 1280; const scale = Math.min(1, max / Math.max(image.width, image.height)); const canvas = document.createElement('canvas'); canvas.width = image.width * scale; canvas.height = image.height * scale; canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height); el('post-media-img').src = canvas.toDataURL('image/jpeg', 0.82); el('post-media-preview')?.classList.remove('hidden'); pendingGif = null; }; image.src = event.target.result; }; reader.readAsDataURL(file);
}
function clearMedia() { if (el('post-media-input')) el('post-media-input').value = ''; el('post-media-preview')?.classList.add('hidden'); }
export function setPostGif(url) { pendingGif = url; el('post-gif-img').src = url; el('post-gif-preview')?.classList.remove('hidden'); el('post-media-preview')?.classList.add('hidden'); }
function clearPostGif() { pendingGif = null; el('post-gif-preview')?.classList.add('hidden'); }
async function publishPost() {
  if (!deps.loggedIn()) { deps.openAuth(); return; }
  const content = el('post-text-input')?.value.trim(); const media = el('post-media-img'); const mediaData = !el('post-media-preview')?.classList.contains('hidden') ? media?.src : null;
  if (!content && !mediaData && !pendingGif) return;
  const response = await fetch(apiUrl('/api/posts'), { method: 'POST', headers: jsonHeaders(), body: JSON.stringify({ type: el('post-type-select')?.value || 'public', content: content || null, media_data: mediaData, media_type: mediaData ? 'image' : null, gif_url: pendingGif }) });
  const data = await response.json(); if (!response.ok) { alert(data.error); return; }
  el('post-text-input').value = ''; clearMedia(); clearPostGif(); loadFeed();
}
function buildPostCard(post) {
  const card = document.createElement('div'); card.className = 'post-card'; const name = post.author || '?'; const picture = PP.get(name);
  const safeName = esc(name);
  const safeContent = post.content ? `<div class="post-content">${esc(post.content)}</div>` : '';
  const safeGif = post.gif_url ? `<div class="post-media"><img src="${safeAttr(post.gif_url)}" alt="GIF"></div>` : '';
  card.innerHTML = `<div class="post-header"><div class="post-avatar">${picture ? `<img src="${safeAttr(picture)}">` : safeName[0]?.toUpperCase() || '?'}</div><div class="post-meta"><div class="post-author">${safeName}</div><div class="post-time">${timeAgo(new Date(post.created_at).getTime())}</div></div></div>${safeContent}${safeGif}<div class="post-footer"><button class="post-like-btn ${post.liked ? 'liked' : ''}">❤ <span>${post.like_count}</span></button><button class="post-comment-toggle">💬 <span>${post.comment_count}</span></button></div><div class="post-comments hidden"><div class="cmt-list"></div>${deps.loggedIn() ? '<input class="cmt-input" placeholder="Σχόλιο..."><button class="cmt-send-btn">→</button>' : ''}</div>`;
  card.querySelector('.post-avatar').addEventListener('click', () => deps.openUserProfile(name));
  card.querySelector('.post-like-btn').addEventListener('click', async () => { if (!deps.loggedIn()) { deps.openAuth(); return; } const response = await fetch(apiUrl(`/api/posts/${post.id}/like`), { method: 'POST', headers: jsonHeaders() }); const data = await response.json(); card.querySelector('.post-like-btn').classList.toggle('liked', data.liked); card.querySelector('.post-like-btn span').textContent = data.count; });
  card.querySelector('.post-comment-toggle').addEventListener('click', async () => { const section = card.querySelector('.post-comments'); section.classList.toggle('hidden'); if (!section.classList.contains('hidden')) { const response = await fetch(apiUrl(`/api/posts/${post.id}/comments`), { headers: authHeaders() }); const data = await response.json(); card.querySelector('.cmt-list').innerHTML = (data.comments || []).slice(0, 3).map(comment => `<div class="comment"><b>${esc(comment.author)}</b> ${esc(comment.content)}</div>`).join(''); } });
  card.querySelector('.cmt-send-btn')?.addEventListener('click', async () => { const input = card.querySelector('.cmt-input'); const content = input.value.trim(); if (!content) return; const response = await fetch(apiUrl(`/api/posts/${post.id}/comments`), { method: 'POST', headers: jsonHeaders(), body: JSON.stringify({ content }) }); const data = await response.json(); if (response.ok) { input.value = ''; card.querySelector('.cmt-list').insertAdjacentHTML('beforeend', `<div class="comment"><b>${esc(data.comment.author)}</b> ${esc(data.comment.content)}</div>`); } });
  card.querySelectorAll('.post-media img').forEach(image => image.addEventListener('click', () => { el('lightbox-img').src = image.src; el('lightbox').classList.remove('hidden'); })); return card;
}
