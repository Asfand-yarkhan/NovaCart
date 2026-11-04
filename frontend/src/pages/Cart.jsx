import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { CartLine, FreeDeliveryMeter } from '../components/layout/CartDrawer';
import EmptyState from '../components/ui/EmptyState';
import Seo from '../components/ui/Seo';
import { formatPrice, pluralize } from '../lib/format';
import './Checkout.css';

function CartSkeleton() {
  return (
    <div className="cart-page-lines card card-pad" aria-busy="true" aria-label="Loading your basket">
      {[0, 1, 2].map(i => (
        <div key={i} className="cart-page-skel">
          <div className="skeleton" style={{ width: 96, height: 96, borderRadius: 10 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton-text" style={{ width: '55%' }} />
            <div className="skeleton skeleton-text" style={{ width: '30%' }} />
            <div className="skeleton" style={{ width: 110, height: 34, borderRadius: 999, marginTop: 12 }} />
          </div>
          <div className="skeleton skeleton-text" style={{ width: 64 }} />
        </div>
      ))}
    </div>
  );
}

export default function Cart() {
  const { items, loading, count, subtotal, savings, deliveryFee, total, freeDeliveryRemaining } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const goCheckout = () => {
    if (user) navigate('/checkout');
    else navigate('/login', { state: { from: { pathname: '/checkout' } } });
  };

  const showSkeleton = loading && items.length === 0;

  return (
    <div className="container page cart-page">
      <Seo title="Your basket" noindex />
      <div className="page-head">
        <div>
          <h1>Your basket</h1>
          {items.length > 0 && <p>{pluralize(count, 'item')} ready for checkout. Prices are confirmed when you place the order.</p>}
        </div>
        {items.length > 0 && <Link to="/shop" className="btn-link">Continue shopping</Link>}
      </div>

      {showSkeleton ? (
        <div className="cart-page-grid"><CartSkeleton /></div>
      ) : items.length === 0 ? (
        <EmptyState
          icon="fa-basket-shopping"
          title="Your basket is empty"
          actions={<>
            <Link to="/shop" className="btn btn-primary">Browse the shop</Link>
            <Link to="/shop?onSale=true" className="btn btn-secondary">See this week's deals</Link>
          </>}
        >
          Add fruit, veg and pantry staples, then pick a three-hour delivery window at checkout.
        </EmptyState>
      ) : (
        <div className="cart-page-grid">
          <section className="card card-pad cart-page-lines" aria-label="Basket items">
            <FreeDeliveryMeter subtotal={subtotal} remaining={freeDeliveryRemaining} />
            <ul className="cart-lines" role="list">
              {items.map(item => <CartLine key={item.product._id} item={item} />)}
            </ul>
          </section>

          <aside className="co-summary card card-pad" aria-labelledby="cart-summary-title">
            <h2 id="cart-summary-title" className="card-title">Order summary</h2>
            <dl className="co-totals">
              <div><dt>Subtotal</dt><dd className="num">{formatPrice(subtotal)}</dd></div>
              {savings > 0 && <div className="co-save"><dt>You save</dt><dd className="num">{formatPrice(savings)}</dd></div>}
              <div><dt>Delivery</dt><dd className="num">{deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}</dd></div>
              <div className="co-grand"><dt>Estimated total</dt><dd className="num">{formatPrice(total)}</dd></div>
            </dl>
            <button type="button" className="btn btn-primary btn-lg btn-block" onClick={goCheckout}>
              {user ? 'Go to checkout' : 'Sign in to check out'} <i className="fa-solid fa-arrow-right" aria-hidden="true" />
            </button>
            {!user && <p className="co-note">Your basket is kept when you sign in or create an account.</p>}
            <ul className="co-perks" role="list">
              <li><i className="fa-solid fa-money-bill-wave" aria-hidden="true" /> Pay cash when it arrives</li>
              <li><i className="fa-regular fa-clock" aria-hidden="true" /> Choose a three-hour delivery window</li>
              <li><i className="fa-solid fa-rotate-left" aria-hidden="true" /> Refused at the door? You pay nothing</li>
            </ul>
          </aside>
        </div>
      )}
    </div>
  );
}
