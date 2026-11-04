import { Link } from 'react-router-dom';
import Seo from '../components/ui/Seo';
import SearchBox from '../components/layout/SearchBox';
import './Content.css';

export default function NotFound({ admin = false }) {
  if (admin) {
    return (
      <div className="empty" style={{ margin: 'var(--space-8) 0' }}>
        <div className="empty-icon"><i className="fa-solid fa-compass" aria-hidden="true" /></div>
        <h2>This admin page does not exist</h2>
        <p>Check the link, or go back to the overview.</p>
        <div className="empty-actions"><Link to="/admin" className="btn btn-primary">Back to overview</Link></div>
      </div>
    );
  }
  return (
    <>
      <Seo title="Page not found" noindex />
      <section className="container ct-404">
        <div>
          <p className="ct-code" aria-hidden="true">404</p>
          <h1>We could not find that page</h1>
          <p>The link may be old, or the product may have sold out for the season. Search for what you need, or head back to the shop.</p>
          <div className="ct-404-search"><SearchBox /></div>
          <div className="ct-404-actions">
            <Link to="/shop" className="btn btn-primary">Browse the shop</Link>
            <Link to="/" className="btn btn-secondary">Go to the home page</Link>
          </div>
        </div>
        <div className="ct-404-img"><img src="/images/produce-dark.jpg" alt="" loading="lazy" /></div>
      </section>
    </>
  );
}
