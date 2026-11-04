import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { SITE_URL } from '../lib/assets';
import { formatPrice } from '../lib/format';
import { CATEGORIES, FREE_DELIVERY_THRESHOLD, SUPPORT_PHONE, deliveryDays, windowsFor } from '../lib/store';
import Seo from '../components/ui/Seo';
import ProductCard, { ProductGridSkeleton } from '../components/ui/ProductCard';
import { ErrorState } from '../components/ui/EmptyState';
import './Home.css';

const dayLabel = (d) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(d);
};

const nextSlot = () => {
  const now = new Date();
  for (const day of deliveryDays(now)) {
    const w = windowsFor(day, now);
    if (w.length) return { day: dayLabel(day), window: w[0] };
  }
  return null;
};

function useProducts(query) {
  const [state, setState] = useState({ products: [], loading: true, error: null });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const ctrl = new AbortController();
    api(`/products${query}`, { signal: ctrl.signal })
      .then(d => setState({ products: d.products, loading: false, error: null }))
      .catch(err => { if (err.name !== 'AbortError') setState({ products: [], loading: false, error: err.message }); });
    return () => ctrl.abort();
  }, [query, attempt]);
  const retry = () => { setState(st => ({ ...st, loading: true, error: null })); setAttempt(a => a + 1); };
  return { ...state, retry };
}

const STEPS = [
  { title: 'Fill your basket by 6 pm', body: 'Order before six and you can still get a slot the same evening. Later orders go out first thing next morning.' },
  { title: 'Pick a three-hour window', body: 'Choose a slot that suits you. We text when the rider leaves the warehouse.' },
  { title: 'We pick and pack it chilled', body: 'Dairy, meat and fish travel in insulated boxes. Fruit is packed on top, never under the atta.' },
  { title: 'Pay the rider in cash', body: 'Check the bag at the door. If anything is bruised or missing, we refund it, no questions.' }
];

