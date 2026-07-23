import { supabase } from './supabase.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(path, options = {}) {
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || '요청을 처리하지 못했습니다.');
  }

  return response.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
  streamUrl: (path) => `${API_URL}${path}`,
};
