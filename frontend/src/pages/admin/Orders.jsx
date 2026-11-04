import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, qs } from '../../lib/api';
import useApi from '../../components/admin/useApi';
import { formatDate, formatDateTime, formatPrice, shortOrderId, STATUS_LABELS } from '../../lib/format';
import { useToast } from '../../context/ToastContext';
import Seo from '../../components/ui/Seo';
import EmptyState, { ErrorState } from '../../components/ui/EmptyState';
import PageHeader from '../../components/admin/PageHeader';
import OrderDrawer from '../../components/admin/OrderDrawer';

const TABS = ['all', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const NONE = [];

export default function Orders() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [extra, setExtra] = useState(null); // an opened order that is not in the current list

  const list = useApi(`/orders${qs({ q: debouncedQ })}`);
  const orders = list.data || NONE;
  const { loaded, loading, error } = list;

  const status = TABS.includes(params.get('status')) ? params.get('status') : 'all';
  const openId = params.get('open');
  const inList = openId ? orders.find(o => o._id === openId) : null;
  const openOrder = inList || (openId && extra?._id === openId ? extra : null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  // Deep link to an order outside the current search results
  useEffect(() => {
    if (!openId || !loaded || inList) return;
    let live = true;
    api(`/orders/${openId}`)
      .then(o => { if (live) setExtra(o); })
      .catch(err => toast.error(err.message));
    return () => { live = false; };
  }, [openId, loaded, inList, toast]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: key === 'open' ? false : true });
  };

  const counts = useMemo(() => {
    const c = { all: orders.length };
    orders.forEach(o => { c[o.status] = (c[o.status] || 0) + 1; });
    return c;
  }, [orders]);

  const rows = status === 'all' ? orders : orders.filter(o => o.status === status);

  const onUpdated = (saved) => {
    list.setData(all => (all || []).map(o => (o._id === saved._id ? { ...o, ...saved } : o)));
    setExtra(o => (o && o._id === saved._id ? { ...o, ...saved } : o));
  };

  const toCollect = orders.filter(o => o.paymentStatus !== 'paid' && o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);

  return (
    <>
      <Seo title="Orders" noindex />
      <PageHeader
        title="Orders"
        description={loaded ? `${(counts.processing || 0) + (counts.confirmed || 0)} waiting to go out, ${counts.shipped || 0} with riders, ${formatPrice(toCollect)} cash to collect` : 'Every order placed in the store'}
      />

      <div className="adm-tabs" role="group" aria-label="Filter by status">
        {TABS.map(t => (
          <button key={t} type="button" aria-pressed={status === t} onClick={() => setParam('status', t === 'all' ? '' : t)}>
            {t === 'all' ? 'All' : STATUS_LABELS[t]}
            <span className="count">{counts[t] || 0}</span>
          </button>
        ))}
      </div>

      <div className="adm-toolbar">
        <div className="input-group">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <input className="input" type="search" placeholder="Order number, name, phone or city" aria-label="Search orders" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        {loaded && <span className="adm-toolbar-meta">{rows.length} {rows.length === 1 ? 'order' : 'orders'}</span>}
      </div>

      {error && !loaded ? <ErrorState message={error} onRetry={list.reload} /> : (
        loaded && rows.length === 0 ? (
          <EmptyState icon="fa-receipt" title={debouncedQ ? 'No orders match that search' : status === 'all' ? 'No orders yet' : `No ${STATUS_LABELS[status].toLowerCase()} orders`}
            actions={(debouncedQ || status !== 'all') && <button type="button" className="btn btn-secondary" onClick={() => { setQ(''); setParam('status', ''); }}>Show all orders</button>}>
            {debouncedQ ? 'Check the order number or try the customer phone number.' : 'New orders show up here the moment they are placed.'}
          </EmptyState>
        ) : (
          <div className={`adm-panel adm-refetch${loading && loaded ? ' is-loading' : ''}`}>
            <div className="table-wrap">
              <table className="table adm-table">
                <thead>
                  <tr>
                    <th scope="col">Order</th>
                    <th scope="col">Placed</th>
                    <th scope="col">Customer</th>
                    <th scope="col" className="num">Items</th>
                    <th scope="col">Delivery slot</th>
                    <th scope="col">Payment</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {!loaded ? Array.from({ length: 8 }, (_, i) => (
                    <tr key={i} className="adm-row-skel" aria-hidden="true">
                      {Array.from({ length: 8 }, (_, j) => <td key={j}><div className="skeleton skeleton-text" style={{ width: j === 2 ? 120 : 64 }} /></td>)}
                    </tr>
                  )) : rows.map(o => (
                    <tr key={o._id} className="is-clickable" onClick={() => setParam('open', o._id)}>
                      <td>
                        <button type="button" className="btn-link" onClick={e => { e.stopPropagation(); setParam('open', o._id); }}>
                          {shortOrderId(o)}
                        </button>
                      </td>
                      <td>{formatDateTime(o.createdAt)}</td>
                      <td>{o.shippingAddress?.fullName}<div className="cell-sub">{o.shippingAddress?.city}</div></td>
                      <td className="num">{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                      <td>{o.deliverySlot?.date ? formatDate(o.deliverySlot.date, { day: 'numeric', month: 'short' }) : '-'}<div className="cell-sub">{o.deliverySlot?.window}</div></td>
                      <td><span className={`badge ${o.paymentStatus === 'paid' ? 'badge-accent' : o.status === 'cancelled' ? '' : 'badge-warn'}`}>{o.paymentStatus === 'paid' ? 'Collected' : o.status === 'cancelled' ? 'Not due' : 'COD due'}</span></td>
                      <td><span className={`status status-${o.status}`}>{STATUS_LABELS[o.status]}</span></td>
                      <td className="num"><strong>{formatPrice(o.total)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {openOrder && (
        <OrderDrawer key={openOrder._id + openOrder.status} order={openOrder} onClose={() => setParam('open', '')} onUpdated={onUpdated} />
      )}
    </>
  );
}
