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

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    if (config.url && config.url.includes('/auth/')) {
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
    // If JWT token expired or 401/403 unauthorized on authenticated endpoint, trigger login redirection
    const isLoginRequest = error.config && error.config.url && error.config.url.includes('/auth/login');
    const status = error?.response?.status;
    if ((status === 401 || status === 403) && !isLoginRequest) {
      localStorage.clear();
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(error.response ? error.response.data : error);
  }
);

export default api;
