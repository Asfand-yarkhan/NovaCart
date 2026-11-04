import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import Field from '../components/ui/Field';
import Seo from '../components/ui/Seo';
import { pluralize } from '../lib/format';
import AuthShell, { PasswordInput } from './AuthShell';

const strengthHint = (pw) => {
  if (!pw) return 'At least 6 characters.';
  if (pw.length < 6) return `${6 - pw.length} more ${6 - pw.length === 1 ? 'character' : 'characters'} to go.`;
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(rx => rx.test(pw)).length;
  if (pw.length >= 12 || (pw.length >= 8 && variety >= 3)) return 'Strong password.';
  return 'Good enough. Longer, or a mix of numbers and symbols, is stronger.';
};

export default function Signup() {
  const { user, register } = useAuth();
  const { count } = useCart();
  const toast = useToast();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={AuthShell.redirectTarget(location.state)} replace />;

  const set = (k) => (e) => { const v = e.target.value; setForm(f => ({ ...f, [k]: v })); setErrors(er => ({ ...er, [k]: undefined })); };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Enter your name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Enter a valid email address';
    if (form.password.length < 6) errs.password = 'Use at least 6 characters';
    if (form.confirm !== form.password) errs.confirm = 'Passwords do not match';
    setErrors(errs);
    setError('');
    const first = Object.keys(errs)[0];
    if (first) { document.getElementById(`auth-${first}`)?.focus(); return; }
    setBusy(true);
    try {
      const profile = await register(form.name.trim(), form.email.trim(), form.password);
      toast.success(`Welcome to NovaCart, ${profile.name.split(' ')[0]}`);
    } catch (err) {
      if (err.status === 409) {
        setErrors({ email: 'An account with this email already exists' });
        document.getElementById('auth-email')?.focus();
      } else {
        setError(err.message);
      }
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Save addresses, track deliveries and keep a list of favourites."
      image="/images/store-aisle.jpg"
      caption="Over 50 everyday staples, priced like your local market."
      footer={<>Already have an account? <Link to="/login" state={location.state}>Sign in</Link></>}
    >
      <Seo title="Create an account" noindex />
      {count > 0 && (
        <p className="alert alert-info auth-note"><i className="fa-solid fa-basket-shopping" aria-hidden="true" /> The {pluralize(count, 'item')} in your basket will move to your new account.</p>
      )}
      {error && <p className="alert alert-error" role="alert"><i className="fa-solid fa-circle-exclamation" aria-hidden="true" />{error}</p>}
      <form className="auth-form" onSubmit={submit} noValidate>
        <Field label="Full name" error={errors.name}>
          <input id="auth-name" className="input" value={form.name} onChange={set('name')} autoComplete="name" autoFocus />
        </Field>
        <Field label="Email" error={errors.email} hint="We send order receipts here">
          <input id="auth-email" className="input" type="email" inputMode="email" value={form.email} onChange={set('email')} autoComplete="email" />
        </Field>
        <Field label="Password" error={errors.password} hint={strengthHint(form.password)}>
          <PasswordInput id="auth-password" value={form.password} onChange={set('password')} show={show} onToggle={() => setShow(s => !s)} autoComplete="new-password" />
        </Field>
        <Field label="Confirm password" error={errors.confirm}>
          <input id="auth-confirm" className="input" type={show ? 'text' : 'password'} value={form.confirm} onChange={set('confirm')} autoComplete="new-password" />
        </Field>
        <p className="auth-terms">
          By creating an account you agree to our <Link to="/terms">terms</Link> and <Link to="/privacy">privacy policy</Link>.
        </p>
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
          {busy ? <><span className="spinner" aria-hidden="true" /> Creating account</> : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
}
