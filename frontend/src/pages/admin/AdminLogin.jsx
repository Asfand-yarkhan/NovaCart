import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Seo from '../../components/ui/Seo';
import Logo from '../../components/ui/Logo';
import Field from '../../components/ui/Field';
import GoogleButton, { AuthDivider } from '../../components/ui/GoogleButton';
import { RouteLoader } from '../../components/layout/StoreLayout';
import '../../components/admin/admin.css';

export default function AdminLogin() {
  const { user, isAdmin, loading, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState({});
  const [busy, setBusy] = useState(false);

  const from = location.state?.from?.pathname?.startsWith('/admin') ? location.state.from.pathname + (location.state.from.search || '') : '/admin';

  if (loading) return <RouteLoader />;
  if (user && isAdmin) return <Navigate to={from} replace />;

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Enter a valid email address';
    if (!form.password) errs.password = 'Enter your password';
    setFields(errs);
    if (Object.keys(errs).length) return;

    setBusy(true); setError('');
    try {
      const profile = await login(form.email.trim(), form.password);
      if (profile.role !== 'admin') {
        logout();
        setError('This account does not have admin access.');
        return;
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const set = (k) => (e) => { setForm(f => ({ ...f, [k]: e.target.value })); setFields(f => ({ ...f, [k]: undefined })); };

  return (
    <main className="adm-login">
      <Seo title="Admin sign in" noindex />
      <div className="card adm-login-card">
        <Logo />
        <h1>Sign in to the store admin</h1>
        <p>Manage products, orders and customers.</p>

        {error && (
          <div className="alert alert-error" role="alert">
            <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <GoogleButton disabled={busy} onError={setError} onSuccess={p => { if (p.role !== 'admin') { logout(); setError('This Google account does not have admin access.'); } }} />
        <AuthDivider />
        <form className="adm-login-form" onSubmit={submit} noValidate>
          <Field label="Email" error={fields.email}>
            <input className="input" type="email" autoComplete="username" value={form.email} onChange={set('email')} autoFocus />
          </Field>
          <Field label="Password" error={fields.password}
            labelAside={<button type="button" className="btn-link text-xs" onClick={() => setShowPw(s => !s)}>{showPw ? 'Hide' : 'Show'}</button>}>
            <input className="input" type={showPw ? 'text' : 'password'} autoComplete="current-password" value={form.password} onChange={set('password')} />
          </Field>
          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy}>
            {busy && <span className="spinner" aria-hidden="true" />}
            {busy ? 'Signing in' : 'Sign in'}
          </button>
        </form>

        <p className="adm-demo">
          Demo account from the seed data: <code>admin@novacart.pk</code> / <code>Admin@123</code>
        </p>
        <p className="adm-login-foot"><Link to="/">Back to the store</Link></p>
      </div>
    </main>
  );
}
