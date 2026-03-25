import axios from 'axios';

// Configuración de instancias de Axios para cada subsistema

// 1. Instancia HIS (Hospital Information System) - Puerto 3001
export const hisApi = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Instancia RIS (Radiology Information System) - Puerto 3002
export const risApi = axios.create({
  baseURL: 'http://localhost:3002/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 3. Instancia LIS (Laboratory Information System) - Puerto 3003
export const lisApi = axios.create({
  baseURL: 'http://localhost:3003/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar token JWT automáticamente en las peticiones al HIS
hisApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Funciones Helper para Auth HIS
export const loginUser = async (username, password) => {
  const { data } = await hisApi.post('/auth/login', { username, password });
  return data;
};

export const getMyProfile = async () => {
  const { data } = await hisApi.get('/auth/me');
  return data;
};
