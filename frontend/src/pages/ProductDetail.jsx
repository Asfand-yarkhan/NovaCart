import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { imageUrl, SITE_URL } from '../lib/assets';
import { discountPercent, formatPrice, pluralize, timeAgo } from '../lib/format';
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, deliveryDays, windowsFor } from '../lib/store';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import Seo from '../components/ui/Seo';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import Price from '../components/ui/Price';
import RatingStars from '../components/ui/RatingStars';
import QuantityStepper from '../components/ui/QuantityStepper';
import ProductCard from '../components/ui/ProductCard';
import EmptyState, { ErrorState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/Dialog';
import './ProductDetail.css';

const absolute = (src) => (!src ? '' : /^https?:/.test(src) ? src : `${SITE_URL}${src}`);

const nextSlotLabel = () => {
  const now = new Date();
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  for (const day of deliveryDays(now)) {
    const w = windowsFor(day, now);
    if (!w.length) continue;
    const diff = Math.round((day - today) / 86400000);
    const name = diff === 0 ? 'today' : diff === 1 ? 'tomorrow' : new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(day);
    return `${name}, ${w[0]}`;
  }
  return 'tomorrow morning';
};

const RATING_WORDS = { 1: 'Poor', 2: 'Not great', 3: 'Okay', 4: 'Good', 5: 'Excellent' };

/* ───────── Reviews ───────── */
function RatingBreakdown({ reviews, rating }) {
  const counts = [5, 4, 3, 2, 1].map(n => ({ n, c: reviews.filter(r => r.rating === n).length }));
  return (
    <div className="pd-breakdown">
      <div className="pd-breakdown-score">
        <strong className="num">{rating.toFixed(1)}</strong>
        <RatingStars value={rating} />
        <span>{pluralize(reviews.length, 'review')}</span>
      </div>
      <ul className="pd-bars" role="list">
        {counts.map(({ n, c }) => (
          <li key={n}>
            <span className="pd-bar-label">{n} star</span>
            <span className="pd-bar" aria-hidden="true"><span style={{ transform: `scaleX(${reviews.length ? c / reviews.length : 0})` }} /></span>
            <span className="pd-bar-count num" aria-label={`${c} reviews with ${n} stars`}>{c}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  const name = useId();
  const shown = hover || value;
  return (
    <fieldset className="pd-star-picker" onMouseLeave={() => setHover(0)}>
      <legend className="label">Your rating</legend>
      <div className="pd-stars-row">
        {[1, 2, 3, 4, 5].map(n => (
          <label key={n} className={`pd-star${n <= shown ? ' is-on' : ''}`} onMouseEnter={() => setHover(n)}>
            <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} />
            <i className="fa-solid fa-star" aria-hidden="true" />
            <span className="visually-hidden">{n} {n === 1 ? 'star' : 'stars'}, {RATING_WORDS[n]}</span>
          </label>
        ))}
        <span className="pd-star-word" aria-hidden="true">{shown ? RATING_WORDS[shown] : 'Tap a star'}</span>
      </div>
    </fieldset>
  );
}

function ReviewForm({ product, mine, onSaved }) {
  const toast = useToast();
  const [rating, setRating] = useState(mine?.rating || 0);
  const [comment, setComment] = useState(mine?.comment || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) { setError('Choose a rating from 1 to 5 stars.'); return; }
    setBusy(true); setError('');
    try {
      const res = await api(`/products/${product._id}/reviews`, { method: 'POST', body: { rating, comment } });
      onSaved(res);
      toast.success(mine ? 'Your review is updated' : 'Thanks, your review is live');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="pd-review-form card card-pad" onSubmit={submit} noValidate>
      <h3 className="card-title">{mine ? 'Update your review' : 'Write a review'}</h3>
      <StarPicker value={rating} onChange={(n) => { setRating(n); setError(''); }} />
      <div className="field">
        <label htmlFor="pd-comment">What did you think? <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></label>
        <textarea id="pd-comment" className="textarea" maxLength={1000} value={comment} onChange={e => setComment(e.target.value)}
          placeholder="Freshness, taste, how it arrived" rows={4} />
        <span className="hint">{comment.length}/1000</span>
      </div>
      {error && <div className="alert alert-error" role="alert"><i className="fa-solid fa-circle-exclamation" aria-hidden="true" />{error}</div>}
      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy && <span className="spinner" aria-hidden="true" />}{mine ? 'Update review' : 'Post review'}
      </button>
    </form>
  );
}

function Reviews({ product, onChange }) {
  const { user } = useAuth();
  const location = useLocation();
  const toast = useToast();
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const reviews = [...(product.reviews || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const mine = user ? reviews.find(r => String(r.user) === String(user._id)) : null;

  const remove = async () => {
    setBusy(true);
    try {
      const res = await api(`/products/${product._id}/reviews/${confirm}`, { method: 'DELETE' });
      onChange(res);
      toast.success('Your review is deleted');
      setConfirm(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pd-reviews">
      <div className="pd-reviews-side">
        {reviews.length > 0
          ? <RatingBreakdown reviews={reviews} rating={product.rating} />
          : <p className="muted">No reviews yet. If you have bought this, tell other shoppers how it was.</p>}
        {user
          ? <ReviewForm key={mine?._id || 'new'} product={product} mine={mine} onSaved={onChange} />
          : (
            <div className="pd-review-signin">
              <p>Bought this before? Share how it arrived.</p>
              <Link to="/login" state={{ from: location }} className="btn btn-secondary">Sign in to review</Link>
            </div>
          )}
      </div>

      <ol className="pd-review-list" role="list">
        {reviews.map(r => (
          <li key={r._id} className="pd-review">
            <div className="pd-review-head">
              <span className="avatar" aria-hidden="true">{r.name.split(' ').map(w => w[0]).slice(0, 2).join('')}</span>
              <div>
                <strong>{r.name}</strong>
                <span className="pd-review-meta">
                  {r.verified && <span className="badge badge-accent"><i className="fa-solid fa-check" aria-hidden="true" /> Verified purchase</span>}
                  <time dateTime={r.createdAt}>{timeAgo(r.createdAt)}</time>
                </span>
              </div>
              <RatingStars value={r.rating} />
            </div>
            {r.comment && <p className="pd-review-text">{r.comment}</p>}
            {user && (String(r.user) === String(user._id) || user.role === 'admin') && (
              <button type="button" className="btn-link pd-review-delete" onClick={() => setConfirm(r._id)}>
                {String(r.user) === String(user._id) ? 'Delete my review' : 'Remove review'}
              </button>
            )}
          </li>
        ))}
      </ol>

      <ConfirmDialog open={Boolean(confirm)} title="Delete this review?" confirmLabel="Delete review" danger busy={busy}
        onConfirm={remove} onClose={() => setConfirm(null)}>
        The review and its rating are removed from this product. You can write a new one later.
      </ConfirmDialog>
    </div>
  );
}

/* ───────── Tabs ───────── */
function Tabs({ tabs, active, onChange }) {
  const refs = useRef([]);
  const onKeyDown = (e, i) => {
    let next = null;
    if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
    if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = tabs.length - 1;
    if (next === null) return;
    e.preventDefault();
    onChange(tabs[next].id);
    refs.current[next]?.focus();
  };
  return (
    <div className="tabs" role="tablist" aria-label="Product information">
      {tabs.map((t, i) => (
        <button key={t.id} ref={el => { refs.current[i] = el; }} type="button" role="tab" id={`tab-${t.id}`}
          aria-selected={active === t.id} aria-controls={`panel-${t.id}`} tabIndex={active === t.id ? 0 : -1}
          onClick={() => onChange(t.id)} onKeyDown={e => onKeyDown(e, i)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ───────── Main view ───────── */
function ProductView({ initial }) {
  const [product, setProduct] = useState(initial);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('details');
  const { getQty, addToCart, openCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const reviewsRef = useRef(null);

  const inBasket = getQty(product._id);
  const saved = isWishlisted(product._id);
  const soldOut = product.stock <= 0;
  const canAdd = Math.max(0, product.stock - inBasket);
  const off = discountPercent(product.price, product.compareAtPrice);
  const img = imageUrl(product.image);

  const add = async () => {
    const ok = await addToCart(product, Math.min(qty, canAdd));
    if (ok) setQty(1);
  };

  const showReviews = (e) => {
    e.preventDefault();
    setTab('reviews');
    requestAnimationFrame(() => reviewsRef.current?.scrollIntoView({ block: 'start' }));
  };

  const onReviewsChange = (res) => setProduct(p => ({ ...p, rating: res.rating, numReviews: res.numReviews, reviews: res.reviews }));

  const url = `${SITE_URL}/product/${product.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name: product.name,
        image: absolute(img),
        description: product.description || product.metaDescription,
        sku: product._id,
        category: product.category,
        brand: { '@type': 'Brand', name: 'NovaCart' },
        offers: {
          '@type': 'Offer',
          url,
          price: product.price,
          priceCurrency: 'PKR',
          availability: soldOut ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
          itemCondition: 'https://schema.org/NewCondition'
        },
        ...(product.numReviews > 0 && {
          aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.numReviews }
        })
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Shop', item: `${SITE_URL}/shop` },
          { '@type': 'ListItem', position: 3, name: product.category, item: `${SITE_URL}/shop?category=${encodeURIComponent(product.category)}` },
          { '@type': 'ListItem', position: 4, name: product.name, item: url }
        ]
      }
    ]
  };

  const tabs = [
    { id: 'details', label: 'Details' },
    { id: 'reviews', label: `Reviews (${product.numReviews || 0})` }
  ];

  return (
    <div className="container page pd">
      <Seo
        title={product.metaTitle || product.name}
        rawTitle={Boolean(product.metaTitle)}
        description={product.metaDescription || product.description}
        keywords={product.metaKeywords}
        image={img}
        type="product"
        jsonLd={jsonLd}
      />
      <Breadcrumbs items={[
        { label: 'Shop', to: '/shop' },
        { label: product.category, to: `/shop?category=${encodeURIComponent(product.category)}` },
        { label: product.name }
      ]} />

      <div className="pd-main">
        <div className="pd-media">
          {img ? <img src={img} alt={product.name} width="800" height="800" fetchPriority="high" /> : <div className="pc-placeholder" aria-hidden="true" />}
          <div className="pd-flags">
            {off > 0 && <span className="badge badge-sale">{off}% off</span>}
            {product.featured && <span className="badge badge-solid">This week’s pick</span>}
          </div>
        </div>

        <div className="pd-info">
          <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="pd-cat">{product.category}</Link>
          <h1>{product.name}</h1>
          <p className="pd-unit">
            {product.unit}
            {product.origin && <><span aria-hidden="true"> · </span>From {product.origin}</>}
          </p>
          {product.numReviews > 0 && (
            <a href="#reviews" className="pd-rating-link" onClick={showReviews}>
              <RatingStars value={product.rating} showValue />
              <span>{pluralize(product.numReviews, 'review')}</span>
            </a>
          )}

          <div className="pd-price-row">
            <Price value={product.price} compareAt={product.compareAtPrice} className="pd-price" />
            {off > 0 && <span className="pd-save">You save {formatPrice(product.compareAtPrice - product.price)}</span>}
          </div>

          <p className={`pd-stock ${soldOut ? 'is-out' : product.stock <= 5 ? 'is-low' : 'is-in'}`}>
            <span className="pd-stock-dot" aria-hidden="true" />
            {soldOut ? 'Sold out. We restock most items within two days.' : product.stock <= 5 ? `Only ${product.stock} left today` : 'In stock, ready for delivery'}
          </p>

          {product.description && <p className="pd-lede">{product.description}</p>}

          <div className="pd-buy">
            {!soldOut && canAdd > 0 && (
              <QuantityStepper value={qty} min={1} max={canAdd} size="lg" label={product.name} onChange={setQty} />
            )}
            {soldOut ? (
              <button type="button" className="btn btn-secondary btn-lg pd-add" disabled>Sold out</button>
            ) : canAdd === 0 ? (
              <button type="button" className="btn btn-secondary btn-lg pd-add" onClick={openCart}>All {product.stock} are in your basket</button>
            ) : (
              <button type="button" className="btn btn-primary btn-lg pd-add" onClick={add}>
                <i className="fa-solid fa-basket-shopping" aria-hidden="true" /> Add to basket · {formatPrice(product.price * Math.min(qty, canAdd))}
              </button>
            )}
            <button type="button" className="btn btn-secondary btn-lg pd-save-btn" aria-pressed={saved} onClick={() => toggleWishlist(product)}
              aria-label={saved ? 'Remove from saved items' : 'Save for later'}>
              <i className={`fa-${saved ? 'solid' : 'regular'} fa-heart`} aria-hidden="true" />
            </button>
          </div>

          {inBasket > 0 && (
            <div className="pd-in-basket" role="status">
              <span><i className="fa-solid fa-check" aria-hidden="true" /> {inBasket} in your basket</span>
              <button type="button" className="btn-link" onClick={openCart}>View basket</button>
            </div>
          )}

          <ul className="pd-delivery" role="list">
            <li>
              <i className="fa-regular fa-clock" aria-hidden="true" />
              <span><strong>Next slot {nextSlotLabel()}</strong>Order before 6 pm for same-day delivery</span>
            </li>
            <li>
              <i className="fa-solid fa-truck-fast" aria-hidden="true" />
              <span><strong>Free delivery over {formatPrice(FREE_DELIVERY_THRESHOLD)}</strong>Otherwise a flat {formatPrice(DELIVERY_FEE)} per order</span>
            </li>
            <li>
              <i className="fa-solid fa-money-bill-wave" aria-hidden="true" />
              <span><strong>Cash on delivery</strong>Check your bag at the door before you pay</span>
            </li>
          </ul>
        </div>
      </div>

      <section className="pd-tabs" id="reviews" ref={reviewsRef} aria-label="Product information">
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
        <div role="tabpanel" id="panel-details" aria-labelledby="tab-details" hidden={tab !== 'details'} tabIndex={0}>
          <div className="pd-details">
            <div className="pd-details-text">
              <h2>About this product</h2>
              <p>{product.description || 'No description yet.'}</p>
              <p className="muted text-sm">Product photos are for illustration. Size and colour vary a little from batch to batch, as fresh produce does.</p>
            </div>
            <dl className="pd-spec">
              <div><dt>Pack size</dt><dd>{product.unit}</dd></div>
              {product.origin && <div><dt>Origin</dt><dd>{product.origin}</dd></div>}
              <div><dt>Category</dt><dd><Link to={`/shop?category=${encodeURIComponent(product.category)}`}>{product.category}</Link></dd></div>
              <div><dt>Storage</dt><dd>{/Dairy|Meat/.test(product.category) ? 'Keep refrigerated below 4 °C' : product.category === 'Pantry' || product.category === 'Snacks' ? 'Cool, dry place' : 'Cool place, out of direct sun'}</dd></div>
            </dl>
          </div>
        </div>
        <div role="tabpanel" id="panel-reviews" aria-labelledby="tab-reviews" hidden={tab !== 'reviews'} tabIndex={0}>
          <Reviews product={product} onChange={onReviewsChange} />
        </div>
      </section>

      {initial.related?.length > 0 && (
        <section className="pd-related" aria-labelledby="related-title">
          <div className="section-head">
            <h2 id="related-title">More from {product.category}</h2>
            <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="btn-link">See all</Link>
          </div>
          <div className="product-grid">
            {initial.related.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="container page pd" aria-busy="true" aria-label="Loading product">
      <div className="skeleton skeleton-text" style={{ width: 220 }} />
      <div className="pd-main">
        <div className="pd-media skeleton" />
        <div className="pd-info">
          <div className="skeleton skeleton-text" style={{ width: '25%' }} />
          <div className="skeleton" style={{ width: '75%', height: 44, marginTop: 12 }} />
          <div className="skeleton skeleton-text" style={{ width: '35%', marginTop: 12 }} />
          <div className="skeleton" style={{ width: '30%', height: 34, marginTop: 28 }} />
          <div className="skeleton skeleton-text" style={{ width: '90%', marginTop: 28 }} />
          <div className="skeleton skeleton-text" style={{ width: '80%' }} />
          <div className="skeleton" style={{ width: '100%', height: 52, marginTop: 28, borderRadius: 999 }} />
          <div className="skeleton" style={{ width: '100%', height: 150, marginTop: 24, borderRadius: 14 }} />
        </div>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const [state, setState] = useState({ product: null, loading: true, error: null, status: 0 });
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when the slug changes
    setState({ product: null, loading: true, error: null, status: 0 });
    api(`/products/slug/${encodeURIComponent(slug)}`, { signal: ctrl.signal })
      .then(product => setState({ product, loading: false, error: null, status: 200 }))
      .catch(err => { if (err.name !== 'AbortError') setState({ product: null, loading: false, error: err.message, status: err.status }); });
    return () => ctrl.abort();
  }, [slug, reload]);

  if (state.loading) return <ProductSkeleton />;
  if (state.status === 404) {
    return (
      <div className="container page">
        <Seo title="Product not found" noindex />
        <EmptyState icon="fa-basket-shopping" title="We could not find that product"
          actions={<><Link to="/shop" className="btn btn-primary">Back to the shop</Link><Link to="/categories" className="btn btn-secondary">Browse categories</Link></>}>
          It may have been renamed or taken off the shelf. Everything we stock today is in the shop.
        </EmptyState>
      </div>
    );
  }
  if (state.error) return <div className="container page"><ErrorState message={state.error} onRetry={() => setReload(r => r + 1)} /></div>;
  return <ProductView key={state.product._id} initial={state.product} />;
}
