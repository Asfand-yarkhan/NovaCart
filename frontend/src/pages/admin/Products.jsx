import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, qs } from '../../lib/api';
import useApi from '../../components/admin/useApi';
import { imageUrl } from '../../lib/assets';
import { formatDate } from '../../lib/format';
import { useToast } from '../../context/ToastContext';
import Seo from '../../components/ui/Seo';
import Price from '../../components/ui/Price';
import { ConfirmDialog } from '../../components/ui/Dialog';
import EmptyState, { ErrorState } from '../../components/ui/EmptyState';
import PageHeader from '../../components/admin/PageHeader';
import ProductDrawer from '../../components/admin/ProductDrawer';
import { LOW_STOCK } from '../../components/admin/constants';

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'name', label: 'Name A to Z' },
  { value: 'price-asc', label: 'Price, low to high' },
  { value: 'price-desc', label: 'Price, high to low' },
  { value: 'stock', label: 'Stock, lowest first' },
  { value: 'rating', label: 'Top rated' }
];

const EMPTY = { products: [], total: 0 };

function StockBadge({ stock }) {
  if (stock === 0) return <span className="badge badge-danger">Out of stock</span>;
  if (stock <= LOW_STOCK) return <span className="badge badge-warn">{stock} left</span>;
  return <span className="num">{stock}</span>;
}

function SkeletonRows({ n = 8, cols = 7 }) {
  return Array.from({ length: n }, (_, i) => (
    <tr key={i} className="adm-row-skel" aria-hidden="true">
      <td><div className="cell-product"><div className="skeleton adm-thumb" /><div style={{ width: 160 }}><div className="skeleton skeleton-text" /><div className="skeleton skeleton-text" style={{ width: '60%' }} /></div></div></td>
      {Array.from({ length: cols - 1 }, (_, j) => <td key={j}><div className="skeleton skeleton-text" style={{ width: 56 }} /></td>)}
    </tr>
  ));
}

