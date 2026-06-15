export function getApiBaseUrl() {
  const raw = process.env.REACT_APP_API_BASE_URL;
  if (raw == null || raw === '') return '';
  return String(raw).replace(/\/$/, '');
}

export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  const base = getApiBaseUrl();
  return base ? `${base}${p}` : p;
}

export async function fetchJson(path, options = {}) {
  const res = await fetch(apiUrl(path), {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || body.title || detail;
    } catch (_) {
      /* ignore */
    }
    throw new Error(detail || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}
