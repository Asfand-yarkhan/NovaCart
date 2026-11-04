import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { imageUrl } from '../lib/assets';
import { formatDate, formatDateTime, formatPrice, shortOrderId, STATUS_LABELS } from '../lib/format';
import { CANCELLABLE, ORDER_FLOW, SUPPORT_PHONE } from '../lib/store';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/Dialog';
import Seo from '../components/ui/Seo';
import './Checkout.css';
import './Orders.css';

const STEP_COPY = {
  processing: 'We have your order',
  confirmed: 'Packed at the warehouse',
  shipped: 'Rider is on the way',
  delivered: 'Delivered to your door'
};

function Tracker({ order }) {
  const history = order.statusHistory || [];
  const at = (s) => history.find(h => h.status === s)?.at;

  if (order.status === 'cancelled') {
    return (
      <ol className="ord-track is-cancelled" role="list">
        {history.map((h, i) => (
          <li key={i} className={`ord-step ${h.status === 'cancelled' ? 'is-cancel' : 'is-done'}`} aria-current={i === history.length - 1 ? 'step' : undefined}>
            <span className="ord-dot" aria-hidden="true"><i className={`fa-solid ${h.status === 'cancelled' ? 'fa-xmark' : 'fa-check'}`} /></span>
            <span className="ord-step-text">
              <strong>{h.status === 'cancelled' ? 'Cancelled' : STEP_COPY[h.status]}</strong>
              <small>{formatDateTime(h.at)}{h.note ? ` · ${h.note}` : ''}</small>
            </span>
          </li>
        ))}
      </ol>
    );
  }

  const current = ORDER_FLOW.indexOf(order.status);
  return (
    <ol className="ord-track" role="list">
      {ORDER_FLOW.map((s, i) => {
        const state = i < current ? 'is-done' : i === current ? (s === 'delivered' ? 'is-done' : 'is-current') : '';
        return (
          <li key={s} className={`ord-step ${state}`} aria-current={i === current ? 'step' : undefined}>
            <span className="ord-dot" aria-hidden="true">{i <= current && <i className="fa-solid fa-check" />}</span>
            <span className="ord-step-text">
              <strong>{STEP_COPY[s]}</strong>
              <small>{at(s) ? formatDateTime(at(s)) : i === current + 1 ? 'Next' : 'Pending'}</small>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function DetailSkeleton() {
  return (
    <div className="ord-detail-grid" aria-busy="true" aria-label="Loading order">
      <div className="card card-pad"><div className="skeleton" style={{ height: 120 }} /><div className="skeleton" style={{ height: 220, marginTop: 24 }} /></div>
      <div className="card card-pad"><div className="skeleton" style={{ height: 260 }} /></div>
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const location = useLocation();
  const toast = useToast();
  const cart = useCart();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reordering, setReordering] = useState(false);
  const placed = location.state?.placed;

  useEffect(() => {
    let live = true;
    api(`/orders/${id}`)
      .then(o => { if (live) { setOrder(o); setError(null); } })
      .catch(err => { if (live) setError(err); });
    return () => { live = false; };
  }, [id]);

  const cancel = async () => {
    setCancelling(true);
    try {
      const updated = await api(`/orders/${id}/cancel`, { method: 'PUT' });
      setOrder(o => ({ ...updated, user: o.user }));
      toast.success(`Order ${shortOrderId(updated)} cancelled`, { description: 'Nothing will be charged.' });
      setConfirming(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
    }
  };

  const orderAgain = async () => {
    setReordering(true);
    let added = 0;
    for (const it of order.items) {
      if (!it.product) continue;
      // The server re-checks stock and price; 99 just lets the basket accept the line
      const ok = await cart.addToCart(
        { _id: it.product, name: it.name, slug: it.slug, price: it.price, unit: it.unit, image: it.image, stock: 99 },
        it.quantity,
        { silent: true }
      );
      if (ok) added++;
    }
    setReordering(false);
    if (added > 0) {
      toast.success(`${added} of ${order.items.length} items added to your basket`);
      cart.openCart();
    } else {
      toast.error('None of these items could be added. They may have sold out.');
    }
  };

  if (error) {
    const forbidden = error.status === 403;
    return (
      <div className="container container-narrow page">
        <Seo title="Order" noindex />
        <EmptyState icon={forbidden ? 'fa-lock' : 'fa-receipt'}
          title={forbidden ? 'This order belongs to another account' : 'We could not find that order'}
          actions={<Link to="/orders" className="btn btn-primary">See your orders</Link>}>
          {forbidden ? 'Sign in with the account that placed it to see the details.' : error.status === 404 ? 'The link may be mistyped, or the order was removed.' : error.message}
        </EmptyState>
      </div>
    );
  }

  if (!order) {
    return <div className="container page"><Seo title="Order" noindex /><DetailSkeleton /></div>;
  }

  const a = order.shippingAddress || {};
  const canCancel = CANCELLABLE.includes(order.status);
  const units = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="container page ord-detail">
      <Seo title={`Order ${shortOrderId(order)}`} noindex />

      {placed && order.status !== 'cancelled' && (
        <div className="ord-placed rise" role="status">
          <span className="ord-placed-icon" aria-hidden="true"><i className="fa-solid fa-check" /></span>
          <div>
            <strong>Order {shortOrderId(order)} is confirmed</strong>
            <p>
              We will call {a.phone} before the rider arrives
              {order.deliverySlot?.window ? ` on ${formatDate(order.deliverySlot.date, { weekday: 'long', day: 'numeric', month: 'short' })}, ${order.deliverySlot.window.replace(' - ', ' to ')}` : ''}.
              Pay {formatPrice(order.total)} in cash at the door.
            </p>
          </div>
        </div>
      )}

      <div className="page-head ord-detail-head">
        <div>
          <Link to="/orders" className="ord-back"><i className="fa-solid fa-arrow-left" aria-hidden="true" /> All orders</Link>
          <h1 className="num">Order {shortOrderId(order)}</h1>
          <p>Placed {formatDateTime(order.createdAt)} · <span className={`status status-${order.status}`}>{STATUS_LABELS[order.status]}</span></p>
        </div>
        <div className="ord-actions">
          <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
            <i className="fa-solid fa-print" aria-hidden="true" /> Print receipt
          </button>
          <button type="button" className="btn btn-dark" onClick={orderAgain} disabled={reordering}>
            {reordering ? <span className="spinner" aria-hidden="true" /> : <i className="fa-solid fa-rotate-right" aria-hidden="true" />} Order again
          </button>
        </div>
      </div>

      <div className="ord-detail-grid">
        <div className="ord-detail-main">
          <section className="card card-pad" aria-labelledby="ord-track-title">
            <h2 id="ord-track-title" className="card-title">Delivery progress</h2>
            <Tracker order={order} />
            {canCancel && (
              <div className="ord-cancel-row">
                <p>Changed your mind? You can cancel until the rider leaves the warehouse.</p>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirming(true)}>Cancel order</button>
              </div>
            )}
            {order.status === 'shipped' && (
              <p className="alert alert-info ord-help"><i className="fa-solid fa-motorcycle" aria-hidden="true" /> Your rider is on the way. Need to change something? Call {SUPPORT_PHONE}.</p>
            )}
          </section>

          <section className="card card-pad" aria-labelledby="ord-items-title">
            <h2 id="ord-items-title" className="card-title">{units} {units === 1 ? 'item' : 'items'}</h2>
            <ul className="ord-items" role="list">
              {order.items.map((it, i) => (
                <li key={i}>
                  {it.slug
                    ? <Link to={`/product/${it.slug}`} className="ord-item-img"><img src={imageUrl(it.image)} alt="" width="64" height="64" loading="lazy" /></Link>
                    : <span className="ord-item-img"><img src={imageUrl(it.image)} alt="" width="64" height="64" loading="lazy" /></span>}
                  <div className="ord-item-info">
                    {it.slug ? <Link to={`/product/${it.slug}`}>{it.name}</Link> : <span>{it.name}</span>}
                    <small>{it.unit ? `${it.unit} · ` : ''}{it.quantity} × {formatPrice(it.price)}</small>
                  </div>
                  <span className="num ord-item-total">{formatPrice(it.price * it.quantity)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="ord-detail-side">
          <section className="card card-pad" aria-labelledby="ord-del-title">
            <h2 id="ord-del-title" className="card-title">Delivery</h2>
            <dl className="ord-facts">
              {order.deliverySlot?.window && (
                <div><dt>Slot</dt><dd>{formatDate(order.deliverySlot.date, { weekday: 'short', day: 'numeric', month: 'short' })}, {order.deliverySlot.window.replace(' - ', ' to ')}</dd></div>
              )}
              <div><dt>Deliver to</dt><dd><strong>{a.fullName}</strong><br />{a.street}<br />{[a.city, a.state, a.zip].filter(Boolean).join(', ')}</dd></div>
              <div><dt>Phone</dt><dd className="num">{a.phone}</dd></div>
              {order.notes && <div><dt>Notes</dt><dd>{order.notes}</dd></div>}
            </dl>
          </section>

          <section className="card card-pad" aria-labelledby="ord-pay-title">
            <h2 id="ord-pay-title" className="card-title">Payment</h2>
            <dl className="co-totals ord-totals">
              <div><dt>Subtotal</dt><dd className="num">{formatPrice(order.subtotal)}</dd></div>
              <div><dt>Delivery</dt><dd className="num">{order.deliveryFee ? formatPrice(order.deliveryFee) : 'Free'}</dd></div>
              <div className="co-grand"><dt>Total</dt><dd className="num">{formatPrice(order.total)}</dd></div>
            </dl>
            <p className="ord-paymethod">
              <i className="fa-solid fa-money-bill-wave" aria-hidden="true" />
              {order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Card'}
              <span className={`badge ${order.paymentStatus === 'paid' ? 'badge-accent' : order.paymentStatus === 'refunded' ? 'badge-info' : 'badge-warn'}`}>
                {order.paymentStatus === 'paid' ? 'Paid' : order.paymentStatus === 'refunded' ? 'Refunded' : order.status === 'cancelled' ? 'Not charged' : 'Due on delivery'}
              </span>
            </p>
          </section>

          <p className="ord-support">Questions about this order? <Link to="/contact" state={{ orderNumber: order.orderNumber }}>Contact us</Link> or call {SUPPORT_PHONE}.</p>
        </aside>
      </div>

      <ConfirmDialog
        open={confirming}
        title={`Cancel order ${shortOrderId(order)}?`}
        confirmLabel="Cancel order"
        danger
        busy={cancelling}
        onConfirm={cancel}
        onClose={() => setConfirming(false)}
      >
        The items go back on the shelf and nothing is charged. This cannot be undone, but you can always order again.
      </ConfirmDialog>

    </div>
  );
}
