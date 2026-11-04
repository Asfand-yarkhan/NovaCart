import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Locks body scroll, traps focus, closes on Escape and restores focus on close. */
export function useDialog(open, onClose, ref) {
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });

  useEffect(() => {
    if (!open) return;
    const onCloseLatest = () => closeRef.current?.();
    const previouslyFocused = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const node = ref.current;
    const first = node?.querySelector('[data-autofocus]') || node?.querySelector(FOCUSABLE);
    first?.focus({ preventScroll: true });

    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onCloseLatest(); return; }
      if (e.key !== 'Tab' || !node) return;
      const els = [...node.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null);
      if (!els.length) return;
      const [f, l] = [els[0], els[els.length - 1]];
      if (e.shiftKey && document.activeElement === f) { e.preventDefault(); l.focus(); }
      else if (!e.shiftKey && document.activeElement === l) { e.preventDefault(); f.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open, ref]);
}

/** Slide-over panel. <Drawer open title="Your basket" onClose={...} footer={...}>...</Drawer> */
export function Drawer({ open, onClose, title, children, footer, side = 'right', labelId = 'drawer-title' }) {
  const ref = useRef(null);
  useDialog(open, onClose, ref);
  if (!open) return null;
  return createPortal(
    <>
      <div className="overlay" onClick={onClose} aria-hidden="true" />
      <aside ref={ref} className={`drawer${side === 'left' ? ' drawer-left' : ''}`} role="dialog" aria-modal="true" aria-labelledby={labelId}>
        <div className="drawer-head">
          <h2 id={labelId}>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-foot">{footer}</div>}
      </aside>
    </>,
    document.body
  );
}

/** Centered dialog. <Modal open title="Delete product?" onClose={...} footer={<>buttons</>}>text</Modal> */
export function Modal({ open, onClose, title, children, footer, width }) {
  const ref = useRef(null);
  useDialog(open, onClose, ref);
  if (!open) return null;
  return createPortal(
    <div className="modal-wrap">
      <div className="overlay" onClick={onClose} aria-hidden="true" />
      <div ref={ref} className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" style={width ? { width: `min(${width}px, 100%)` } : undefined}>
        <div className="modal-head">
          <h2 id="modal-title">{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/** Confirmation dialog. */
export function ConfirmDialog({ open, title, children, confirmLabel = 'Confirm', danger = false, busy = false, onConfirm, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title={title} width={440}
      footer={<>
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>Keep it</button>
        <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={busy} data-autofocus>
          {busy && <span className="spinner" aria-hidden="true" />}{confirmLabel}
        </button>
      </>}>
      <p style={{ color: 'var(--ink-2)' }}>{children}</p>
    </Modal>
  );
}
