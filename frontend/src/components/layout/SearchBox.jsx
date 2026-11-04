import { useEffect, useId, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api, qs } from '../../lib/api';
import { imageUrl } from '../../lib/assets';
import { formatPrice } from '../../lib/format';

/** Search with live suggestions (ARIA combobox). Enter without a highlighted option searches the shop. */
export default function SearchBox({ autoFocus = false, onDone }) {
  const navigate = useNavigate();
  const location = useLocation();
  const listId = useId();
  const inputRef = useRef(null);
  const urlQ = location.pathname === '/shop' ? new URLSearchParams(location.search).get('q') || '' : null;
  const [q, setQ] = useState(urlQ || '');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  // Suggestions are stored with the term they answer, so stale responses are never shown
  const [found, setFound] = useState({ term: '', products: [] });

  // Keep the box in sync when navigating between searches (adjusting state during render)
  const [syncedQ, setSyncedQ] = useState(urlQ);
  if (urlQ !== null && urlQ !== syncedQ) {
    setSyncedQ(urlQ);
    setQ(urlQ);
  }

  const term = q.trim();
  const searching = term.length >= 2;
  const results = searching && found.term === term ? found.products : [];
  const loading = searching && found.term !== term;

  useEffect(() => {
    if (!searching) return;
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      api(`/products${qs({ q: term, limit: 6, sort: 'rating' })}`, { signal: ctrl.signal })
        .then(d => { setFound({ term, products: d.products }); setActive(-1); })
        .catch(err => { if (err.name !== 'AbortError') setFound({ term, products: [] }); });
    }, 180);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [term, searching]);

  const close = () => { setOpen(false); setActive(-1); };
  const finish = () => { close(); inputRef.current?.blur(); onDone?.(); };

  const submit = (e) => {
    e?.preventDefault();
    if (active >= 0 && results[active]) {
      navigate(`/product/${results[active].slug}`);
    } else {
      navigate(`/shop${qs({ q: q.trim() })}`);
    }
    finish();
  };

  const onKeyDown = (e) => {
    if (!open && ['ArrowDown', 'ArrowUp'].includes(e.key)) setOpen(true);
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, -1)); }
    else if (e.key === 'Escape') { close(); }
  };

  const showList = open && searching;

  return (
    <form className="search" role="search" onSubmit={submit}>
      <div className="input-group">
        <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
        <input
          ref={inputRef}
          className="input search-input"
          type="search"
          value={q}
          placeholder="Search mangoes, atta, eggs…"
          aria-label="Search products"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          autoFocus={autoFocus}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(close, 120)}
          onKeyDown={onKeyDown}
        />
        {loading && <span className="input-action spinner search-spinner" aria-hidden="true" />}
      </div>

      {showList && (
        <div className="search-pop" id={listId} role="listbox" aria-label="Suggestions">
          {results.length === 0 && !loading && (
            <p className="search-empty">No products match “{q.trim()}”. Try a shorter word, like “mango”.</p>
          )}
          {results.map((p, i) => (
            <div
              key={p._id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className="search-opt"
              onMouseDown={e => { e.preventDefault(); navigate(`/product/${p.slug}`); finish(); }}
              onMouseEnter={() => setActive(i)}
            >
              <img src={imageUrl(p.image)} alt="" width="40" height="40" />
              <span className="search-opt-name">{p.name}<small>{p.unit} · {p.category}</small></span>
              <span className="search-opt-price">{formatPrice(p.price)}</span>
            </div>
          ))}
          {results.length > 0 && (
            <button type="submit" className="search-all" onMouseDown={e => e.preventDefault()}>
              See all results for “{q.trim()}” <i className="fa-solid fa-arrow-right" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </form>
  );
}