export default function Home() {
  const picks = useProducts('?featured=true&limit=10&sort=rating');
  const deals = useProducts('?onSale=true&limit=4');
  const slot = nextSlot();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'GroceryStore',
        '@id': `${SITE_URL}/#store`,
        name: 'NovaCart',
        url: SITE_URL,
        logo: `${SITE_URL}/favicon.svg`,
        image: `${SITE_URL}/images/hero-bags.jpg`,
        telephone: SUPPORT_PHONE,
        priceRange: 'Rs',
        address: { '@type': 'PostalAddress', addressLocality: 'Lahore', addressCountry: 'PK' },
        areaServed: ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad']
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: 'NovaCart',
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/shop?q={search_term_string}` },
          'query-input': 'required name=search_term_string'
        }
      }
    ]
  };

  return (
    <>
      <Seo rawTitle title="NovaCart | Fresh groceries delivered the same day in Pakistan" jsonLd={jsonLd} />

      {/* Hero */}
      <section className="home-hero">
        <div className="container home-hero-grid">
          <div className="home-hero-copy rise">
            <p className="home-hero-cities">Lahore · Karachi · Islamabad · Rawalpindi · Faisalabad</p>
            <h1>Today’s groceries, at your door by this evening.</h1>
            <p className="home-hero-lede">
              Fruit from Swat and Multan, vegetables from the morning mandi, milk, meat and the pantry basics.
              Order by 6 pm, choose a three-hour window and pay the rider in cash.
            </p>
            <div className="home-hero-ctas">
              <Link to="/shop" className="btn btn-primary btn-lg">Start shopping <i className="fa-solid fa-arrow-right" aria-hidden="true" /></Link>
              <Link to="/shop?onSale=true" className="btn-link">See this week’s deals</Link>
            </div>

            <dl className="home-slot">
              <div className="home-slot-main">
                <dt><i className="fa-regular fa-clock" aria-hidden="true" /> Next delivery slot</dt>
                <dd>{slot ? <><strong>{slot.day}</strong>, {slot.window}</> : 'Tomorrow morning'}</dd>
              </div>
              <div>
                <dt>Delivery</dt>
                <dd>Free over {formatPrice(FREE_DELIVERY_THRESHOLD)}</dd>
              </div>
              <div>
                <dt>Payment</dt>
                <dd>Cash on delivery</dd>
              </div>
            </dl>
          </div>

          <div className="home-hero-media rise" style={{ '--i': 2 }}>
            <img src="/images/hero-bags.jpg" alt="Paper grocery bags filled with apples, bananas, cabbage and bread" width="1600" height="1200" fetchPriority="high" />
            <div className="home-hero-note">
              <span className="home-hero-note-dot" aria-hidden="true" />
              <p><strong>In this morning</strong>Chaunsa mangoes from Multan, picked yesterday</p>
            </div>
          </div>
        </div>
      </section>

      {/* Category rail */}
      <section className="section home-aisles" aria-labelledby="aisles-title">
        <div className="container">
          <div className="section-head">
            <div>
              <h2 id="aisles-title">Shop by aisle</h2>
              <p>Eight aisles, about the size of a good corner shop. Everything here is in our warehouse today.</p>
            </div>
            <Link to="/categories" className="btn-link">All categories</Link>
          </div>
          <ul className="home-rail" role="list">
            {CATEGORIES.map((c, i) => (
              <li key={c.slug} className="rise" style={{ '--i': Math.min(i, 6) }}>
                <Link to={`/shop?category=${encodeURIComponent(c.name)}`} className="home-aisle">
                  <img src={c.image} alt="" loading="lazy" width="700" height="840" />
                  <span className="home-aisle-name">{c.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Featured */}
      <section className="section home-picks" aria-labelledby="picks-title">
        <div className="container">
          <div className="section-head">
            <div>
              <h2 id="picks-title">This week’s picks</h2>
              <p>What our buyers are most excited about right now, chosen at the mandi on Monday.</p>
            </div>
            <Link to="/shop" className="btn-link">Shop everything</Link>
          </div>
          {picks.loading && picks.products.length === 0 ? <ProductGridSkeleton count={10} />
            : picks.error ? <ErrorState message={picks.error} onRetry={picks.retry} />
              : (
                <div className="product-grid">
                  {picks.products.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
                </div>
              )}
        </div>
      </section>

      {/* Deals */}
      {deals.products.length > 0 && (
        <section className="section home-deals" aria-labelledby="deals-title">
          <div className="container home-deals-grid">
            <div className="home-deals-intro">
              <span className="badge badge-sale">Until Sunday</span>
              <h2 id="deals-title">Prices down this week</h2>
              <p>When a farm has a good week, we pass it on. These prices hold until stock runs out or Sunday night, whichever comes first.</p>
              <Link to="/shop?onSale=true" className="btn btn-secondary">See all deals</Link>
            </div>
            <div className="product-grid home-deals-products">
              {deals.products.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
            </div>
          </div>
        </section>
      )}

      {/* How delivery works */}
      <section className="section home-how" aria-labelledby="how-title">
        <div className="container home-how-grid">
          <div className="home-how-media">
            <img src="/images/produce-dark.jpg" alt="Tomatoes, radishes, carrots and peppers on a dark table" loading="lazy" width="1600" height="1200" />
          </div>
          <div className="home-how-copy">
            <h2 id="how-title">How delivery works</h2>
            <p className="home-how-lede">No membership, no minimum order. A rider from our own team, not a courier app.</p>
            <ol className="home-steps" role="list">
              {STEPS.map((s, i) => (
                <li key={s.title}>
                  <span className="home-step-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <h3>{s.title}</h3>
                    <p>{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link to="/faq" className="btn-link">Delivery areas and timings</Link>
          </div>
        </div>
      </section>

      {/* Sourcing */}
      <section className="home-source" aria-labelledby="source-title">
        <img src="/images/market-stall.jpg" alt="" loading="lazy" width="1600" height="1200" className="home-source-bg" />
        <div className="container">
          <div className="home-source-card">
            <h2 id="source-title">Bought at the mandi at 5 am</h2>
            <p>
              Our buyers are at the Badami Bagh and Sabzi Mandi gates before sunrise. We buy what looks good that day
              and skip what does not, which is why some things sell out by the afternoon.
            </p>
            <dl className="home-origins">
              <div><dt>Apples</dt><dd>Swat Valley</dd></div>
              <div><dt>Mangoes</dt><dd>Multan</dd></div>
              <div><dt>Kinnow</dt><dd>Sargodha</dd></div>
              <div><dt>Prawns</dt><dd>Karachi harbour</dd></div>
            </dl>
            <Link to="/about" className="btn-link">How we source</Link>
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="section home-quote" aria-label="What customers say">
        <div className="container container-narrow">
          <figure>
            <blockquote>
              <p>“I used to lose my Saturday morning to the market. Now I order on Friday night and the milk is still cold when it arrives.”</p>
            </blockquote>
            <figcaption>
              <span className="avatar" aria-hidden="true">HS</span>
              <span><strong>Hira Siddiqui</strong>Model Town, Lahore · ordering since March</span>
            </figcaption>
          </figure>
        </div>
      </section>
    </>
  );
}
