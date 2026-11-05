import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useWishlist } from '../context/WishlistContext';
import { api } from '../lib/api';
import { formatDate, initials } from '../lib/format';
import { PasswordForm, ProfileForm, SubmitButton } from '../components/account/AccountForms';
import Seo from '../components/ui/Seo';
import { AddressFields } from './Checkout';
import './Checkout.css';
import './Account.css';

const TABS = [
  { key: 'profile', label: 'Profile', icon: 'fa-regular fa-user' },
  { key: 'address', label: 'Address', icon: 'fa-solid fa-location-dot' },
  { key: 'password', label: 'Password', icon: 'fa-solid fa-key' }
];

function AddressForm({ user, onSaved }) {
  const toast = useToast();
  const [address, setAddress] = useState(() => AddressFields.fromUser(user));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const errs = AddressFields.validate(address);
    setErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) { document.getElementById(`acct-addr-${first}`)?.focus(); return; }
    setBusy(true);
    try {
      onSaved(await api('/users/profile', { method: 'PUT', body: { address: { ...address, country: 'Pakistan' } } }));
      toast.success('Address saved', { description: 'We will use it to prefill checkout.' });
    } catch (err) {
      setErrors({ form: err.message, ...err.fields });
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} noValidate className="acct-form">
      {errors.form && <p className="alert alert-error" role="alert"><i className="fa-solid fa-circle-exclamation" aria-hidden="true" />{errors.form}</p>}
      <AddressFields value={address} onChange={setAddress} errors={errors} idPrefix="acct-addr" />
      <div className="acct-form-foot"><SubmitButton busy={busy}>Save address</SubmitButton></div>
    </form>
  );
}

export default function Account() {
  const { user, setUser, logout, isAdmin } = useAuth();
  const { count: savedCount } = useWishlist();
  const toast = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState('profile');

  const onSaved = (profile) => setUser(u => ({ ...u, ...profile }));

  const onTabKey = (e, i) => {
    if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
    e.preventDefault();
    const next = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
    setTab(next.key);
    document.getElementById(`acct-tab-${next.key}`)?.focus();
  };

  const signOut = () => {
    logout();
    toast('You are signed out');
    navigate('/');
  };

  return (
    <div className="container page acct-page">
      <Seo title="Your account" noindex />

      <div className="acct-hero card card-pad">
        <span className="acct-avatar" aria-hidden="true">{initials(user.name)}</span>
        <div className="acct-hero-text">
          <h1>{user.name}</h1>
          <p>{user.email}{user.createdAt && <> · Member since {formatDate(user.createdAt, { month: 'long', year: 'numeric' })}</>}</p>
        </div>
        <div className="acct-hero-links">
          <Link to="/orders" className="btn btn-secondary btn-sm"><i className="fa-solid fa-receipt" aria-hidden="true" /> Orders</Link>
          <Link to="/wishlist" className="btn btn-secondary btn-sm"><i className="fa-regular fa-heart" aria-hidden="true" /> Saved {savedCount > 0 && <span className="num">({savedCount})</span>}</Link>
          {isAdmin && <Link to="/admin" className="btn btn-secondary btn-sm"><i className="fa-solid fa-store" aria-hidden="true" /> Store admin</Link>}
        </div>
      </div>

      <div className="acct-layout">
        <div className="acct-tabs" role="tablist" aria-label="Account settings" aria-orientation="vertical">
          {TABS.map((t, i) => (
            <button key={t.key} id={`acct-tab-${t.key}`} type="button" role="tab"
              aria-selected={tab === t.key} aria-controls={`acct-panel-${t.key}`} tabIndex={tab === t.key ? 0 : -1}
              onClick={() => setTab(t.key)} onKeyDown={e => onTabKey(e, i)}>
              <i className={t.icon} aria-hidden="true" /> {t.label}
            </button>
          ))}
          <button type="button" className="acct-signout" onClick={signOut}>
            <i className="fa-solid fa-arrow-right-from-bracket" aria-hidden="true" /> Sign out
          </button>
        </div>

        <div className="card card-pad acct-panel-wrap">
          {TABS.map(t => (
            <section key={t.key} id={`acct-panel-${t.key}`} role="tabpanel" aria-labelledby={`acct-tab-${t.key}`} hidden={tab !== t.key}>
              {t.key === 'profile' && <>
                <h2 className="acct-panel-title">Profile</h2>
                <p className="acct-panel-sub">How we greet you and how riders reach you.</p>
                <ProfileForm user={user} onSaved={onSaved} />
              </>}
              {t.key === 'address' && <>
                <h2 className="acct-panel-title">Delivery address</h2>
                <p className="acct-panel-sub">Saved here, it fills in checkout for you.</p>
                <AddressForm user={user} onSaved={onSaved} />
              </>}
              {t.key === 'password' && <>
                <h2 className="acct-panel-title">Password</h2>
                <p className="acct-panel-sub">You stay signed in on this device after changing it.</p>
                <PasswordForm />
              </>}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
