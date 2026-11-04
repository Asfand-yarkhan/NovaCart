import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { imageUrl } from '../../lib/assets';
import { discountPercent } from '../../lib/format';
import Price from './Price';
import RatingStars from './RatingStars';
import QuantityStepper from './QuantityStepper';

/** Storefront product tile. Once in the basket, the add button becomes a quantity stepper. */
export default function ProductCard({ product, index = 0, eager = false }) {
  const { getQty, addToCart, updateQty } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const qty = getQty(product._id);
  const saved = isWishlisted(product._id);
  const off = discountPercent(product.price, product.compareAtPrice);
  const soldOut = product.stock <= 0;
  const low = !soldOut && product.stock <= 5;

  return (
    <article className="product-card rise" style={{ '--i': Math.min(index, 6) }}>
      <div className="pc-media">
        {product.image
          ? <img src={imageUrl(product.image)} alt="" loading={eager ? 'eager' : 'lazy'} decoding="async" width="400" height="400" />
          : <div className="pc-placeholder" aria-hidden="true" />}
        <div className="pc-flags">
          {off > 0 && <span className="badge badge-sale">{off}% off</span>}
          {low && <span className="badge badge-warn">Only {product.stock} left</span>}
        </div>
        <button
          type="button"
          className="icon-btn pc-wish"
          aria-pressed={saved}
          aria-label={saved ? `Remove ${product.name} from saved items` : `Save ${product.name} for later`}
          onClick={() => toggleWishlist(product)}
        >
          <i className={`fa-${saved ? 'solid' : 'regular'} fa-heart`} aria-hidden="true" />
        </button>
        {soldOut && <div className="pc-soldout">Sold out</div>}
      </div>

      <div className="pc-body">
        <span className="pc-unit">{product.unit}</span>
        <h3 className="pc-name"><Link to={`/product/${product.slug}`}>{product.name}</Link></h3>
        {product.numReviews > 0 && <RatingStars value={product.rating} count={product.numReviews} />}
        <div className="pc-foot">
          <Price value={product.price} compareAt={product.compareAtPrice} />
          {qty > 0 ? (
            <QuantityStepper value={qty} min={0} max={product.stock} size="sm" label={product.name} onChange={(q) => updateQty(product._id, q)} />
          ) : (
            <button type="button" className="pc-add" disabled={soldOut} onClick={() => addToCart(product, 1)} aria-label={`Add ${product.name} to basket`}>
              <i className="fa-solid fa-plus" aria-hidden="true" /> Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="product-card" aria-hidden="true">
      <div className="pc-media skeleton" />
      <div className="pc-body">
        <div className="skeleton skeleton-text" style={{ width: '30%' }} />
        <div className="skeleton skeleton-text" style={{ width: '80%' }} />
        <div className="pc-foot">
          <div className="skeleton skeleton-text" style={{ width: '35%', height: '1.2em' }} />
          <div className="skeleton" style={{ width: 72, height: 38, borderRadius: 999 }} />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="product-grid" aria-busy="true" aria-label="Loading products">
      {Array.from({ length: count }, (_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  );
}
