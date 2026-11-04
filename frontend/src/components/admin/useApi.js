import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';

/**
 * GET an endpoint and keep the last good response while refetching,
 * so tables dim instead of flashing to a skeleton.
 * const { data, error, loading, loaded, reload, setData } = useApi('/orders?status=shipped')
 */
export default function useApi(path) {
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState({ key: null, data: undefined, error: '' });
  const key = path ? `${path}#${nonce}` : null;

  useEffect(() => {
    if (!path) return;
    const ctrl = new AbortController();
    api(path, { signal: ctrl.signal })
      .then(data => setState({ key, data, error: '' }))
      .catch(err => {
        if (err.name !== 'AbortError') setState(s => ({ key, data: s.data, error: err.message }));
      });
    return () => ctrl.abort();
  }, [path, key]);

  const reload = useCallback(() => setNonce(n => n + 1), []);
  const setData = useCallback((next) => {
    setState(s => ({ ...s, data: typeof next === 'function' ? next(s.data) : next }));
  }, []);

  return {
    data: state.data,
    error: state.error,
    loading: Boolean(key) && state.key !== key,
    loaded: state.data !== undefined,
    reload,
    setData
  };
}
