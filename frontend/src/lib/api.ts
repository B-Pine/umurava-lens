import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token from localStorage to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('umurava_token');
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Redirect to /login on 401 (except from the login/public endpoints themselves)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (typeof window !== 'undefined' && err?.response?.status === 401) {
      const url = err.config?.url || '';
      const isAuthEndpoint = url.includes('/auth/login') || url.includes('/public');
      if (!isAuthEndpoint) {
        localStorage.removeItem('umurava_token');
        localStorage.removeItem('umurava_user');
        if (window.location.pathname.startsWith('/admin') || window.location.pathname === '/dashboard' || window.location.pathname.startsWith('/jobs') || window.location.pathname.startsWith('/candidates')) {
          window.location.href = '/login';
        }
      }
    }
    
    // Unpack backend API error message if available so Redux reducers show it instead of "Request failed with status code 503"
    if (err?.response?.data?.error) {
      err.message = err.response.data.error;
    }
    
    return Promise.reject(err);
  }
);

export default api;
