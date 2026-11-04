import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useSearchParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../lib/format';
import { CATEGORIES, FREE_DELIVERY_THRESHOLD } from '../../lib/store';
import Logo from '../ui/Logo';
import { Drawer } from '../ui/Dialog';
import SearchBox from './SearchBox';
import AccountMenu, { ThemeSelect } from './AccountMenu';

function CategoryLink({ cat, onClick }) {
  const [params] = useSearchParams();
  const { pathname } = useLocation();
  const active = pathname === '/shop' && params.get('category') === cat.name;
  return (
    <Link to={`/shop?category=${encodeURIComponent(cat.name)}`} className={`cat-link${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined} onClick={onClick}>
      {cat.name}
    </Link>
  );
}

export default function Header() {
  const { count, subtotal, openCart } = useCart();
  const { count: savedCount } = useWishlist();
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const sentinel = useRef(null);

  // Adds a shadow once the header sticks, without a scroll listener
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div className="announce">
        <div className="container announce-inner">
          <p><i className="fa-solid fa-truck-fast" aria-hidden="true" /> Free delivery over {formatPrice(FREE_DELIVERY_THRESHOLD)}. Same-day slots in Lahore, Karachi and Islamabad.</p>
          <nav className="announce-links" aria-label="Help">
            <Link to="/faq">Delivery &amp; returns</Link>
            <Link to="/contact">Contact</Link>
          </nav>
        </div>
      </div>
      <div ref={sentinel} aria-hidden="true" />

      <header className={`site-header${stuck ? ' is-stuck' : ''}`}>
        <div className="container header-main">
          <button type="button" className="icon-btn header-burger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <i className="fa-solid fa-bars" aria-hidden="true" />
          </button>

          <Logo />

          <div className="header-search"><SearchBox /></div>

          <nav className="header-actions" aria-label="Account">
            <AccountMenu />
            <Link to="/wishlist" className="header-action header-saved" aria-label={`Saved items${savedCount ? `, ${savedCount}` : ''}`}>
              <i className="fa-regular fa-heart" aria-hidden="true" />
              {savedCount > 0 && <span className="dot-count">{savedCount}</span>}
            </Link>
            <button type="button" className="header-cart" onClick={openCart} aria-label={`Basket, ${count} items, ${formatPrice(subtotal)}`}>
              <span className="header-cart-icon">
                <i className="fa-solid fa-basket-shopping" aria-hidden="true" />
                {count > 0 && <span className="dot-count" key={count}>{count}</span>}
              </span>
              <span className="header-cart-total num">{count > 0 ? formatPrice(subtotal) : 'Basket'}</span>
            </button>
          </nav>
        </div>

        <div className="container header-mobile-search"><SearchBox /></div>

        <nav className="cat-nav" aria-label="Categories">
          <div className="container cat-nav-inner">
            <NavLink to="/shop" end className={({ isActive }) => `cat-link${isActive && !location.search ? ' is-active' : ''}`}>All products</NavLink>
            <Link to="/shop?onSale=true" className={`cat-link cat-deals${location.search.includes('onSale') ? ' is-active' : ''}`}>Deals</Link>
            {CATEGORIES.map(c => <CategoryLink key={c.slug} cat={c} />)}
          </div>
        </nav>
      </header>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} side="left" title="Menu" labelId="mobile-menu-title">
        <nav className="mobile-nav" aria-label="Main" onClick={e => { if (e.target.closest('a')) setMenuOpen(false); }}>
          <p className="eyebrow">Shop</p>
          <Link to="/shop">All products</Link>
          <Link to="/shop?onSale=true">Deals this week</Link>
          {CATEGORIES.map(c => (
            <Link key={c.slug} to={`/shop?category=${encodeURIComponent(c.name)}`}>
              <i className={`fa-solid ${c.icon}`} aria-hidden="true" /> {c.name}
            </Link>
          ))}
          <p className="eyebrow">Your account</p>
          {user ? (
            <>
              <Link to="/orders">Orders</Link>
              <Link to="/wishlist">Saved items</Link>
              <Link to="/account">Account details</Link>
              {isAdmin && <Link to="/admin">Store admin</Link>}
            </>
          ) : (
            <>
              <Link to="/login">Sign in</Link>
              <Link to="/signup">Create an account</Link>
            </>
          )}
          <p className="eyebrow">Help</p>
          <Link to="/faq">Delivery &amp; returns</Link>
          <Link to="/about">About NovaCart</Link>
          <Link to="/contact">Contact us</Link>
          <div className="mobile-nav-theme"><ThemeSelect /></div>
        </nav>
      </Drawer>
    </>
  );
}
