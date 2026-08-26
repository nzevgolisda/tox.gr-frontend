import { GIPHY_KEY } from './config.js';
import { el } from './dom.js';
import { debounce } from './utils.js';

let target = null;
let deps = {};

export function initGifs(callbacks) {
  deps = callbacks;
  el('close-gif-btn')?.addEventListener('click', closeGifPicker);
  el('gif-picker-overlay')?.addEventListener('click', event => { if (event.target === el('gif-picker-overlay')) closeGifPicker(); });
  el('gif-search-input')?.addEventListener('input', debounce(searchGifs, 400));
}
export function openGifPicker(type) { target = type; if (el('gif-search-input')) el('gif-search-input').value = ''; el('gif-picker-overlay')?.classList.remove('hidden'); loadGifs(); }
function closeGifPicker() { el('gif-picker-overlay')?.classList.add('hidden'); target = null; }
async function loadGifs() { const query = el('gif-search-input')?.value.trim(); const endpoint = query ? `search?q=${encodeURIComponent(query)}` : 'trending?'; el('gif-loading')?.classList.remove('hidden'); try { const response = await fetch(`https://api.giphy.com/v1/gifs/${endpoint}api_key=${GIPHY_KEY}&limit=12&rating=g`); const data = await response.json(); renderGifs(data.data || []); } catch { el('gif-loading')?.classList.add('hidden'); } }
function searchGifs() { loadGifs(); }
function renderGifs(gifs) {
  el('gif-loading')?.classList.add('hidden'); const grid = el('gif-grid'); if (!grid) return; grid.replaceChildren();
  gifs.forEach(gif => { const image = document.createElement('img'); image.className = 'gif-thumb'; image.src = gif.images?.fixed_height_small?.url || ''; image.alt = gif.title || 'GIF'; image.addEventListener('click', () => selectGif(gif.images?.original?.url || image.src)); grid.append(image); });
}
function selectGif(url) {
  const selectedTarget = target; closeGifPicker();
  if (selectedTarget === 'post') deps.setPostGif(url);
  if (selectedTarget === 'dm') deps.setMessageGif('dm', url);
  if (selectedTarget === 'grp') deps.setMessageGif('grp', url);
}
export function showGifPreview(id, url, onClear) {
  const preview = el(id); if (!preview) return; preview.innerHTML = `<img src="${url}" style="height:60px;border-radius:6px;vertical-align:middle"><button class="clear-gif-btn">✕</button>`; preview.classList.remove('hidden'); preview.querySelector('button').addEventListener('click', () => { onClear(); preview.replaceChildren(); preview.classList.add('hidden'); });
}
