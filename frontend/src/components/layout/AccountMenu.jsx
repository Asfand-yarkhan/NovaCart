import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { initials } from '../../lib/format';

export function ThemeSelect({ compact = false }) {
  const { theme, setTheme } = useTheme();
  return (
    <label className={`theme-select${compact ? ' is-compact' : ''}`}>
      <span>{compact ? <i className="fa-solid fa-circle-half-stroke" aria-hidden="true" /> : 'Theme'}</span>
      <select className="select" value={theme} onChange={e => setTheme(e.target.value)} aria-label="Colour theme">
        <option value="system">Match device</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  );
}

export default function AccountMenu() {
  const { user, isAdmin, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); ref.current?.querySelector('button')?.focus(); } };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  if (!user) {
    return (
      <Link to="/login" state={{ from: location }} className="header-action">
        <i className="fa-regular fa-user" aria-hidden="true" />
        <span className="header-action-label">Sign in</span>
      </Link>
    );
  }

  const signOut = () => {
    logout();
    toast('You are signed out');
    navigate('/');
  };

  return (
    <div className="account" ref={ref}>
      <button type="button" className="header-action account-trigger" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen(o => !o)}>
        <span className="avatar" aria-hidden="true">{initials(user.name)}</span>
        <span className="header-action-label">{user.name.split(' ')[0]}</span>
        <i className="fa-solid fa-chevron-down caret" aria-hidden="true" />
      </button>
      {open && (
        <div className="menu" role="menu" onClick={e => { if (e.target.closest('a')) setOpen(false); }}>
          <div className="menu-head">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
          <Link role="menuitem" to="/orders"><i className="fa-solid fa-receipt" aria-hidden="true" />Orders</Link>
          <Link role="menuitem" to="/wishlist"><i className="fa-regular fa-heart" aria-hidden="true" />Saved items</Link>
          <Link role="menuitem" to="/account"><i className="fa-regular fa-user" aria-hidden="true" />Account details</Link>
          {isAdmin && <Link role="menuitem" to="/admin"><i className="fa-solid fa-store" aria-hidden="true" />Store admin</Link>}
          <div className="menu-sep" />
          <div className="menu-row"><ThemeSelect /></div>
          <div className="menu-sep" />
          <button role="menuitem" type="button" onClick={signOut}><i className="fa-solid fa-arrow-right-from-bracket" aria-hidden="true" />Sign out</button>
        </div>
      )}
    </div>
  );
}
