import { formatPrice } from '../../lib/format';

/** <Price value={420} compareAt={480} /> shows the sale price in tomato with the old price struck through. */
export default function Price({ value, compareAt, className = '' }) {
  const onSale = compareAt && compareAt > value;
  return (
    <span className={`price${onSale ? ' price-sale' : ''} ${className}`}>
      <span className="price-now">{formatPrice(value)}</span>
      {onSale && <span className="price-was"><span className="visually-hidden">was </span>{formatPrice(compareAt)}</span>}
    </span>
  );
}
