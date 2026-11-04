/** <Pagination page={2} pages={5} onChange={setPage} /> */
export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  const nums = [];
  for (let n = 1; n <= pages; n++) {
    if (n === 1 || n === pages || Math.abs(n - page) <= 1) nums.push(n);
    else if (nums[nums.length - 1] !== '…') nums.push('…');
  }
  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
        <i className="fa-solid fa-chevron-left" aria-hidden="true" />
      </button>
      {nums.map((n, i) => n === '…'
        ? <span key={`e${i}`} className="muted" aria-hidden="true">…</span>
        : <button key={n} type="button" onClick={() => onChange(n)} aria-current={n === page ? 'page' : undefined}>{n}</button>)}
      <button type="button" onClick={() => onChange(page + 1)} disabled={page >= pages} aria-label="Next page">
        <i className="fa-solid fa-chevron-right" aria-hidden="true" />
      </button>
    </nav>
  );
}
