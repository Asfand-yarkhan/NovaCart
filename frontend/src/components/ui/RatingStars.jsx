/** Read-only star rating. <RatingStars value={4.3} count={12} /> */
export default function RatingStars({ value = 0, count, size, showValue = false }) {
  const stars = [1, 2, 3, 4, 5].map(n => {
    if (value >= n) return 'fa-solid fa-star';
    if (value >= n - 0.5) return 'fa-solid fa-star-half-stroke';
    return 'fa-solid fa-star star-empty';
  });
  return (
    <span className="rating-line">
      <span className="stars" style={size ? { fontSize: size } : undefined} role="img" aria-label={`Rated ${value} out of 5`}>
        {stars.map((cls, i) => <i key={i} className={cls} aria-hidden="true" />)}
      </span>
      {showValue && <span className="num">{Number(value).toFixed(1)}</span>}
      {count !== undefined && <span>({count})</span>}
    </span>
  );
}
