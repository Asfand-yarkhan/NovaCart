import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { imageUrl } from '../lib/assets';
import { formatDate, formatPrice, pluralize, shortOrderId, STATUS_LABELS } from '../lib/format';
import EmptyState, { ErrorState } from '../components/ui/EmptyState';
import Seo from '../components/ui/Seo';
import './Orders.css';

const FILTERS = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'active', label: 'Active', match: o => ['processing', 'confirmed', 'shipped'].includes(o.status) },
  { key: 'delivered', label: 'Delivered', match: o => o.status === 'delivered' },
  { key: 'cancelled', label: 'Cancelled', match: o => o.status === 'cancelled' }
];

function OrderRowSkeleton() {
  return (
    <div className="ord-row card" aria-hidden="true">
      <div className="ord-row-main">
        <div className="skeleton skeleton-text" style={{ width: 140 }} />
        <div className="skeleton skeleton-text" style={{ width: 90 }} />
      </div>
      <div className="ord-thumbs">
        {[0, 1, 2].map(i => <div key={i} className="skeleton" style={{ width: 44, height: 44, borderRadius: 10 }} />)}
      </div>
      <div className="skeleton skeleton-text" style={{ width: 80 }} />
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const load = useCallback(() => {
    api('/orders/mine').then(d => { setOrders(d); setError(''); }).catch(err => setError(err.message));
  }, []);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => Object.fromEntries(FILTERS.map(f => [f.key, (orders || []).filter(f.match).length])), [orders]);
  const visible = (orders || []).filter(FILTERS.find(f => f.key === filter).match);

  return (
    <div className="container container-narrow page ord-page">
      <Seo title="Your orders" noindex />
      <div className="page-head">
        <div>
          <h1>Your orders</h1>
          <p>Track deliveries, reorder favourites and download receipts.</p>
        </div>
      </div>

      {error && !orders ? (
        <ErrorState message={error} onRetry={() => { setError(''); load(); }} />
      ) : !orders ? (
        <div className="ord-list" aria-busy="true" aria-label="Loading orders">
          {[0, 1, 2].map(i => <OrderRowSkeleton key={i} />)}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState icon="fa-receipt" title="No orders yet"
          actions={<Link to="/shop" className="btn btn-primary">Start shopping</Link>}>
          When you place an order it shows up here, with live status from our warehouse to your door.
        </EmptyState>
      ) : (
        <>
          <div className="ord-filters" role="group" aria-label="Filter orders">
            {FILTERS.map(f => (
              <button key={f.key} type="button" className="chip" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
                {f.label} <span className="count">{counts[f.key]}</span>
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="ord-none">No {FILTERS.find(f => f.key === filter).label.toLowerCase()} orders right now.</p>
          ) : (
            <ul className="ord-list" role="list">
              {visible.map((o, i) => {
                const units = o.items.reduce((s, it) => s + it.quantity, 0);
                return (
                  <li key={o._id} className="rise" style={{ '--i': Math.min(i, 6) }}>
                    <Link to={`/orders/${o._id}`} className="ord-row card">
                      <div className="ord-row-main">
                        <strong className="num">{shortOrderId(o)}</strong>
                        <span>{formatDate(o.createdAt)} · {pluralize(units, 'item')}</span>
                      </div>
                      <div className="ord-thumbs" aria-hidden="true">
                        {o.items.slice(0, 4).map((it, k) => <img key={k} src={imageUrl(it.image)} alt="" width="44" height="44" loading="lazy" />)}
                        {o.items.length > 4 && <span className="ord-more">+{o.items.length - 4}</span>}
                      </div>
                      <span className={`status status-${o.status}`}>{STATUS_LABELS[o.status]}</span>
                      <strong className="ord-row-total num">{formatPrice(o.total)}</strong>
                      <i className="fa-solid fa-chevron-right ord-row-go" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
