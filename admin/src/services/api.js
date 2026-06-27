import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dha_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginPage = window.location.pathname === '/login';

    if (error.response?.status === 401 && !isLoginPage) {
      localStorage.removeItem('dha_admin_token');
      localStorage.removeItem('dha_admin_user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export const getApiError = (error) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (!error.response) return 'Cannot connect to server. Start backend: cd backend && npm run dev';
  return 'Something went wrong';
};

export default api;
