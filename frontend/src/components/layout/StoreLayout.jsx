import { lazy, Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from './CartDrawer';

// Loaded after the page so it never slows the first paint
const ChatWidget = lazy(() => import('../assistant/ChatWidget'));

export function RouteLoader() {
  return <div className="route-loader" role="status"><span className="spinner" /><span className="visually-hidden">Loading</span></div>;
}

/** Scrolls to top on page change, or to the #hash target if present. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) { el.scrollIntoView(); return; }
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);
  return null;
}

export default function StoreLayout() {
  return (
    <div className="app">
      <a href="#main" className="skip-link">Skip to content</a>
      <ScrollManager />
      <Header />
      <main id="main" tabIndex={-1}>
        <Suspense fallback={<RouteLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <CartDrawer />
      <Suspense fallback={null}><ChatWidget /></Suspense>
    </div>
  );
}
