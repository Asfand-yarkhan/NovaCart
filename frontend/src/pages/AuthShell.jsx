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
