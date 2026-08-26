import { el } from './dom.js';

export function toggleTheme() {
  const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', nextTheme);
  updateTheme(nextTheme);
}

export function updateTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = theme === 'dark' ? '☀️' : '🌙';
  const text = theme === 'dark' ? 'Φωτεινό θέμα' : 'Σκούρο θέμα';
  if (el('theme-icon')) el('theme-icon').textContent = icon;
  if (el('theme-text')) el('theme-text').textContent = text;
  if (el('mob-theme-icon')) el('mob-theme-icon').textContent = icon;
  if (el('settings-theme-val')) el('settings-theme-val').textContent = theme === 'dark' ? 'Σκούρο' : 'Φωτεινό';
}
