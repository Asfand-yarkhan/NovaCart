import { Link } from 'react-router-dom';
import Seo from '../components/ui/Seo';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import { CITIES } from '../lib/store';
import './Content.css';

const values = [
  { title: 'Bought this morning', body: 'Our buyers are at Lahore and Karachi mandis by 5 am. Whatever they pick is in a rider’s bag by noon, not in a cold room for a week.' },
  { title: 'Priced like the market', body: 'We check prices against three local markets every day. If we cannot match them, we say so on the product page instead of hiding it.' },
  { title: 'Paid on your doorstep', body: 'Cash on delivery for every order. Check your groceries first, then pay the rider. Anything you are unhappy with goes back with them.' },
  { title: 'Riders on salary', body: 'Our riders are employees with health cover, not gig workers chasing a per-drop rate. They have time to carry bags upstairs.' }
];

export default function About() {
  return (
    <>
      <Seo title="About us" description="NovaCart is a Lahore-based online grocer delivering fresh produce, dairy, meat and pantry staples the same day across five Pakistani cities." />

      <section className="container ct-hero">
        <Breadcrumbs items={[{ label: 'About' }]} />
        <h1>A neighbourhood grocer that happens to live online</h1>
        <p className="ct-lede">NovaCart started in 2023 in a rented garage in Model Town, Lahore, with one van and a WhatsApp number. Today we deliver to {CITIES.slice(0, -1).join(', ')} and {CITIES.at(-1)}, but the idea is the same: the produce your nani would pick, delivered in a three-hour window you choose.</p>
      </section>

      <section className="container">
        <div className="ct-split">
          <div className="ct-split-img"><img src="/images/market-stall.jpg" alt="Crates of fresh fruit and vegetables at a market stall" loading="lazy" /></div>
          <div className="ct-prose">
            <h2>How we source</h2>
            <p>Fruit comes from orchards we know by name: kinnow from Sargodha, apples from Swat, Chaunsa from Multan in June and July. Vegetables come from growers around Okara and Kasur who sell to us directly, so they keep more of the price.</p>
            <p>Meat is halal and cut to order at our partner butchers. Fish arrives from Karachi harbour on ice and goes out the same day or not at all.</p>
            <p>Anything we would not take home ourselves does not go in your bag.</p>
          </div>
        </div>

        <dl className="ct-facts">
          <div><dt>cities with same-day slots</dt><dd>5</dd></div>
          <div><dt>delivery windows you choose</dt><dd>3 h</dd></div>
          <div><dt>farms and growers we buy from</dt><dd>38</dd></div>
          <div><dt>average product rating</dt><dd>4.7</dd></div>
        </dl>

        <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-6)' }}>What we hold ourselves to</h2>
        <ol className="ct-values" role="list">
          {values.map(v => (
            <li key={v.title}><h3>{v.title}</h3><p>{v.body}</p></li>
          ))}
        </ol>

        <div className="ct-cta">
          <div>
            <h2>Your first basket is a good way to judge us</h2>
            <p>Free delivery over Rs 3,000. Pay the rider when it arrives.</p>
          </div>
          <Link to="/shop" className="btn btn-primary btn-lg">Start shopping <i className="fa-solid fa-arrow-right" aria-hidden="true" /></Link>
        </div>
      </section>
      <div style={{ height: 'var(--space-20)' }} />
    </>
  );
}
