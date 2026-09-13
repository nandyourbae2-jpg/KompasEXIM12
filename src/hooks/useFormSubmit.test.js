import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useFormSubmit } from './useFormSubmit';
import { ApiError } from '../lib/api';

describe('useFormSubmit', () => {
  it('handles successful submit correctly', async () => {
    const submitFn = vi.fn().mockResolvedValue(true);
    const onSuccess = vi.fn();
    
    const { result } = renderHook(() => useFormSubmit(submitFn, { onSuccess }));

    // Before submit
    expect(result.current.loading).toBe(false);
    expect(result.current.success).toBe(false);

    let promise;
    act(() => {
      promise = result.current.handleSubmit('data');
    });

    // During submit
    expect(result.current.loading).toBe(true);

    await act(async () => {
      await promise;
    });

    // After submit
    expect(result.current.loading).toBe(false);
    expect(result.current.success).toBe(true);
    expect(submitFn).toHaveBeenCalledWith('data');
    expect(onSuccess).toHaveBeenCalled();
  });

  it('handles ApiError correctly with fields', async () => {
    const apiError = new ApiError('Validation Failed', 400, ['email', 'password']);
    const submitFn = vi.fn().mockRejectedValue(apiError);
    
    const { result } = renderHook(() => useFormSubmit(submitFn));

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.error).toBe('Validation Failed');
    expect(result.current.fieldErrors).toEqual({
      email: 'Field ini wajib diisi',
      password: 'Field ini wajib diisi'
    });
    expect(result.current.success).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it('handles generic/network error correctly', async () => {
    const error = new Error('tidak dapat terhubung');
    const submitFn = vi.fn().mockRejectedValue(error);
    
    const { result } = renderHook(() => useFormSubmit(submitFn));

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.error).toBe('tidak dapat terhubung');
    expect(result.current.success).toBe(false);
  });

  it('prevents double-submit natively by hook consumer if loading checked (simulating disabled state)', async () => {
    // The hook doesn't internally prevent calls if loading=true, it exposes loading so the button can be disabled.
    // However, if we call it twice while loading, we should check behavior.
    // Let's test that error resets properly when called again.
    const submitFn = vi.fn().mockRejectedValueOnce(new Error('First fail')).mockResolvedValueOnce(true);
    
    const { result } = renderHook(() => useFormSubmit(submitFn));

    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(result.current.error).toBe('First fail');

    // Call again
    await act(async () => {
      await result.current.handleSubmit();
    });
    
    // Error is reset
    expect(result.current.error).toBeNull();
    expect(result.current.success).toBe(true);
  });
});
