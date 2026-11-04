import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

let nextId = 1;

/**
 * toast({ title, description?, type?: 'success'|'error'|'info', image?, action?: { label, onClick }, duration? })
 * toast.success('Saved'), toast.error('Could not save')
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts(list => list.map(t => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setToasts(list => list.filter(t => t.id !== id)), 200);
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }, []);

  const push = useCallback((opts) => {
    const id = nextId++;
    const t = { type: 'info', duration: 4000, ...opts, id };
    setToasts(list => [...list.slice(-2), t]);
    if (t.duration > 0) timers.current.set(id, setTimeout(() => dismiss(id), t.duration));
    return id;
  }, [dismiss]);

  const toast = useMemo(() => {
    const fn = (opts) => push(typeof opts === 'string' ? { title: opts } : opts);
    fn.success = (title, opts) => push({ ...opts, title, type: 'success' });
    fn.error = (title, opts) => push({ duration: 6000, ...opts, title, type: 'error' });
    fn.dismiss = dismiss;
    return fn;
  }, [push, dismiss]);

  const icon = { success: 'fa-check', error: 'fa-triangle-exclamation', info: 'fa-circle-info' };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-region" role="status" aria-live="polite" aria-atomic="false">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}${t.leaving ? ' is-leaving' : ''}`}>
            {t.image
              ? <img className="toast-thumb" src={t.image} alt="" />
              : <span className="toast-icon"><i className={`fa-solid ${icon[t.type]}`} aria-hidden="true" /></span>}
            <div className="toast-msg">
              {t.title}
              {t.description && <small>{t.description}</small>}
            </div>
            {t.action && (
              <button type="button" className="toast-action" onClick={() => { t.action.onClick(); dismiss(t.id); }}>
                {t.action.label}
              </button>
            )}
            <button type="button" className="toast-close" onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
