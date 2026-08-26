import { apiUrl } from './config.js';

const token = () => localStorage.getItem('tox_token');

export const authHeaders = () => token() ? { Authorization: `Bearer ${token()}` } : {};

export const jsonHeaders = () => ({
  'Content-Type': 'application/json',
  ...authHeaders()
});

export async function request(path, options = {}) {
  const response = await fetch(apiUrl(path), options);
  let data = {};
  try {
    data = await response.json();
  } catch {
    data = { error: 'Μη έγκυρη απάντηση από τον διακομιστή.' };
  }
  return { response, data };
}
