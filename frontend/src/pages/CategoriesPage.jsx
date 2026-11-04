import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { formatPrice, pluralize } from '../lib/format';
import { CATEGORIES } from '../lib/store';
import Seo from '../components/ui/Seo';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import './Shop.css';

export default function CategoriesPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api('/products/categories').then(setStats).catch(() => setStats([]));
  }, []);

  // Known categories first (with photos), then any new ones an admin created
  const byName = new Map((stats || []).map(s => [s.name, s]));
  const extra = (stats || []).filter(s => !CATEGORIES.some(c => c.name === s.name))
    .map(s => ({ name: s.name, slug: s.slug, image: '', blurb: '' }));
  const tiles = [...CATEGORIES, ...extra];

  return (
    <div className="container page">
      <Seo title="Shop by category" description="Fruit, vegetables, dairy and eggs, halal meat and seafood, bakery, pantry staples, beverages and snacks. Same-day delivery from NovaCart." />
      <Breadcrumbs items={[{ label: 'Categories' }]} />
      <header className="page-head" style={{ marginTop: 'var(--space-5)' }}>
        <div>
          <h1>Shop by category</h1>
          <p>Eight aisles, restocked every morning. Pick one to see what is in today.</p>
        </div>
        <Link to="/shop" className="btn btn-secondary">Browse all products</Link>
      </header>

      <ul className="cat-page-grid" role="list">
        {tiles.map((c, i) => {
          const s = byName.get(c.name);
          return (
            <li key={c.slug} className="rise" style={{ '--i': Math.min(i, 6) }}>
              <Link to={`/shop?category=${encodeURIComponent(c.name)}`} className="cat-page-tile">
                {c.image && <img src={c.image} alt="" loading={i < 3 ? 'eager' : 'lazy'} width="700" height="840" />}
                <span className="cat-page-arrow" aria-hidden="true"><i className="fa-solid fa-arrow-right" /></span>
                <h2>{c.name}</h2>
                {c.blurb && <p>{c.blurb}</p>}
                <div className="cat-page-meta">
                  {stats === null
                    ? <span>Checking stock</span>
                    : s
                      ? <><span>{pluralize(s.count, 'product')}</span><span>From {formatPrice(s.minPrice)}</span></>
                      : <span>Restocking soon</span>}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
