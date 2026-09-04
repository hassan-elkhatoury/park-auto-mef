import axios from 'axios';

export const getApiErrorMessage = (error, fallback = 'Une erreur est survenue.') => {
  const payload = error?.response?.data ?? error?.data ?? error;
  if (typeof payload === 'string' && payload.trim()) return payload;
  if (payload?.message && typeof payload.message === 'string') return payload.message;
  if (payload?.data && typeof payload.data === 'string') return payload.data;
  if (payload?.errors && typeof payload.errors === 'object') {
    return Object.values(payload.errors).filter(Boolean).join(' · ');
  }
  return error?.message || fallback;
};

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Endpoints d'authentification publics : aucun jeton ne doit être envoyé (login / refresh).
// Les autres endpoints /auth/* (me, change-password, logout) exigent le jeton d'accès.
const PUBLIC_AUTH_ENDPOINTS = ['/auth/login', '/auth/refresh'];

const isPublicAuthUrl = (url = '') => PUBLIC_AUTH_ENDPOINTS.some((p) => url.includes(p));

const isCredentialCheckUrl = (url = '') =>
  url.includes('/auth/login')
  || url.includes('/auth/change-password')
  || url.includes('/auth/logout')
  || url.includes('/auth/refresh');

const expireSession = () => {
  localStorage.clear();
  window.dispatchEvent(new Event('auth:expired'));
};

const persistTokens = (payload) => {
  if (!payload?.accessToken) return null;
  localStorage.setItem('token', payload.accessToken);
  if (payload.refreshToken) localStorage.setItem('refreshToken', payload.refreshToken);
  if (payload.utilisateur) localStorage.setItem('user', JSON.stringify(payload.utilisateur));
  return payload.accessToken;
};

/** Appel refresh hors intercepteurs pour éviter toute boucle 401. */
const refreshClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

const requestNewAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    throw new Error('Refresh token absent');
  }
  const res = await refreshClient.post('/auth/refresh', { refreshToken });
  const payload = res.data?.data || res.data;
  const token = persistTokens(payload);
  if (!token) {
    throw new Error('Réponse de rafraîchissement invalide');
  }
  return token;
};

let isRefreshing = false;
let refreshQueue = [];

const flushRefreshQueue = (error, token = null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  refreshQueue = [];
};

const enqueueWhileRefreshing = () =>
  new Promise((resolve, reject) => {
    refreshQueue.push({ resolve, reject });
  });

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    if (isPublicAuthUrl(config.url)) {
      delete config.headers.Authorization;
    } else {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    if (config.data instanceof FormData && config.headers) {
      if (typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type');
        config.headers.delete('content-type');
      } else {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: silent refresh on 401, then retry the original request.
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config || {};
    const url = originalRequest.url || '';
    const status = error?.response?.status;

    if (status === 401 && !isCredentialCheckUrl(url) && !originalRequest._retry) {
      if (isRefreshing) {
        try {
          const token = await enqueueWhileRefreshing();
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch (refreshError) {
          return Promise.reject(refreshError?.response?.data || refreshError);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const token = await requestNewAccessToken();
        flushRefreshQueue(null, token);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        flushRefreshQueue(refreshError, null);
        expireSession();
        return Promise.reject(refreshError?.response?.data || refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (status === 401 && !isCredentialCheckUrl(url)) {
      expireSession();
    } else if (status === 403 && !isCredentialCheckUrl(url)) {
      window.dispatchEvent(new CustomEvent('auth:forbidden', {
        detail: error?.response?.data?.message || "Accès refusé : vous n'avez pas les droits nécessaires pour cette action."
      }));
    }
    return Promise.reject(error.response ? error.response.data : error);
  }
);

/**
 * Déconnexion : révoque les jetons côté serveur (access + refresh) puis purge la session locale.
 * La purge locale est effectuée dans tous les cas, même si le serveur est injoignable.
 */
export const logoutSession = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  try {
    await api.post('/auth/logout', refreshToken ? { refreshToken } : {});
  } catch (e) {
    // La révocation serveur a échoué (réseau, jeton déjà expiré) : la session locale est purgée malgré tout.
  } finally {
    localStorage.clear();
  }
};

export default api;
