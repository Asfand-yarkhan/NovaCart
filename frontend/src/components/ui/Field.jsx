import { cloneElement, useId } from 'react';

/**
 * Label above, hint and error below. Wires id, aria-invalid and aria-describedby onto the child.
 * <Field label="Email" error={errors.email} hint="We send receipts here"><input className="input" type="email" /></Field>
 * <Field label="Price" prefix="Rs"><input className="input" type="number" /></Field>  – shows a unit inside the input
 */
export default function Field({ label, hint, error, optional, className = '', labelAside, prefix, children }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined;
  const control = cloneElement(children, {
    id: children.props.id || id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy
  });
  return (
    <div className={`field ${className}`}>
      <div className="label-row">
        <label htmlFor={children.props.id || id}>
          {label}{optional && <span className="muted" style={{ fontWeight: 400 }}> (optional)</span>}
        </label>
        {labelAside}
      </div>
      {prefix ? <div className="input-prefix"><span aria-hidden="true">{prefix}</span>{control}</div> : control}
      {hint && !error && <span className="hint" id={hintId}>{hint}</span>}
      {error && <span className="error-text" id={errId}><i className="fa-solid fa-circle-exclamation" aria-hidden="true" />{error}</span>}
    </div>
  );
}
