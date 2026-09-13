import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import api, { ApiError } from './api';

describe('api utility', () => {
  const originalFetch = global.fetch;
  const originalLocation = window.location;

  beforeEach(() => {
    // Mock fetch
    global.fetch = vi.fn();
    
    // Mock window.location for redirect tests
    delete window.location;
    window.location = { href: '/' };

    // Clear sessionStorage
    sessionStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    window.location = originalLocation;
    vi.clearAllMocks();
  });

  it('should successfully make a request and return JSON', async () => {
    const mockData = { success: true };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockData,
    });

    const result = await api('/test-endpoint');
    expect(global.fetch).toHaveBeenCalledWith('/api/test-endpoint', expect.objectContaining({
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
        'Pinggy-Skip': 'true'
      })
    }));
    expect(result).toEqual(mockData);
  });

  it('should include Authorization header if token is in sessionStorage', async () => {
    sessionStorage.setItem('kompas_exim_session', JSON.stringify({ token: 'test-token-123' }));
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    await api('/test-auth');
    expect(global.fetch).toHaveBeenCalledWith('/api/test-auth', expect.objectContaining({
      headers: expect.objectContaining({
        'Authorization': 'Bearer test-token-123'
      })
    }));
  });

  it('should not set Content-Type if body is FormData', async () => {
    const formData = new FormData();
    formData.append('key', 'value');

    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    await api('/upload', { method: 'POST', body: formData });
    
    const fetchArgs = global.fetch.mock.calls[0][1];
    expect(fetchArgs.headers['Content-Type']).toBeUndefined();
  });

  it('should return null on 204 No Content', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    const result = await api('/empty');
    expect(result).toBeNull();
  });

  it('should throw ApiError if fetch fails (network error)', async () => {
    global.fetch.mockRejectedValue(new Error('Network Error'));

    await expect(api('/fail')).rejects.toThrow('Tidak dapat terhubung ke server. Pastikan backend sedang berjalan.');
    await expect(api('/fail')).rejects.toBeInstanceOf(ApiError);
  });

  it('should redirect to /login and clear session on 401 status', async () => {
    sessionStorage.setItem('kompas_exim_session', 'test-data');
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    const result = await api('/protected');
    
    expect(result).toBeNull();
    expect(sessionStorage.getItem('kompas_exim_session')).toBeNull();
    expect(window.location.href).toBe('/login');
  });

  it('should throw ApiError with backend message on other errors', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid data provided', fields: ['field1'] }),
    });

    try {
      await api('/bad-request');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('Invalid data provided');
      expect(error.status).toBe(400);
      expect(error.fields).toEqual(['field1']);
    }
  });

  it('should handle invalid JSON in error response gracefully', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => { throw new Error('Syntax error') },
    });

    try {
      await api('/server-error');
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect(error.message).toBe('Gagal: HTTP 500');
      expect(error.status).toBe(500);
    }
  });
});
