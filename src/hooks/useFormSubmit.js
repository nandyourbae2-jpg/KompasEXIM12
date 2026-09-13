import { useState, useCallback } from 'react';
import { ApiError } from '../lib/api';

export function useFormSubmit(submitFn, options = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    setFieldErrors({});
    setSuccess(false);

    try {
      await submitFn(...args);
      setSuccess(true);
      if (options.onSuccess) {
        options.onSuccess();
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        if (err.fields && err.fields.length > 0) {
          const fieldsMap = {};
          err.fields.forEach(f => { fieldsMap[f] = 'Field ini wajib diisi'; });
          setFieldErrors(fieldsMap);
        }
      } else {
        setError(err.message || 'Terjadi kesalahan yang tidak terduga. Coba lagi.');
        console.error('Unexpected error:', err);
      }
      if (options.onError) {
        options.onError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [submitFn, options.onSuccess, options.onError]);

  return { handleSubmit, loading, error, fieldErrors, success, setError, setFieldErrors };
}
