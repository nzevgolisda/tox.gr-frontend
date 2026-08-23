export const esc = text => (text || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/\n/g, '<br>');

export const md = text => text
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  .replace(/\*(.*?)\*/g, '<em>$1</em>')
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\n/g, '<br>');

export const timeAgo = timestamp => {
  const elapsed = Date.now() - timestamp;
  const minutes = Math.floor(elapsed / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  return days > 0 ? `${days}μ` : hours > 0 ? `${hours}ω` : minutes > 0 ? `${minutes}λ` : 'τώρα';
};

export const debounce = (fn, milliseconds) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), milliseconds);
  };
};

export const genId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

export const PP = {
  get: username => {
    try {
      return JSON.parse(localStorage.getItem('pp') || '{}')[username] || null;
    } catch {
      return null;
    }
  },
  set: (username, base64) => {
    try {
      const pictures = JSON.parse(localStorage.getItem('pp') || '{}');
      if (base64) pictures[username] = base64;
      else delete pictures[username];
      localStorage.setItem('pp', JSON.stringify(pictures));
    } catch {}
  }
};