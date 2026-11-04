/** <EmptyState icon="fa-basket-shopping" title="..." actions={<Link .../>}>Body copy</EmptyState> */
export default function EmptyState({ icon = 'fa-seedling', title, children, actions, as = 'h2' }) {
  const Heading = as;
  return (
    <div className="empty">
      <div className="empty-icon"><i className={`fa-solid ${icon}`} aria-hidden="true" /></div>
      <Heading>{title}</Heading>
      {children && <p>{children}</p>}
      {actions && <div className="empty-actions">{actions}</div>}
    </div>
  );
}

/** Inline error with optional retry, for failed loads. */
export function ErrorState({ message, onRetry }) {
  return (
    <div className="empty">
      <div className="empty-icon" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
        <i className="fa-solid fa-plug-circle-xmark" aria-hidden="true" />
      </div>
      <h2>We could not load this</h2>
      <p>{message || 'Something went wrong on our side.'}</p>
      {onRetry && <div className="empty-actions"><button type="button" className="btn btn-secondary" onClick={onRetry}><i className="fa-solid fa-rotate-right" aria-hidden="true" /> Try again</button></div>}
    </div>
  );
}
