import { useState } from 'react';
import { api } from '../../lib/api';
import { imageUrl } from '../../lib/assets';
import { formatDate, formatDateTime, formatPrice, shortOrderId, STATUS_LABELS } from '../../lib/format';
import { useToast } from '../../context/ToastContext';
import { Drawer } from '../ui/Dialog';
import Field from '../ui/Field';
import { NEXT_ACTION } from './constants';

const ALL = ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function OrderDrawer({ order, onClose, onUpdated }) {
  const toast = useToast();
  const [status, setStatus] = useState(order.status);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const terminal = order.status === 'cancelled';
  const next = NEXT_ACTION[order.status];
  const a = order.shippingAddress || {};
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);

  const update = async (to) => {
    if (to === order.status) return;
    setBusy(true); setError('');
    try {
      const saved = await api(`/orders/${order._id}/status`, { method: 'PUT', body: { status: to, note: note.trim() || undefined } });
      onUpdated(saved);
      setStatus(saved.status);
      setNote('');
      toast.success(`${shortOrderId(saved)} is now ${STATUS_LABELS[saved.status].toLowerCase()}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const history = [...(order.statusHistory || [])].reverse();

  return (
    <Drawer
      open
      onClose={onClose}
      labelId="adm-order-title"
      title={<>{shortOrderId(order)} <span className={`status status-${order.status}`} style={{ marginLeft: 8, verticalAlign: 'middle' }}>{STATUS_LABELS[order.status]}</span></>}
    >
      <div className="adm-od">
        <section className="adm-status-box" aria-label="Update status">
          {terminal ? (
            <p className="text-sm muted">This order was cancelled and its stock has been returned to the shelf. Cancelled orders cannot be reopened.</p>
          ) : (
            <>
              {next && (
                <button type="button" className="btn btn-primary btn-block" disabled={busy} onClick={() => update(next.status)}>
                  {busy ? <span className="spinner" aria-hidden="true" /> : <i className={`fa-solid ${next.icon}`} aria-hidden="true" />}
                  {next.label}
                </button>
              )}
              <div className="row">
                <Field label="Set status">
                  <select className="select" value={status} onChange={e => setStatus(e.target.value)} disabled={busy}>
                    {ALL.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </Field>
                <Field label="Note" optional>
                  <input className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="Rider Imran, ETA 4 pm" maxLength={200} disabled={busy} />
                </Field>
                <button type="button" className="btn btn-secondary" disabled={busy || status === order.status} onClick={() => update(status)}>Update</button>
              </div>
              {status === 'cancelled' && status !== order.status && (
                <p className="text-xs" style={{ color: 'var(--warn)' }}>Cancelling returns every item to stock and cannot be undone.</p>
              )}
            </>
          )}
          {error && <div className="alert alert-error" role="alert"><i className="fa-solid fa-circle-exclamation" aria-hidden="true" /><span>{error}</span></div>}
        </section>

        <dl className="adm-od-meta">
          <div>
            <dt>Customer</dt>
            <dd>{a.fullName}<br />{order.user?.email && <a href={`mailto:${order.user.email}`}>{order.user.email}</a>}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd><a href={`tel:${String(a.phone || '').replace(/[^\d+]/g, '')}`}>{a.phone}</a></dd>
          </div>
          <div>
            <dt>Deliver to</dt>
            <dd>{a.street}<br />{[a.city, a.state, a.zip].filter(Boolean).join(', ')}</dd>
          </div>
          <div>
            <dt>Delivery slot</dt>
            <dd>{order.deliverySlot?.date ? formatDate(order.deliverySlot.date, { weekday: 'short', day: 'numeric', month: 'short' }) : 'Not chosen'}<br />{order.deliverySlot?.window}</dd>
          </div>
          <div>
            <dt>Placed</dt>
            <dd>{formatDateTime(order.createdAt)}</dd>
          </div>
          <div>
            <dt>Payment</dt>
            <dd>Cash on delivery<br /><span className={`badge ${order.paymentStatus === 'paid' ? 'badge-accent' : 'badge-warn'}`}>{order.paymentStatus === 'paid' ? 'Collected' : 'To collect'}</span></dd>
          </div>
        </dl>

        {order.notes && <div className="adm-od-notes"><strong>Customer note:</strong> {order.notes}</div>}

        <section className="adm-od-section adm-od-items">
          <h3>{itemCount} {itemCount === 1 ? 'item' : 'items'}</h3>
          <ul className="adm-list" role="list">
            {order.items.map((i, idx) => (
              <li key={`${i.product}-${idx}`} className="adm-list-row">
                <img src={imageUrl(i.image)} alt="" width="40" height="40" loading="lazy" />
                <div style={{ minWidth: 0 }}>
                  <span className="name">{i.name}</span>
                  <span className="sub">{i.quantity} × {formatPrice(i.price)}{i.unit ? ` · ${i.unit}` : ''}</span>
                </div>
                <span className="val">{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="adm-od-totals">
            <div><span>Subtotal</span><span className="num">{formatPrice(order.subtotal)}</span></div>
            <div><span>Delivery</span><span className="num">{order.deliveryFee ? formatPrice(order.deliveryFee) : 'Free'}</span></div>
            <div className="grand"><span>Total</span><span className="num">{formatPrice(order.total)}</span></div>
          </div>
        </section>

        <section className="adm-od-section">
          <h3>History</h3>
          <ol className="adm-timeline">
            {history.map((h, i) => (
              <li key={`${h.status}-${h.at}`} className={i === 0 ? 'is-current' : ''}>
                <strong>{STATUS_LABELS[h.status]}</strong>
                <span>{formatDateTime(h.at)}</span>
                {h.note && <em>{h.note}</em>}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </Drawer>
  );
}
