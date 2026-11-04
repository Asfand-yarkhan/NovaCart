import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { imageUrl } from '../lib/assets';
import { formatPrice, pluralize } from '../lib/format';
import { CITIES, deliveryDays, windowsFor } from '../lib/store';
import Field from '../components/ui/Field';
import EmptyState from '../components/ui/EmptyState';
import Seo from '../components/ui/Seo';
import './Checkout.css';

const ADDRESS_FIELDS = ['fullName', 'phone', 'street', 'city', 'state', 'zip'];
const PHONE_RX = /^[0-9+\-\s()]{10,16}$/;

const dayLabel = (d, i, today = new Date()) => {
  const diff = Math.round((d - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return d.toLocaleDateString('en-GB', { weekday: 'long' });
};

function validateAddress(a) {
  const e = {};
  if (!a.fullName?.trim()) e.fullName = 'Enter the name of the person receiving the order';
  if (!a.phone?.trim()) e.phone = 'Enter a phone number so the rider can reach you';
  else if (!PHONE_RX.test(a.phone.trim()) || a.phone.replace(/\D/g, '').length < 10) e.phone = 'Enter a valid phone number, for example 0321 4478 192';
  if (!a.street?.trim()) e.street = 'Enter your house, street and area';
  if (!a.city?.trim()) e.city = 'Choose a city';
  return e;
}

export function AddressFields({ value, onChange, errors, idPrefix = 'co' }) {
  // Functional update: autofill changes several fields in one tick
  const set = (k) => (e) => { const v = e.target.value; onChange(prev => ({ ...prev, [k]: v })); };
  return (
    <div className="form-grid">
      <Field label="Full name" error={errors.fullName}>
        <input id={`${idPrefix}-fullName`} className="input" value={value.fullName} onChange={set('fullName')} autoComplete="name" />
      </Field>
      <Field label="Phone" error={errors.phone} hint="The rider calls this number before arriving, e.g. 0321 4478 192">
        <input id={`${idPrefix}-phone`} className="input" type="tel" inputMode="tel" value={value.phone} onChange={set('phone')} autoComplete="tel" />
      </Field>
      <Field label="House, street and area" error={errors.street} className="span-2">
        <input id={`${idPrefix}-street`} className="input" value={value.street} onChange={set('street')} autoComplete="street-address" placeholder="House 61, Street 22, F-10/2" />
      </Field>
      <Field label="City" error={errors.city}>
        <select id={`${idPrefix}-city`} className="select" value={value.city} onChange={set('city')} autoComplete="address-level2">
          <option value="">Choose a city</option>
          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Province" optional>
        <input id={`${idPrefix}-state`} className="input" value={value.state} onChange={set('state')} autoComplete="address-level1" placeholder="Punjab" />
      </Field>
      <Field label="Postal code" optional>
        <input id={`${idPrefix}-zip`} className="input" inputMode="numeric" value={value.zip} onChange={set('zip')} autoComplete="postal-code" />
      </Field>
    </div>
  );
}

const addressFromUser = (user) => ({
  fullName: user?.address?.fullName || user?.name || '',
  phone: user?.address?.phone || user?.phone || '',
  street: user?.address?.street || '',
  city: user?.address?.city || '',
  state: user?.address?.state || '',
  zip: user?.address?.zip || ''
});

// Shared with the account page without exporting non-components from this module
AddressFields.validate = validateAddress;
AddressFields.fromUser = addressFromUser;

function Summary({ items, count, subtotal, savings, deliveryFee, total, submitting }) {
  return (
    <aside className="co-summary card card-pad" aria-labelledby="co-summary-title">
      <h2 id="co-summary-title" className="card-title">Order summary</h2>
      <details className="co-items" open>
        <summary>{pluralize(count, 'item')} <i className="fa-solid fa-chevron-down" aria-hidden="true" /></summary>
        <ul role="list">
          {items.map(({ product: p, quantity }) => (
            <li key={p._id}>
              <span className="co-item-img">
                <img src={imageUrl(p.image)} alt="" width="48" height="48" loading="lazy" />
                <span className="co-item-qty">{quantity}</span>
              </span>
              <span className="co-item-name">{p.name}<small>{p.unit}</small></span>
              <span className="num">{formatPrice(p.price * quantity)}</span>
            </li>
          ))}
        </ul>
      </details>
      <dl className="co-totals">
        <div><dt>Subtotal</dt><dd className="num">{formatPrice(subtotal)}</dd></div>
        {savings > 0 && <div className="co-save"><dt>You save</dt><dd className="num">{formatPrice(savings)}</dd></div>}
        <div><dt>Delivery</dt><dd className="num">{deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}</dd></div>
        <div className="co-grand"><dt>Total to pay</dt><dd className="num">{formatPrice(total)}</dd></div>
      </dl>
      <button type="submit" form="co-form" className="btn btn-primary btn-lg btn-block co-summary-submit" disabled={submitting}>
        {submitting ? <><span className="spinner" aria-hidden="true" /> Placing order</> : <>Place order <span className="num">{formatPrice(total)}</span></>}
      </button>
      <p className="co-note"><i className="fa-solid fa-lock" aria-hidden="true" /> Final prices are checked against stock when you place the order.</p>
    </aside>
  );
}

export default function Checkout() {
  const cart = useCart();
  const { items, loading, count, subtotal, savings, deliveryFee, total, clearCart } = cart;
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const days = useMemo(() => deliveryDays(), []);
  const firstOpenDay = Math.max(0, days.findIndex(d => windowsFor(d).length > 0));

  const [address, setAddress] = useState(() => addressFromUser(user));
  const [saveAddress, setSaveAddress] = useState(true);
  const [dayIdx, setDayIdx] = useState(firstOpenDay);
  const [slot, setSlot] = useState(() => windowsFor(days[firstOpenDay])[0] || '');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);

  const windows = windowsFor(days[dayIdx]);

  const pickDay = (i) => {
    setDayIdx(i);
    const open = windowsFor(days[i]);
    if (!open.includes(slot)) setSlot(open[0] || '');
    setErrors(e => ({ ...e, slot: undefined }));
  };

  const focusFirst = (errs) => {
    const order = [...ADDRESS_FIELDS, 'slot'];
    const first = order.find(k => errs[k]);
    if (first) document.getElementById(first === 'slot' ? 'co-slot' : `co-${first}`)?.focus();
  };

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const errs = validateAddress(address);
    if (!slot) errs.slot = 'Choose a delivery window';
    setErrors(errs);
    setServerError(null);
    if (Object.keys(errs).length) { focusFirst(errs); return; }

    setSubmitting(true);
    const shippingAddress = { ...address, country: 'Pakistan' };
    try {
      const order = await api('/orders', {
        method: 'POST',
        body: {
          items: items.map(i => ({ product: i.product._id, quantity: i.quantity })),
          shippingAddress,
          deliverySlot: { date: days[dayIdx].toISOString(), window: slot },
          notes: notes.trim() || undefined,
          saveAddress
        }
      });
      setPlaced(true);
      if (saveAddress) setUser(u => (u ? { ...u, address: shippingAddress, phone: u.phone || address.phone } : u));
      navigate(`/orders/${order._id}`, { replace: true, state: { placed: true } });
      clearCart({ local: true });
    } catch (err) {
      if (err.fields && Object.keys(err.fields).length) {
        const mapped = Object.fromEntries(Object.entries(err.fields).filter(([k]) => ADDRESS_FIELDS.includes(k)).map(([k, v]) => [k, v === 'Required' ? 'This field is required' : v]));
        setErrors(mapped);
        focusFirst(mapped);
      }
      setServerError({ message: err.message, stock: err.status === 409 });
      setSubmitting(false);
    }
  };

  if (!placed && !loading && items.length === 0) {
    return (
      <div className="container page">
        <Seo title="Checkout" noindex />
        <EmptyState icon="fa-basket-shopping" title="There is nothing to check out"
          actions={<Link to="/shop" className="btn btn-primary">Browse the shop</Link>}>
          Your basket is empty. Add a few things and come back here to choose a delivery window.
        </EmptyState>
      </div>
    );
  }

  if (loading && items.length === 0) {
    return (
      <div className="container page" aria-busy="true">
        <Seo title="Checkout" noindex />
        <div className="co-grid">
          <div className="card card-pad"><div className="skeleton" style={{ height: 320 }} /></div>
          <div className="card card-pad"><div className="skeleton" style={{ height: 240 }} /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container page co-page">
      <Seo title="Checkout" noindex />
      <div className="page-head">
        <div>
          <h1>Checkout</h1>
          <p>Three quick steps. You pay the rider in cash when your groceries arrive.</p>
        </div>
        <Link to="/cart" className="btn-link">Back to basket</Link>
      </div>

      <div className="co-grid">
        <form id="co-form" className="co-form" onSubmit={submit} noValidate>
          {serverError && (
            <div className="alert alert-error" role="alert">
              <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
              <div>
                {serverError.message}
                {serverError.stock && <> <Link to="/cart" className="btn-link">Update your basket</Link></>}
              </div>
            </div>
          )}

          <section className="card card-pad co-step" aria-labelledby="co-step-1">
            <header className="co-step-head">
              <span className="co-step-num" aria-hidden="true">1</span>
              <h2 id="co-step-1">Delivery address</h2>
            </header>
            <AddressFields value={address} onChange={setAddress} errors={errors} />
            <label className="checkbox co-save-check">
              <input type="checkbox" checked={saveAddress} onChange={e => setSaveAddress(e.target.checked)} />
              Save this address to my account
            </label>
          </section>

          <section className="card card-pad co-step" aria-labelledby="co-step-2">
            <header className="co-step-head">
              <span className="co-step-num" aria-hidden="true">2</span>
              <h2 id="co-step-2">Delivery slot</h2>
            </header>
            <p className="label" id="co-day-label">Day</p>
            <div className="co-days" role="radiogroup" aria-labelledby="co-day-label">
              {days.map((d, i) => {
                const none = windowsFor(d).length === 0;
                return (
                  <button key={d.toISOString()} type="button" role="radio" aria-checked={i === dayIdx}
                    className={`co-day${i === dayIdx ? ' is-active' : ''}`} onClick={() => pickDay(i)} disabled={none}>
                    <strong>{dayLabel(d, i)}</strong>
                    <span>{none ? 'Fully booked' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  </button>
                );
              })}
            </div>

            <fieldset className="co-windows" aria-describedby={errors.slot ? 'co-slot-err' : undefined}>
              <legend className="label">Three-hour window</legend>
              {windows.length === 0 ? (
                <p className="alert alert-warn"><i className="fa-regular fa-clock" aria-hidden="true" /> No windows left on this day. Pick the next day.</p>
              ) : (
                <div className="co-window-grid">
                  {windows.map((w, i) => (
                    <label key={w} className={`co-window${slot === w ? ' is-active' : ''}`}>
                      <input type="radio" name="slot" value={w} checked={slot === w} id={i === 0 ? 'co-slot' : undefined}
                        onChange={() => { setSlot(w); setErrors(er => ({ ...er, slot: undefined })); }} />
                      <span className="co-window-time num">{w.replace(' - ', ' to ')}</span>
                      <span className="co-window-fee">{deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}</span>
                    </label>
                  ))}
                </div>
              )}
              {errors.slot && <span className="error-text" id="co-slot-err"><i className="fa-solid fa-circle-exclamation" aria-hidden="true" />{errors.slot}</span>}
            </fieldset>
          </section>

          <section className="card card-pad co-step" aria-labelledby="co-step-3">
            <header className="co-step-head">
              <span className="co-step-num" aria-hidden="true">3</span>
              <h2 id="co-step-3">Payment</h2>
            </header>
            <div className="co-pay">
              <span className="co-pay-icon" aria-hidden="true"><i className="fa-solid fa-money-bill-wave" /></span>
              <div>
                <strong>Cash on delivery</strong>
                <p>Pay the rider when your order arrives. Check your bag first, then pay. Riders carry change for up to Rs 5,000.</p>
              </div>
              <i className="fa-solid fa-circle-check co-pay-check" aria-hidden="true" />
            </div>
            <Field label="Notes for the rider" optional hint="Gate code, landmark, or a time you are not home">
              <textarea id="co-notes" className="textarea" rows={3} maxLength={500} value={notes} onChange={e => setNotes(e.target.value)} />
            </Field>
          </section>

          <button type="submit" className="btn btn-primary btn-lg btn-block co-form-submit" disabled={submitting}>
            {submitting ? <><span className="spinner" aria-hidden="true" /> Placing order</> : <>Place order <span className="num">{formatPrice(total)}</span></>}
          </button>
        </form>

        <Summary items={items} count={count} subtotal={subtotal} savings={savings} deliveryFee={deliveryFee} total={total} submitting={submitting} />
      </div>
    </div>
  );
}
