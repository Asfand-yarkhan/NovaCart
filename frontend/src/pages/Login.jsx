import { useState } from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import Field from '../components/ui/Field';
import Seo from '../components/ui/Seo';
import { pluralize } from '../lib/format';
import GoogleButton, { AuthDivider } from '../components/ui/GoogleButton';
import AuthShell, { PasswordInput, VerifyEmailNotice } from './AuthShell';
import { firebaseEnabled, sendPasswordReset } from '../lib/firebase';

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
  const [unverified, setUnverified] = useState('');
  const [reset, setReset] = useState({ status: 'idle', message: '' });
  const [params] = useSearchParams();
  const justVerified = params.get('verified') === '1';

  if (user) return <Navigate to={AuthShell.redirectTarget(location.state)} replace />;

  const set = (k) => (e) => { const v = e.target.value; setForm(f => ({ ...f, [k]: v })); setErrors(er => ({ ...er, [k]: undefined })); };

  const forgot = async () => {
    const email = form.email.trim();
    if (!/^[^s@]+@[^s@]+.[^s@]+$/.test(email)) {
      setErrors({ email: 'Enter your email above, then choose Forgot password' });
      document.getElementById('auth-email')?.focus();
      return;
    }
    setReset({ status: 'sending', message: '' });
    try {
      await sendPasswordReset(email);
      setReset({ status: 'sent', message: `If ${email} has a NovaCart account, a reset link is on its way. Check spam if it does not arrive in a few minutes.` });
    } catch (err) {
      setReset({ status: 'error', message: err.message });
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Enter the email you signed up with';
    if (!form.password) errs.password = 'Enter your password';
    setErrors(errs);
    setError('');
    setUnverified('');
    const first = Object.keys(errs)[0];
    if (first) { document.getElementById(`auth-${first}`)?.focus(); return; }
    setBusy(true);
    try {
      const profile = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${profile.name.split(' ')[0]}`);
    } catch (err) {
      if (err.code === 'email-not-verified') setUnverified(form.email.trim());
      else setError(err.message);
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
      {justVerified && !error && !unverified && (
        <p className="alert alert-success auth-note"><i className="fa-solid fa-circle-check" aria-hidden="true" /> Your email is confirmed. Sign in to start shopping.</p>
      )}
      {unverified && <VerifyEmailNotice email={unverified} compact />}
      {reset.message && <p className={`alert ${reset.status === 'error' ? 'alert-error' : 'alert-info'} auth-note`} role="status"><i className="fa-solid fa-key" aria-hidden="true" />{reset.message}</p>}
      {error && <p className="alert alert-error" role="alert"><i className="fa-solid fa-circle-exclamation" aria-hidden="true" />{error}</p>}
      <GoogleButton label="Continue with Google" disabled={busy} onError={setError} onSuccess={p => toast.success(`Welcome back, ${p.name.split(" ")[0]}`)} />
      <AuthDivider />
      <form className="auth-form" onSubmit={submit} noValidate>
        <Field label="Email" error={errors.email}>
          <input id="auth-email" className="input" type="email" inputMode="email" value={form.email} onChange={set('email')} autoComplete="email" autoFocus />
        </Field>
        <Field label="Password" error={errors.password} labelAside={firebaseEnabled && (
          <button type="button" className="auth-forgot" onClick={forgot} disabled={reset.status === 'sending'}>Forgot password?</button>
        )}>
          <PasswordInput id="auth-password" value={form.password} onChange={set('password')} show={show} onToggle={() => setShow(s => !s)} autoComplete="current-password" />
        </Field>
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
          {busy ? <><span className="spinner" aria-hidden="true" /> Signing in</> : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  );
}