export default function Products() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [debouncedQ, setDebouncedQ] = useState(q);
  const [category, setCategory] = useState(params.get('category') || '');
  const [stockFilter, setStockFilter] = useState(params.get('stock') || 'all');
  const [sort, setSort] = useState('newest');
  const list = useApi(`/products${qs({ limit: 100, sort, q: debouncedQ, category })}`);
  const cats = useApi('/products/categories');
  const data = list.data || EMPTY;
  const { loading, loaded, error } = list;
  const categories = useMemo(() => (cats.data || []).map(r => r.name), [cats.data]);
  const [editing, setEditing] = useState(() => (params.get('edit') === 'new' ? {} : null)); // null closed, {} new, product
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  // Deep link: /admin/products?edit=<id>
  const editId = params.get('edit');
  useEffect(() => {
    if (!editId || editId === 'new') return;
    let live = true;
    api(`/products/${editId}`)
      .then(p => { if (live) setEditing(p); })
      .catch(err => toast.error(err.message));
    return () => { live = false; };
  }, [editId, toast]);

  const closeDrawer = () => {
    setEditing(null);
    if (params.get('edit')) {
      const next = new URLSearchParams(params);
      next.delete('edit');
      setParams(next, { replace: true });
    }
  };

  const rows = useMemo(() => data.products.filter(p =>
    stockFilter === 'all' ? true : stockFilter === 'out' ? p.stock === 0 : stockFilter === 'low' ? p.stock > 0 && p.stock <= LOW_STOCK : true
  ), [data.products, stockFilter]);

  const counts = useMemo(() => ({
    low: data.products.filter(p => p.stock > 0 && p.stock <= LOW_STOCK).length,
    out: data.products.filter(p => p.stock === 0).length
  }), [data.products]);

  const onSaved = (saved, isNew) => {
    list.setData(d => isNew
      ? { ...d, products: [saved, ...d.products], total: d.total + 1 }
      : { ...d, products: d.products.map(p => (p._id === saved._id ? { ...p, ...saved } : p)) });
    if (!categories.includes(saved.category)) cats.reload();
    closeDrawer();
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api(`/products/${toDelete._id}`, { method: 'DELETE' });
      list.setData(d => ({ ...d, products: d.products.filter(p => p._id !== toDelete._id), total: d.total - 1 }));
      toast.success(`${toDelete.name} deleted`);
      setToDelete(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = Boolean(debouncedQ || category || stockFilter !== 'all');
  const resetFilters = () => { setQ(''); setCategory(''); setStockFilter('all'); };

  return (
    <>
      <Seo title="Products" noindex />
      <PageHeader
        title="Products"
        description={loaded ? `${data.total} in the catalogue, ${counts.low} running low, ${counts.out} out of stock` : 'Your catalogue'}
        actions={<button type="button" className="btn btn-primary" onClick={() => setEditing({})}><i className="fa-solid fa-plus" aria-hidden="true" />Add product</button>}
      />

      <div className="adm-toolbar">
        <div className="input-group">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <input className="input" type="search" placeholder="Search by name or keyword" aria-label="Search products" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <select className="select" aria-label="Category" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="select" aria-label="Stock level" value={stockFilter} onChange={e => setStockFilter(e.target.value)}>
          <option value="all">Any stock level</option>
          <option value="low">Running low ({counts.low})</option>
          <option value="out">Out of stock ({counts.out})</option>
        </select>
        <select className="select" aria-label="Sort" value={sort} onChange={e => setSort(e.target.value)}>
          {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        {loaded && <span className="adm-toolbar-meta">Showing {rows.length} of {data.total}</span>}
      </div>

      {error && !loaded ? <ErrorState message={error} onRetry={list.reload} /> : (
        loaded && rows.length === 0 && !loading ? (
          filtered ? (
            <EmptyState icon="fa-filter-circle-xmark" title="No products match these filters"
              actions={<button type="button" className="btn btn-secondary" onClick={resetFilters}>Clear filters</button>}>
              Try a different search word or category.
            </EmptyState>
          ) : (
            <EmptyState icon="fa-box-open" title="Your catalogue is empty"
              actions={<button type="button" className="btn btn-primary" onClick={() => setEditing({})}>Add your first product</button>}>
              Products you add here appear in the shop straight away.
            </EmptyState>
          )
        ) : (
          <div className={`adm-panel adm-refetch${loading && loaded ? ' is-loading' : ''}`}>
            <div className="table-wrap">
              <table className="table adm-table">
                <thead>
                  <tr>
                    <th scope="col">Product</th>
                    <th scope="col">Category</th>
                    <th scope="col" className="num">Price</th>
                    <th scope="col" className="num">Stock</th>
                    <th scope="col">Featured</th>
                    <th scope="col">Rating</th>
                    <th scope="col">Updated</th>
                    <th scope="col"><span className="visually-hidden">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {!loaded ? <SkeletonRows cols={8} /> : rows.map(p => (
                    <tr key={p._id}>
                      <td>
                        <div className="cell-product">
                          {p.image ? <img className="adm-thumb" src={imageUrl(p.image)} alt="" width="40" height="40" loading="lazy" /> : <span className="adm-thumb" aria-hidden="true" />}
                          <div>
                            <strong>{p.name}</strong>
                            <Link to={`/product/${p.slug}`} className="cell-sub" target="_blank" rel="noreferrer">/{p.slug} <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" style={{ fontSize: '0.6rem' }} /><span className="visually-hidden"> (opens in a new tab)</span></Link>
                          </div>
                        </div>
                      </td>
                      <td>{p.category}<div className="cell-sub">{p.unit}</div></td>
                      <td className="num"><Price value={p.price} compareAt={p.compareAtPrice} /></td>
                      <td className="num"><StockBadge stock={p.stock} /></td>
                      <td>
                        <i className={`fa-solid fa-star feat${p.featured ? '' : ' is-off'}`} aria-hidden="true" />
                        <span className="visually-hidden">{p.featured ? 'Featured' : 'Not featured'}</span>
                      </td>
                      <td>{p.numReviews > 0 ? <span className="num">{p.rating.toFixed(1)} <span className="cell-sub">({p.numReviews})</span></span> : <span className="cell-sub">No reviews</span>}</td>
                      <td className="cell-sub">{formatDate(p.updatedAt)}</td>
                      <td>
                        <div className="row-actions">
                          <button type="button" className="icon-btn" onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`} title="Edit">
                            <i className="fa-solid fa-pen" aria-hidden="true" />
                          </button>
                          <button type="button" className="icon-btn is-danger" onClick={() => setToDelete(p)} aria-label={`Delete ${p.name}`} title="Delete">
                            <i className="fa-regular fa-trash-can" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {editing && (
        <ProductDrawer
          key={editing._id || 'new'}
          open
          product={editing._id ? editing : null}
          categories={categories}
          onClose={closeDrawer}
          onSaved={onSaved}
        />
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this product?"
        confirmLabel="Delete product"
        danger
        busy={deleting}
        onConfirm={confirmDelete}
        onClose={() => !deleting && setToDelete(null)}
      >
        {toDelete && <>{toDelete.name} will be removed from the shop and from every basket. Past orders keep their copy of it. This cannot be undone.</>}
      </ConfirmDialog>
    </>
  );
}
