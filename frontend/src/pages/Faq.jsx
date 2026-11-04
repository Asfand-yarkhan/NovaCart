import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../components/ui/Seo';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import { formatPrice } from '../lib/format';
import { CITIES, DELIVERY_FEE, DELIVERY_WINDOWS, FREE_DELIVERY_THRESHOLD, SUPPORT_WHATSAPP } from '../lib/store';
import './Content.css';

const GROUPS = [
  {
    id: 'delivery', title: 'Delivery',
    items: [
      { q: 'Where do you deliver?', a: [`We deliver across ${CITIES.join(', ')}. Enter your address at checkout and we will show the slots available for your area.`] },
      { q: 'How much does delivery cost?', a: [`Delivery is ${formatPrice(DELIVERY_FEE)} per order and free on orders of ${formatPrice(FREE_DELIVERY_THRESHOLD)} or more. The basket shows how close you are.`] },
      { q: 'When will my order arrive?', a: [`You choose a window at checkout: ${DELIVERY_WINDOWS.join(', ')}. Orders placed before 6 pm can be delivered the same day if a window is still open.`, 'The rider calls about 15 minutes before arriving.'] },
      { q: 'What if I am not home?', a: ['The rider waits up to 10 minutes and calls twice. If we cannot reach you, we bring the order back and rebook it for your next free window at no extra cost.'] }
    ]
  },
  {
    id: 'payments', title: 'Payments',
    items: [
      { q: 'How do I pay?', a: ['Cash on delivery. Check your groceries at the door, then pay the rider. Riders carry change for up to Rs 5,000.'] },
      { q: 'Can I pay by card or bank transfer?', a: ['Not yet. Card payments are on the way. If you need an invoice for a business account, contact us and we will set up monthly billing.'] },
      { q: 'Why is the final amount different from the basket?', a: ['Prices are confirmed when you place the order. If a price changed while items sat in your basket, checkout shows the current price before you confirm.'] }
    ]
  },
  {
    id: 'returns', title: 'Returns and quality',
    items: [
      { q: 'Something is bruised or missing. What now?', a: [`Hand it back to the rider, or send a photo on WhatsApp (${SUPPORT_WHATSAPP}) within 24 hours. We refund or replace it on your next order, no questions asked.`] },
      { q: 'Can I return packaged goods?', a: ['Unopened pantry items can be returned within 7 days. Fresh produce, dairy, meat and bakery items are covered by the 24-hour quality promise above.'] }
    ]
  },
  {
    id: 'orders', title: 'Orders and account',
    items: [
      { q: 'Can I change or cancel an order?', a: ['You can cancel from the order page until it is out for delivery. To add items, place a second order for the same window and we will combine them.'] },
      { q: 'How do I track my order?', a: ['Open Orders from the account menu. Each order shows a live status: processing, confirmed, out for delivery and delivered.'] },
      { q: 'Do I need an account to shop?', a: ['You can fill a basket without one. We ask you to sign in at checkout so you can track the order and we can reach you about delivery. Your basket is kept when you sign in.'] }
    ]
  }
];

export default function Faq() {
  const [q, setQ] = useState('');
  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return GROUPS;
    return GROUPS
      .map(g => ({ ...g, items: g.items.filter(i => (i.q + i.a.join(' ')).toLowerCase().includes(term)) }))
      .filter(g => g.items.length);
  }, [q]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: GROUPS.flatMap(g => g.items.map(i => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a.join(' ') } })))
  };

  return (
    <>
      <Seo title="Delivery, payments and returns" description="Delivery areas, slots and fees, cash on delivery, and our 24-hour quality promise. Answers to common NovaCart questions." jsonLd={jsonLd} />
      <section className="container ct-hero">
        <Breadcrumbs items={[{ label: 'Help' }]} />
        <h1>Delivery, payments and returns</h1>
        <p className="ct-lede">The short version: choose a three-hour window, pay the rider in cash, and if anything is not right, tell us within a day and we will make it right.</p>
      </section>

      <section className="container ct-faq" style={{ paddingBottom: 'var(--space-20)' }}>
        <nav className="ct-faq-nav" aria-label="Help topics">
          {GROUPS.map(g => <a key={g.id} href={`#${g.id}`}>{g.title}</a>)}
        </nav>
        <div>
          <div className="ct-faq-search input-group">
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
            <input className="input" type="search" placeholder="Search help, for example “refund”" value={q} onChange={e => setQ(e.target.value)} aria-label="Search help articles" />
          </div>
          {groups.length === 0 && (
            <div className="alert alert-info"><i className="fa-solid fa-circle-info" aria-hidden="true" />
              <span>Nothing matches “{q}”. <Link to="/contact">Ask us directly</Link> and we will answer within a day.</span>
            </div>
          )}
          {groups.map(g => (
            <section key={g.id} id={g.id} className="ct-faq-group" aria-labelledby={`${g.id}-h`}>
              <h2 id={`${g.id}-h`}>{g.title}</h2>
              {g.items.map(item => (
                <details key={item.q} className="ct-qa" open={Boolean(q.trim())}>
                  <summary>{item.q}<i className="fa-solid fa-plus" aria-hidden="true" /></summary>
                  <div className="ct-answer">{item.a.map((p, i) => <p key={i}>{p}</p>)}</div>
                </details>
              ))}
            </section>
          ))}
          <p className="muted">Still stuck? <Link to="/contact">Contact support</Link>, we answer every day from 8 am to 10 pm.</p>
        </div>
      </section>
    </>
  );
}
