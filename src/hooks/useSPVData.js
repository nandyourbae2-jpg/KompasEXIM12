import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

const useSPVData = (endpoint, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!endpoint) return;
    setLoading(true);
    setError(null);
    try {
      // lib/api.js automatically attaches the token and handles URL construction
      const finalEndpoint = endpoint.startsWith('/api/') ? endpoint.substring(4) : endpoint;
      const res = await api(finalEndpoint);
      setData(res);
    } catch (err) {
      setError(err.message || `Failed to fetch data from ${endpoint}`);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    refetch();

    // Listen to BroadcastChannel for real-time updates across tabs
    const channel = new BroadcastChannel('exim_sync_channel');
    channel.onmessage = (event) => {
      if (event.data === 'DATA_UPDATED' || (event.data && event.data.type === 'DATA_UPDATED')) {
        refetch();
      }
    };

    return () => {
      channel.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetch, ...dependencies]);

  return { data, loading, error, refetch };
};

export default useSPVData;
