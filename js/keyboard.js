import { el } from './dom.js';

const dismissible = [
  'auth-overlay', 'profile-modal', 'user-profile-modal', 'settings-panel',
  'history-panel', 'gif-picker-overlay', 'group-modal-overlay', 'create-thread-modal',
  'lightbox'
];

export function initKeyboard({ closeMobMenu, closeNotifDropdown }) {
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    dismissible.forEach(id => el(id)?.classList.add('hidden'));
    closeMobMenu?.();
    closeNotifDropdown?.();
  });
}
