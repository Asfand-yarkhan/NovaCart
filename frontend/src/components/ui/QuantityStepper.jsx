import { MAX_QTY_PER_ITEM } from '../../lib/store';

/**
 * <QuantityStepper value={2} onChange={setQty} max={stock} min={1} size="sm" label="Bananas" />
 * When min is 0, the minus button at 1 shows a trash icon (removes the line).
 */
export default function QuantityStepper({ value, onChange, min = 1, max = MAX_QTY_PER_ITEM, size, label = 'item', disabled = false }) {
  const cap = Math.min(max, MAX_QTY_PER_ITEM);
  const atMin = value <= min;
  const removes = min === 0 && value === 1;
  return (
    <div className={`stepper${size ? ` stepper-${size}` : ''}`} role="group" aria-label={`Quantity for ${label}`}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={disabled || atMin} aria-label={removes ? `Remove ${label}` : `Decrease ${label}`}>
        <i className={`fa-solid ${removes ? 'fa-trash-can' : 'fa-minus'}`} aria-hidden="true" />
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" onClick={() => onChange(value + 1)} disabled={disabled || value >= cap} aria-label={`Increase ${label}`}>
        <i className="fa-solid fa-plus" aria-hidden="true" />
      </button>
    </div>
  );
}
