import axios from 'axios';

// Configurar base URL dinamicamente
const baseURL = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_API_URL || 'https://ozo-whatsapp-clone.vercel.app/api'
  : 'http://localhost:5000/api';

// Criar instância do axios
const api = axios.create({
  baseURL,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado
      localStorage.removeItem('token');
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
