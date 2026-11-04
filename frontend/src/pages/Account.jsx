import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useWishlist } from '../context/WishlistContext';
import { api } from '../lib/api';
import { formatDate, initials } from '../lib/format';
import Field from '../components/ui/Field';
import Seo from '../components/ui/Seo';
import { AddressFields } from './Checkout';
import './Checkout.css';
import './Account.css';

const TABS = [
  { key: 'profile', label: 'Profile', icon: 'fa-regular fa-user' },
  { key: 'address', label: 'Address', icon: 'fa-solid fa-location-dot' },
  { key: 'password', label: 'Password', icon: 'fa-solid fa-key' }
];

function SubmitButton({ busy, children }) {
  return (
    <button type="submit" className="btn btn-primary" disabled={busy}>
      {busy && <span className="spinner" aria-hidden="true" />}{children}
    </button>
  );
}

function ProfileForm({ user, onSaved }) {
  const toast = useToast();
  const [name, setName] = useState(user.name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!name.trim()) errs.name = 'Enter your name';
    if (phone.trim() && phone.replace(/\D/g, '').length < 10) errs.phone = 'Enter a valid phone number, for example 0321 4478 192';
    setErrors(errs);
    if (Object.keys(errs).length) { document.getElementById(`acct-${Object.keys(errs)[0]}`)?.focus(); return; }
    setBusy(true);
    try {
      onSaved(await api('/users/profile', { method: 'PUT', body: { name: name.trim(), phone: phone.trim() } }));
      toast.success('Profile updated');
    } catch (err) {
      setErrors({ form: err.message, ...err.fields });
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} noValidate className="acct-form">
      {errors.form && <p className="alert alert-error" role="alert"><i className="fa-solid fa-circle-exclamation" aria-hidden="true" />{errors.form}</p>}
      <div className="form-grid">
        <Field label="Full name" error={errors.name}>
          <input id="acct-name" className="input" value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
        </Field>
        <Field label="Phone" error={errors.phone} optional hint="Used for delivery calls only">
          <input id="acct-phone" className="input" type="tel" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" />
        </Field>
        <Field label="Email" className="span-2" hint="Email can't be changed. Contact us if you need to move your account.">
          <input id="acct-email" className="input" value={user.email} disabled readOnly />
        </Field>
      </div>
      <div className="acct-form-foot"><SubmitButton busy={busy}>Save profile</SubmitButton></div>
    </form>
  );
}

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

function PasswordForm() {
  const toast = useToast();
  const empty = { currentPassword: '', newPassword: '', confirm: '' };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => { const v = e.target.value; setForm(f => ({ ...f, [k]: v })); };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.currentPassword) errs.currentPassword = 'Enter your current password';
    if (form.newPassword.length < 6) errs.newPassword = 'Use at least 6 characters';
    else if (form.newPassword === form.currentPassword) errs.newPassword = 'Choose a password you have not used here';
    if (form.confirm !== form.newPassword) errs.confirm = 'Passwords do not match';
    setErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) { document.getElementById(`acct-${first}`)?.focus(); return; }
    setBusy(true);
    try {
      await api('/users/profile/password', { method: 'PUT', body: { currentPassword: form.currentPassword, newPassword: form.newPassword } });
      setForm(empty);
      toast.success('Password changed', { description: 'Use the new one next time you sign in.' });
    } catch (err) {
      if (err.fields?.currentPassword) setErrors({ currentPassword: 'That is not your current password' });
      else setErrors({ form: err.message });
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} noValidate className="acct-form acct-form-narrow">
      {errors.form && <p className="alert alert-error" role="alert"><i className="fa-solid fa-circle-exclamation" aria-hidden="true" />{errors.form}</p>}
      <Field label="Current password" error={errors.currentPassword}>
        <input id="acct-currentPassword" className="input" type="password" value={form.currentPassword} onChange={set('currentPassword')} autoComplete="current-password" />
      </Field>
      <Field label="New password" error={errors.newPassword} hint="At least 6 characters. A short phrase is easier to remember.">
        <input id="acct-newPassword" className="input" type="password" value={form.newPassword} onChange={set('newPassword')} autoComplete="new-password" />
      </Field>
      <Field label="Confirm new password" error={errors.confirm}>
        <input id="acct-confirm" className="input" type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
      </Field>
      <div className="acct-form-foot"><SubmitButton busy={busy}>Change password</SubmitButton></div>
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
