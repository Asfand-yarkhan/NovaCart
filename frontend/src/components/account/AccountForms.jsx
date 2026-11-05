import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import Field from '../ui/Field';
import './account-forms.css';

// Profile and password forms shared by the store account page and the admin account page.

export function SubmitButton({ busy, children }) {
  return (
    <button type="submit" className="btn btn-primary" disabled={busy}>
      {busy && <span className="spinner" aria-hidden="true" />}{children}
    </button>
  );
}

export function ProfileForm({
  user,
  onSaved,
  phoneHint = 'Used for delivery calls only',
  emailHint = "Email can't be changed. Contact us if you need to move your account."
}) {
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
        <Field label="Phone" error={errors.phone} optional hint={phoneHint}>
          <input id="acct-phone" className="input" type="tel" inputMode="tel" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" />
        </Field>
        <Field label="Email" className="span-2" hint={emailHint}>
          <input id="acct-email" className="input" value={user.email} disabled readOnly />
        </Field>
      </div>
      <div className="acct-form-foot"><SubmitButton busy={busy}>Save profile</SubmitButton></div>
    </form>
  );
}

// Accounts that sign in through Firebase (email link or Google) manage their password there:
// we email a secure link instead of changing it here.
function FirebasePasswordPanel({ user }) {
  const toast = useToast();
  const [state, setState] = useState('idle');
  const google = user.signInMethods?.includes('google');
  const send = async () => {
    setState('sending');
    try {
      const { sendPasswordReset } = await import('../../lib/firebase');
      await sendPasswordReset(user.email);
      setState('sent');
      toast.success('Check your inbox', { description: `We sent a password link to ${user.email}.` });
    } catch (err) {
      setState('idle');
      toast.error(err.message);
    }
  };
  return (
    <div className="acct-form acct-form-narrow">
      <p className="alert alert-info">
        <i className={google ? 'fa-brands fa-google' : 'fa-regular fa-envelope'} aria-hidden="true" />
        {google
          ? 'You sign in with Google. If you also want to sign in with your email and a password, we will email you a link to set one.'
          : 'For your security, passwords are changed through a link sent to your email.'}
      </p>
      <p className="muted text-sm">The link goes to <strong>{user.email}</strong> and expires after one hour.</p>
      <div className="acct-form-foot">
        <button type="button" className="btn btn-primary" onClick={send} disabled={state === 'sending'}>
          {state === 'sending' && <span className="spinner" aria-hidden="true" />}
          {state === 'sent' ? 'Send the link again' : google ? 'Email me a link to set a password' : 'Email me a password reset link'}
        </button>
      </div>
    </div>
  );
}

function LocalPasswordForm() {
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

export function PasswordForm() {
  const { user } = useAuth();
  if (user?.usesFirebase && !user?.hasPassword) return <FirebasePasswordPanel user={user} />;
  return <LocalPasswordForm />;
}
