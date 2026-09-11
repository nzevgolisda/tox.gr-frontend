const configuredApiBase = window.__TOX_API_BASE__;
const deployedApiBase = 'https://hera-tox-646749664538.europe-west1.run.app';
const localApiBase = window.location.port === '3000' ? '' : 'http://localhost:3000';

export const API_BASE = configuredApiBase ?? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? localApiBase : deployedApiBase);
export const GIPHY_KEY = 'hwhnpVCf0AQTX898mvXm9NPkHH4mqtYX';

export const apiUrl = path => `${API_BASE}${path}`;

export const CAT_EMOJI = {
  Vibes: '🎵',
  'Διατροφή': '🥗',
  'Τεχνολογία': '💻',
  'Γυμναστική': '💪',
  'Αγγελίες': '📢'
};