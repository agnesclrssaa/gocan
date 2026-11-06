import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
const TOKEN_KEY = 'token';
const LEGACY_TOKEN_KEY = 'gocan_token';
export const API_AUTH_ERROR_EVENT = 'gocan:api-auth-error';

const migrateLegacyToken = () => {
  try {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY);

    if (!currentToken && legacyToken) {
      localStorage.setItem(TOKEN_KEY, legacyToken);
    }

    if (localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(LEGACY_TOKEN_KEY);
    }
  } catch (error) {
    console.error('Gagal memigrasikan token autentikasi:', error);
  }
};

migrateLegacyToken();

const client = axios.create({ baseURL: API_BASE_URL });

const isPublicAuthRequest = (url = '') =>
  /\/auth\/(login|register)\/?$/.test(url.split('?')[0]);

const getErrorMessage = (requestError) => {
  const status = requestError.response?.status;
  const rawServerMessage =
    requestError.response?.data?.error || requestError.response?.data?.message;
  const serverMessage =
    typeof rawServerMessage === 'string' && rawServerMessage.trim()
      ? rawServerMessage
      : null;

  if (serverMessage) return serverMessage;
  if (!requestError.response) {
    return 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.';
  }

  if (status === 400) return 'Permintaan tidak valid. Periksa kembali data yang dimasukkan.';
  if (status === 401 && isPublicAuthRequest(requestError.config?.url)) {
    return 'Email atau password tidak valid.';
  }
  if (status === 401) return 'Sesi login kamu telah berakhir. Silakan login kembali.';
  if (status === 403) return 'Maaf, kamu tidak memiliki akses untuk menggunakan fitur ini.';
  if (status === 404) return 'Data yang diminta tidak ditemukan.';
  if (status >= 500) return 'Terjadi gangguan pada server. Silakan coba lagi.';
  return 'Permintaan ke server gagal.';
};

client.interceptors.request.use((config) => {
  const isPublicAuth = isPublicAuthRequest(config.url);
  const token = isPublicAuth ? null : localStorage.getItem(TOKEN_KEY);

  if (config.headers?.set) {
    if (token) config.headers.set('Authorization', `Bearer ${token}`);
    else config.headers.delete('Authorization');
  } else {
    config.headers = config.headers || {};
    if (token) config.headers.Authorization = `Bearer ${token}`;
    else delete config.headers.Authorization;
  }

  return config;
});

client.interceptors.response.use(
  (response) => response,
  (requestError) => {
    const status = requestError.response?.status;
    const isPublicAuth = isPublicAuthRequest(requestError.config?.url);

    if (
      typeof window !== 'undefined' &&
      (status === 403 || (status === 401 && !isPublicAuth))
    ) {
      window.dispatchEvent(
        new CustomEvent(API_AUTH_ERROR_EVENT, {
          detail: { status },
        })
      );
    }

    const error = new Error(getErrorMessage(requestError));
    error.cause = requestError;
    if (requestError.response) {
      error.status = status;
      error.data = requestError.response.data;
    }
    return Promise.reject(error);
  }
);

export const api = {
  get: async (path, config) => (await client.get(path, config)).data,
  getBlob: async (path, config) => {
    const response = await client.get(path, { ...config, responseType: 'blob' });
    return response.data;
  },
  post: async (path, body, config) => (await client.post(path, body, config)).data,
  put: async (path, body, config) => (await client.put(path, body, config)).data,
  patch: async (path, body, config) => (await client.patch(path, body, config)).data,
  delete: async (path, config) => (await client.delete(path, config)).data,
  assetUrl: (path) =>
    new URL(path, new URL(API_BASE_URL, window.location.origin)).toString(),
};

export const AUTH_TOKEN_KEY = TOKEN_KEY;
