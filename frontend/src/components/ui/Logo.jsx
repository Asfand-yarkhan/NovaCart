import { Link } from 'react-router-dom';

/** NovaCart wordmark with a leaf-in-a-circle mark. */
export default function Logo({ to = '/', label = 'NovaCart home', className = '' }) {
  return (
    <Link to={to} className={`logo ${className}`} aria-label={label}>
      <svg className="logo-mark" viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
        <circle cx="16" cy="16" r="16" fill="var(--accent)" />
        <path d="M10 22.5c0-7 4.6-12 12.5-12.5-.3 7.9-5.4 12.5-12.5 12.5Z" fill="var(--accent-ink)" />
        <path d="M10.5 22 18 14.5" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className="logo-word">NovaCart</span>
    </Link>
  );
}
