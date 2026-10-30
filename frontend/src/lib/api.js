import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
const TOKEN_KEY = 'gocan_token';

const client = axios.create({ baseURL: API_BASE_URL });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (requestError) => {
    const error = new Error(
      requestError.response?.data?.error || 'Permintaan ke server gagal.'
    );
    error.cause = requestError;
    if (requestError.response) {
      error.status = requestError.response.status;
    }
    return Promise.reject(error);
  }
);

export const api = {
  get: async (path) => (await client.get(path)).data,
  post: async (path, body) => (await client.post(path, body)).data,
  patch: async (path, body) => (await client.patch(path, body)).data,
};

export const AUTH_TOKEN_KEY = TOKEN_KEY;
