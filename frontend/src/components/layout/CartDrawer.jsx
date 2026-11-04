import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { imageUrl } from '../../lib/assets';
import { formatPrice, pluralize } from '../../lib/format';
import { FREE_DELIVERY_THRESHOLD } from '../../lib/store';
import { Drawer } from '../ui/Dialog';
import QuantityStepper from '../ui/QuantityStepper';

export function FreeDeliveryMeter({ subtotal, remaining }) {
  const pct = Math.min(100, Math.round((subtotal / FREE_DELIVERY_THRESHOLD) * 100));
  return (
    <div className="delivery-meter">
      <p>
        {remaining > 0
          ? <>Add <strong>{formatPrice(remaining)}</strong> more for free delivery</>
          : <><i className="fa-solid fa-truck-fast" aria-hidden="true" /> Delivery is free on this order</>}
      </p>
      <div className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Progress to free delivery">
        <span style={{ transform: `scaleX(${pct / 100})` }} />
      </div>
    </div>
  );
}

export function CartLine({ item, compact = false }) {
  const { updateQty, removeFromCart } = useCart();
  const p = item.product;
  return (
    <li className={`cart-line${compact ? ' is-compact' : ''}`}>
      <Link to={`/product/${p.slug}`} className="cart-line-img">
        <img src={imageUrl(p.image)} alt="" width="72" height="72" loading="lazy" />
      </Link>
      <div className="cart-line-info">
        <Link to={`/product/${p.slug}`} className="cart-line-name">{p.name}</Link>
        <span className="cart-line-unit">{p.unit} · {formatPrice(p.price)} each</span>
        <div className="cart-line-controls">
          <QuantityStepper value={item.quantity} min={1} max={p.stock} size="sm" label={p.name} onChange={q => updateQty(p._id, q)} />
          <button type="button" className="btn-link cart-line-remove" onClick={() => removeFromCart(p._id)}>Remove</button>
        </div>
        {p.stock > 0 && item.quantity >= p.stock && <span className="cart-line-note">That is all we have in stock.</span>}
      </div>
      <span className="cart-line-total num">{formatPrice(p.price * item.quantity)}</span>
    </li>
  );
}

export default function CartDrawer() {
  const { items, count, subtotal, savings, freeDeliveryRemaining, isOpen, closeCart } = useCart();
  const navigate = useNavigate();
  const go = (to) => { closeCart(); navigate(to); };

  return (
    <Drawer
      open={isOpen}
      onClose={closeCart}
      labelId="cart-drawer-title"
      title={<>Your basket {count > 0 && <span className="drawer-count">{pluralize(count, 'item')}</span>}</>}
      footer={items.length > 0 && (
        <div className="cart-drawer-foot">
          <div className="sum-row"><span>Subtotal</span><strong className="num">{formatPrice(subtotal)}</strong></div>
          {savings > 0 && <div className="sum-row sum-save"><span>You save</span><span className="num">{formatPrice(savings)}</span></div>}
          <p className="muted text-xs">Delivery and final total are confirmed at checkout.</p>
          <button type="button" className="btn btn-primary btn-lg btn-block" onClick={() => go('/checkout')}>
            Checkout <i className="fa-solid fa-arrow-right" aria-hidden="true" />
          </button>
          <button type="button" className="btn btn-ghost btn-block" onClick={() => go('/cart')}>View full basket</button>
        </div>
      )}
    >
      {items.length === 0 ? (
        <div className="cart-drawer-empty">
          <div className="empty-icon"><i className="fa-solid fa-basket-shopping" aria-hidden="true" /></div>
          <h3>Your basket is empty</h3>
          <p>Fresh fruit, veg and pantry staples, delivered in a three-hour window you choose.</p>
          <button type="button" className="btn btn-primary" onClick={() => go('/shop')}>Start shopping</button>
        </div>
      ) : (
        <>
          <FreeDeliveryMeter subtotal={subtotal} remaining={freeDeliveryRemaining} />
          <ul className="cart-lines" role="list">
            {items.map(item => <CartLine key={item.product._id} item={item} compact />)}
          </ul>
        </>
      )}
    </Drawer>
  );
}
