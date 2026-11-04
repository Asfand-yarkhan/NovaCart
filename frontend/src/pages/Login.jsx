import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import Field from '../components/ui/Field';
import Seo from '../components/ui/Seo';
import { pluralize } from '../lib/format';
import AuthShell, { PasswordInput } from './AuthShell';

export default function Login() {
  const { user, login } = useAuth();
  const { count } = useCart();
  const toast = useToast();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={AuthShell.redirectTarget(location.state)} replace />;

  const set = (k) => (e) => { const v = e.target.value; setForm(f => ({ ...f, [k]: v })); setErrors(er => ({ ...er, [k]: undefined })); };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Enter the email you signed up with';
    if (!form.password) errs.password = 'Enter your password';
    setErrors(errs);
    setError('');
    const first = Object.keys(errs)[0];
    if (first) { document.getElementById(`auth-${first}`)?.focus(); return; }
    setBusy(true);
    try {
      const profile = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${profile.name.split(' ')[0]}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Track orders, reorder favourites and check out faster."
      image="/images/veg-shelves.jpg"
      caption="Bought fresh every morning, at your door the same day."
      footer={<>New to NovaCart? <Link to="/signup" state={location.state}>Create an account</Link></>}
    >
      <Seo title="Sign in" noindex />
      {count > 0 && (
        <p className="alert alert-info auth-note"><i className="fa-solid fa-basket-shopping" aria-hidden="true" /> The {pluralize(count, 'item')} in your basket will be kept when you sign in.</p>
      )}
      {error && <p className="alert alert-error" role="alert"><i className="fa-solid fa-circle-exclamation" aria-hidden="true" />{error}</p>}
      <form className="auth-form" onSubmit={submit} noValidate>
        <Field label="Email" error={errors.email}>
          <input id="auth-email" className="input" type="email" inputMode="email" value={form.email} onChange={set('email')} autoComplete="email" autoFocus />
        </Field>
        <Field label="Password" error={errors.password}>
          <PasswordInput id="auth-password" value={form.password} onChange={set('password')} show={show} onToggle={() => setShow(s => !s)} autoComplete="current-password" />
        </Field>
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
          {busy ? <><span className="spinner" aria-hidden="true" /> Signing in</> : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  );
}
