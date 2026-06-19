import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dha_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const path = window.location.pathname;
    const isAuthPage = path === '/login' || path === '/register';

    if (error.response?.status === 401 && !isAuthPage) {
      localStorage.removeItem('dha_token');
      localStorage.removeItem('dha_user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export const getApiError = (error) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.response?.data?.errors?.[0]?.msg) return error.response.data.errors[0].msg;
  if (error.code === 'ECONNABORTED') return 'Server slow hai. Backend check karein.';
  if (!error.response) return 'Backend server nahi chal raha. Pehle: cd backend && npm run dev';
  return 'Kuch galat ho gaya. Dobara try karein.';
};

export default api;
