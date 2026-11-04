import { Suspense, useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { initials } from '../../lib/format';
import Seo from '../ui/Seo';
import Logo from '../ui/Logo';
import { Drawer } from '../ui/Dialog';
import { ThemeSelect } from '../layout/AccountMenu';
import { RouteLoader } from '../layout/StoreLayout';
import './admin.css';

const NAV = [
  { to: '/admin', label: 'Overview', icon: 'fa-chart-simple', end: true },
  { to: '/admin/orders', label: 'Orders', icon: 'fa-receipt' },
  { to: '/admin/products', label: 'Products', icon: 'fa-box' },
  { to: '/admin/users', label: 'Customers', icon: 'fa-user-group' },
  { to: '/admin/messages', label: 'Messages', icon: 'fa-inbox', badge: true }
];

function SideContent({ unread, onSignOut }) {
  const { user } = useAuth();
  return (
    <>
      <nav className="adm-nav" aria-label="Admin">
        {NAV.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end}>
            <i className={`fa-solid ${item.icon}`} aria-hidden="true" />
            {item.label}
            {item.badge && unread > 0 && <span className="adm-count" aria-label={`${unread} unread`}>{unread}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="adm-side-foot">
        <div className="adm-user">
          <span className="avatar" aria-hidden="true">{initials(user?.name)}</span>
          <div>
            <strong>{user?.name}</strong>
            <span>Store admin</span>
          </div>
        </div>
        <ThemeSelect />
        <div className="adm-side-links">
          <Link to="/"><i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />View store</Link>
          <button type="button" onClick={onSignOut}><i className="fa-solid fa-arrow-right-from-bracket" aria-hidden="true" />Sign out</button>
        </div>
      </div>
    </>
  );
}

export default function AdminLayout() {
  const { logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  // The mobile menu remembers which page it was opened on, so navigating closes it
  const [menuFor, setMenuFor] = useState(null);
  const menuOpen = menuFor === location.pathname;
  const setMenuOpen = (open) => setMenuFor(open ? location.pathname : null);

  const refreshUnread = useCallback(() => {
    api('/contact').then(list => setUnread(list.filter(m => !m.read).length)).catch(() => {});
  }, []);

  useEffect(() => { refreshUnread(); }, [refreshUnread]);

  const signOut = () => {
    logout();
    toast('You are signed out');
    navigate('/admin/login');
  };

  return (
    <div className="adm">
      <Seo title="Store admin" noindex />
      <a href="#adm-main" className="skip-link">Skip to content</a>

      <aside className="adm-side">
        <div className="adm-brand">
          <Logo to="/admin" label="NovaCart admin home" />
          <span className="adm-brand-tag">Admin</span>
        </div>
        <SideContent unread={unread} onSignOut={signOut} />
      </aside>

      <div className="adm-topbar">
        <button type="button" className="icon-btn" onClick={() => setMenuOpen(true)} aria-label="Open admin menu">
          <i className="fa-solid fa-bars" aria-hidden="true" />
        </button>
        <Logo to="/admin" label="NovaCart admin home" />
        <span className="adm-brand-tag">Admin</span>
        {unread > 0 && (
          <Link to="/admin/messages" className="icon-btn adm-count-dot" aria-label={`${unread} unread messages`}>
            <i className="fa-solid fa-inbox" aria-hidden="true" />
            <span className="dot-count">{unread}</span>
          </Link>
        )}
      </div>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} side="left" title="Admin" labelId="adm-menu-title">
        <div className="adm-drawer-nav">
          <SideContent unread={unread} onSignOut={signOut} />
        </div>
      </Drawer>

      <main id="adm-main" className="adm-main" tabIndex={-1}>
        <div className="adm-inner">
          <Suspense fallback={<RouteLoader />}>
            <Outlet context={{ refreshUnread, setUnread }} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
