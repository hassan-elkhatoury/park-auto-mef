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

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const isPublicAuth = config.url && PUBLIC_AUTH_ENDPOINTS.some((p) => config.url.includes(p));
    if (isPublicAuth) {
      delete config.headers.Authorization;
    } else {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Unauthorized / Expired Tokens
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 401 (token expired / not authenticated) on an authenticated endpoint => trigger login redirection.
    // 403 (authenticated but not authorized) => notify only, keep the session.
    const url = error.config?.url || '';
    // Un 401 sur login (identifiants erronés), change-password (ancien mot de passe erroné) ou logout
    // ne doit pas être interprété comme une expiration de session.
    const isCredentialCheck = url.includes('/auth/login') || url.includes('/auth/change-password') || url.includes('/auth/logout');
    const status = error?.response?.status;
    if (status === 401 && !isCredentialCheck) {
      localStorage.clear();
      window.dispatchEvent(new Event('auth:expired'));
    } else if (status === 403 && !isCredentialCheck) {
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
