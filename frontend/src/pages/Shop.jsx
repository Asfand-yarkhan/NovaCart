import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, qs } from '../lib/api';
import { formatPrice, pluralize } from '../lib/format';
import { categoryByName } from '../lib/store';
import Seo from '../components/ui/Seo';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import ProductCard, { ProductGridSkeleton } from '../components/ui/ProductCard';
import EmptyState, { ErrorState } from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import { Drawer } from '../components/ui/Dialog';
import './Shop.css';

const LIMIT = 24;
const FILTER_KEYS = ['q', 'category', 'minPrice', 'maxPrice', 'inStock', 'onSale'];
const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Top rated' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name: A to Z' }
];

function Filters({ params, categories, onChange, onClear, idPrefix }) {
  const [min, setMin] = useState(params.get('minPrice') || '');
  const [max, setMax] = useState(params.get('maxPrice') || '');
  const minParam = params.get('minPrice') || '';
  const maxParam = params.get('maxPrice') || '';
  const [prev, setPrev] = useState({ minParam, maxParam });
  // Re-sync the inputs when the URL changes elsewhere (chips, clear all)
  if (prev.minParam !== minParam || prev.maxParam !== maxParam) {
    setPrev({ minParam, maxParam });
    setMin(minParam);
    setMax(maxParam);
  }

  const active = params.get('category') || '';
  const total = categories.reduce((s, c) => s + c.count, 0);
  const priceError = min && max && Number(min) > Number(max) ? 'Minimum is higher than maximum' : '';

  const applyPrice = (e) => {
    e.preventDefault();
    if (priceError) return;
    onChange({ minPrice: min, maxPrice: max });
  };

  return (
    <div className="shop-filters">
      <fieldset className="shop-fieldset">
        <legend>Category</legend>
        <div className="shop-cat-list">
          <label className={`shop-cat${!active ? ' is-active' : ''}`}>
            <input type="radio" name={`${idPrefix}-cat`} checked={!active} onChange={() => onChange({ category: '' })} />
            <span>All products</span>
            {total > 0 && <span className="shop-cat-count">{total}</span>}
          </label>
          {categories.map(c => (
            <label key={c.name} className={`shop-cat${active === c.name ? ' is-active' : ''}`}>
              <input type="radio" name={`${idPrefix}-cat`} checked={active === c.name} onChange={() => onChange({ category: c.name })} />
              <span>{c.name}</span>
              <span className="shop-cat-count">{c.count}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <form className="shop-fieldset" onSubmit={applyPrice} noValidate>
        <fieldset>
          <legend>Price (Rs)</legend>
          <div className="shop-price-row">
            <div className="field">
              <label htmlFor={`${idPrefix}-min`} className="visually-hidden">Minimum price</label>
              <input id={`${idPrefix}-min`} className="input" type="number" inputMode="numeric" min="0" placeholder="Min" value={min} onChange={e => setMin(e.target.value)} aria-invalid={priceError ? true : undefined} />
            </div>
            <span aria-hidden="true" className="muted">to</span>
            <div className="field">
              <label htmlFor={`${idPrefix}-max`} className="visually-hidden">Maximum price</label>
              <input id={`${idPrefix}-max`} className="input" type="number" inputMode="numeric" min="0" placeholder="Max" value={max} onChange={e => setMax(e.target.value)} aria-invalid={priceError ? true : undefined} />
            </div>
          </div>
          {priceError && <p className="error-text shop-price-error"><i className="fa-solid fa-circle-exclamation" aria-hidden="true" />{priceError}</p>}
          <button type="submit" className="btn btn-secondary btn-sm shop-price-apply" disabled={Boolean(priceError)}>Apply price</button>
        </fieldset>
      </form>

      <fieldset className="shop-fieldset">
        <legend>Availability</legend>
        <label className="checkbox">
          <input type="checkbox" checked={params.get('inStock') === 'true'} onChange={e => onChange({ inStock: e.target.checked ? 'true' : '' })} />
          In stock only
        </label>
        <label className="checkbox">
          <input type="checkbox" checked={params.get('onSale') === 'true'} onChange={e => onChange({ onSale: e.target.checked ? 'true' : '' })} />
          On sale this week
        </label>
      </fieldset>

      <button type="button" className="btn btn-ghost btn-sm shop-clear" onClick={onClear}>Clear all filters</button>
    </div>
  );
}

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const resultsRef = useRef(null);

  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const onSale = params.get('onSale') === 'true';
  const sort = params.get('sort') || 'newest';
  const key = params.toString();

  useEffect(() => {
    api('/products/categories').then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    const query = Object.fromEntries(new URLSearchParams(key));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- show the loading state for the new query
    setState(s => ({ ...s, loading: true, error: null }));
    api(`/products${qs({ ...query, limit: LIMIT })}`, { signal: ctrl.signal })
      .then(data => setState({ data, loading: false, error: null }))
      .catch(err => { if (err.name !== 'AbortError') setState(s => ({ ...s, loading: false, error: err.message })); });
    return () => ctrl.abort();
  }, [key, reloadKey]);

  const update = useCallback((changes, { keepPage = false } = {}) => {
    setParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(changes).forEach(([k, v]) => { if (v === '' || v === null || v === undefined) next.delete(k); else next.set(k, v); });
      if (!keepPage) next.delete('page');
      return next;
    });
  }, [setParams]);

  const clearAll = () => {
    setParams(prev => {
      const next = new URLSearchParams();
      if (prev.get('sort')) next.set('sort', prev.get('sort'));
      return next;
    });
    setDrawerOpen(false);
  };

  const goToPage = (n) => {
    update({ page: n > 1 ? String(n) : '' }, { keepPage: true });
    resultsRef.current?.scrollIntoView({ block: 'start' });
  };

  // Active filter chips
  const chips = [];
  if (q) chips.push({ key: 'q', label: `“${q}”` });
  if (category) chips.push({ key: 'category', label: category });
  if (params.get('minPrice') || params.get('maxPrice')) {
    const lo = params.get('minPrice'); const hi = params.get('maxPrice');
    chips.push({ key: 'price', label: lo && hi ? `${formatPrice(lo)} to ${formatPrice(hi)}` : lo ? `From ${formatPrice(lo)}` : `Up to ${formatPrice(hi)}` });
  }
  if (params.get('inStock') === 'true') chips.push({ key: 'inStock', label: 'In stock' });
  if (onSale) chips.push({ key: 'onSale', label: 'On sale' });
  const removeChip = (k) => update(k === 'price' ? { minPrice: '', maxPrice: '' } : { [k]: '' });
  const filterCount = FILTER_KEYS.filter(k => params.get(k)).length - (params.get('minPrice') && params.get('maxPrice') ? 1 : 0);

  const cat = categoryByName(category);
  const title = q ? `Results for “${q}”` : category || (onSale ? 'Deals this week' : 'All products');
  const lede = q ? null : cat?.blurb || (onSale ? 'Lower prices on what farms had plenty of this week.' : 'Everything in the warehouse today, from Swat apples to Sidr honey.');
  const seoTitle = q ? `Search: ${q}` : category ? `${category} delivered same day` : onSale ? 'Grocery deals this week' : 'Shop fresh groceries online';
  const seoDesc = cat ? `${cat.blurb} Order ${category.toLowerCase()} online from NovaCart with same-day delivery in Lahore, Karachi and Islamabad.` : undefined;

  const { data, loading, error } = state;
  const products = data?.products || [];
  const firstLoad = loading && !data;

  return (
    <div className="container page shop">
      <Seo title={seoTitle} description={seoDesc} noindex={Boolean(q)} />
      <Breadcrumbs items={category ? [{ label: 'Shop', to: '/shop' }, { label: category }] : [{ label: q ? 'Search' : 'Shop' }]} />

      <header className="shop-head">
        <div>
          <h1>{title}</h1>
          {lede && <p>{lede}</p>}
        </div>
      </header>

      <div className="shop-layout">
        <aside className="shop-aside" aria-label="Filters">
          <Filters params={params} categories={categories} onChange={update} onClear={clearAll} idPrefix="side" />
        </aside>

        <section className="shop-results" ref={resultsRef} aria-labelledby="shop-count">
          <div className="shop-toolbar">
            <p id="shop-count" className="shop-count" aria-live="polite">
              {data ? pluralize(data.total, 'product') : <span className="skeleton skeleton-text" style={{ display: 'inline-block', width: 90 }} />}
            </p>
            <button type="button" className="btn btn-secondary btn-sm shop-filter-btn" onClick={() => setDrawerOpen(true)}>
              <i className="fa-solid fa-sliders" aria-hidden="true" /> Filters{filterCount > 0 && <span className="shop-filter-n">{filterCount}</span>}
            </button>
            <label className="shop-sort">
              <span>Sort by</span>
              <select className="select" value={sort} onChange={e => update({ sort: e.target.value === 'newest' ? '' : e.target.value })}>
                {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
          </div>

          {chips.length > 0 && (
            <ul className="shop-chips" role="list" aria-label="Active filters">
              {chips.map(c => (
                <li key={c.key}>
                  <button type="button" className="chip" onClick={() => removeChip(c.key)} aria-label={`Remove filter ${c.label}`}>
                    {c.label} <i className="fa-solid fa-xmark" aria-hidden="true" />
                  </button>
                </li>
              ))}
              <li><button type="button" className="btn-link text-sm" onClick={clearAll}>Clear all</button></li>
            </ul>
          )}

          {firstLoad ? <ProductGridSkeleton count={12} />
            : error && !data ? <ErrorState message={error} onRetry={() => setReloadKey(k => k + 1)} />
              : products.length === 0 && !loading ? (
                <EmptyState
                  icon="fa-magnifying-glass"
                  title={q ? `Nothing matches “${q}”` : 'No products match these filters'}
                  actions={<>
                    {chips.length > 0 && <button type="button" className="btn btn-primary" onClick={clearAll}>Clear filters</button>}
                    <a href="/shop" className="btn btn-secondary" onClick={e => { e.preventDefault(); setParams(new URLSearchParams()); }}>Browse all products</a>
                  </>}
                >
                  {q ? 'Check the spelling or try a shorter word, like “apple” instead of “apples red”.' : 'Try widening the price range or turning off “in stock only”.'}
                </EmptyState>
              ) : (
                <>
                  {error && <div className="alert alert-error shop-inline-error" role="alert"><i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /><span>{error} <button type="button" className="btn-link" onClick={() => setReloadKey(k => k + 1)}>Try again</button></span></div>}
                  <div className={`product-grid shop-grid${loading ? ' is-refreshing' : ''}`} aria-busy={loading}>
                    {products.map((p, i) => <ProductCard key={p._id} product={p} index={i} eager={i < 4} />)}
                  </div>
                  {data && <Pagination page={data.page} pages={data.pages} onChange={goToPage} />}
                </>
              )}
        </section>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        side="left"
        title="Filters"
        labelId="shop-filter-title"
        footer={<button type="button" className="btn btn-primary btn-block" onClick={() => setDrawerOpen(false)}>
          Show {data ? pluralize(data.total, 'product') : 'products'}
        </button>}
      >
        <Filters params={params} categories={categories} onChange={update} onClear={clearAll} idPrefix="drawer" />
      </Drawer>
    </div>
  );
}
