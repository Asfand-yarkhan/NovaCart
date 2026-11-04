import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

/** Split layout for sign in and sign up: form on the left, a photo panel on the right (hidden on small screens). */
export default function AuthShell({ title, subtitle, children, footer, image = '/images/veg-shelves.jpg', caption }) {
  return (
    <div className="auth-page">
      <div className="auth-form-col">
        <div className="auth-form-inner rise">
          <h1>{title}</h1>
          {subtitle && <p className="auth-sub">{subtitle}</p>}
          {children}
          {footer && <div className="auth-foot">{footer}</div>}
        </div>
      </div>
      <figure className="auth-photo" aria-hidden="true">
        <img src={image} alt="" />
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    </div>
  );
}

export function PasswordInput({ id, value, onChange, show, onToggle, autoComplete, ...rest }) {
  return (
    <div className="auth-pass">
      <input id={id} className="input" type={show ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} {...rest} />
      <button type="button" className="auth-pass-toggle" onClick={onToggle} aria-pressed={show} aria-controls={id}>
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}

/** Where to send someone after signing in: back to where they came from, never to an auth page. */
AuthShell.redirectTarget = (state) => {
  const from = state?.from;
  if (!from?.pathname || ['/login', '/signup'].includes(from.pathname)) return '/';
  return `${from.pathname}${from.search || ''}`;
};

/**
 * Shown after sign-up (and when someone signs in before confirming): explains the email,
 * lets them resend it with a short cooldown, and points them back to sign in.
 */
export function VerifyEmailNotice({ email, compact = false }) {
  const [state, setState] = useState({ status: 'idle', message: '' });
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const resend = async () => {
    setState({ status: 'sending', message: '' });
    try {
      const { resendVerificationEmail } = await import('../lib/firebase');
      await resendVerificationEmail();
      setState({ status: 'sent', message: `A new link is on its way to ${email}.` });
      setCooldown(30);
    } catch (err) {
      setState({ status: 'error', message: err.message });
    }
  };

  return (
    <div className={`auth-verify${compact ? ' is-compact' : ''}`} role="status">
      {!compact && <div className="auth-verify-icon"><i className="fa-regular fa-envelope-open" aria-hidden="true" /></div>}
      {!compact && <h2>Check your inbox</h2>}
      <p>
        We sent a confirmation link to <strong>{email}</strong>. Open it to activate your account, then come back and sign in.
        It can take a minute, and sometimes lands in spam or promotions.
      </p>
      {state.message && <p className={`auth-verify-msg is-${state.status}`}>{state.message}</p>}
      <div className="auth-verify-actions">
        <button type="button" className="btn btn-secondary" onClick={resend} disabled={state.status === 'sending' || cooldown > 0}>
          {state.status === 'sending' && <span className="spinner" aria-hidden="true" />}
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email'}
        </button>
        {!compact && <Link to="/login" className="btn btn-primary">Go to sign in</Link>}
      </div>
    </div>
  );
}
