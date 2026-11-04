import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import ProductCard, { ProductGridSkeleton } from '../components/ui/ProductCard';
import EmptyState from '../components/ui/EmptyState';
import Seo from '../components/ui/Seo';
import { pluralize } from '../lib/format';

export default function Wishlist() {
  const { items, loading } = useWishlist();
  const inStock = items.filter(p => p.stock > 0).length;

  return (
    <div className="container page">
      <Seo title="Saved items" noindex />
      <div className="page-head">
        <div>
          <h1>Saved items</h1>
          {items.length > 0 && (
            <p>{pluralize(items.length, 'item')} saved{inStock < items.length ? `, ${inStock} in stock right now` : ''}. Tap the heart again to remove one.</p>
          )}
        </div>
        {items.length > 0 && <Link to="/shop" className="btn-link">Keep browsing</Link>}
      </div>

      {loading && items.length === 0 ? (
        <ProductGridSkeleton count={4} />
      ) : items.length === 0 ? (
        <EmptyState icon="fa-heart" title="Nothing saved yet"
          actions={<Link to="/shop" className="btn btn-primary">Browse the shop</Link>}>
          Tap the heart on any product to keep it here for your next shop. Saved items follow you across devices.
        </EmptyState>
      ) : (
        <div className="product-grid">
          {items.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
        </div>
      )}
    </div>
  );
}
