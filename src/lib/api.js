// src/lib/api.js
import { getToken, clearToken } from '../utils/authToken';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiError extends Error {
  constructor(message, status, fields = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields;
  }
}

export const api = async (endpoint, options = {}) => {
  const isFormData = options.body instanceof FormData;

  let token = getToken();

  const headers = {
    'Pinggy-Skip': 'true',
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...(options.headers || {}),
  };

  let response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch (err) {
    throw new ApiError('Tidak dapat terhubung ke server. Pastikan backend sedang berjalan.', 0, []);
  }

  if (!response.ok) {
    if (response.status === 401) {
      clearToken();
      console.error('API 401 Redirect Intercepted for:', endpoint);
      // window.location.hash = '#/login';
      return null;
    }

    const data = await response.json().catch(() => ({}));
    throw new ApiError(
      data.message || data.error || `Gagal: HTTP ${response.status}`,
      response.status,
      data.fields || []
    );
  }

  if (response.status === 204) return null;

  return response.json();
};

export default api;
