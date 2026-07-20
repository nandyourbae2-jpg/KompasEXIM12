// src/lib/api.js
// Shared fetch utility yang semua store gunakan untuk memanggil backend API.
// Otomatis membaca base URL dari .env (VITE_API_BASE_URL).
// Mengirim credentials (cookies) di setiap request agar JWT cookie terkirim.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * api(endpoint, options)
 * Wrapper tipis di atas fetch:
 *  - Selalu kirim credentials (cookies)
 *  - Set Content-Type JSON secara default (kecuali FormData)
 *  - Throw error jika response tidak ok
 */
export const api = async (endpoint, options = {}) => {
  const isFormData = options.body instanceof FormData;

  const headers = {
    'Pinggy-Skip': 'true',
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Kirim httpOnly cookie di setiap request
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error = new Error(data.error || `HTTP error ${response.status}`);
    error.status = response.status;
    throw error;
  }

  // 204 No Content (misal DELETE) tidak ada body
  if (response.status === 204) return null;

  return response.json();
};

export default api;
