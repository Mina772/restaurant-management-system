import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL,
  withCredentials: true, // send refresh cookie
  headers: { 'Content-Type': 'application/json' },
});

/* ── Access-token injection ───────────────────────── */
let accessToken = null;
export function setAccessToken(token) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

/* ── Transparent refresh on 401 ───────────────────── */
let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    // Attempt a single refresh, then replay the original request
    if (status === 401 && !original._retry && !original.url.includes('/auth/')) {
      original._retry = true;
      try {
        refreshing =
          refreshing ||
          api.post('/auth/refresh').then((r) => {
            refreshing = null;
            return r.data.data.accessToken;
          });
        const newToken = await refreshing;
        setAccessToken(newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (e) {
        refreshing = null;
        setAccessToken(null);
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);

/** Normalize an axios error into a readable message. */
export function apiError(error, fallback = 'Something went wrong') {
  return error?.response?.data?.message || error?.message || fallback;
}
