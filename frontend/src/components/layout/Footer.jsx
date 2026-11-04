import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { CATEGORIES, SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_WHATSAPP } from '../../lib/store';
import Logo from '../ui/Logo';
import { ThemeSelect } from './AccountMenu';

function Newsletter() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ status: 'idle', message: '' });

  const submit = async (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setState({ status: 'error', message: 'Enter a valid email address.' });
      return;
    }
    setState({ status: 'loading', message: '' });
    try {
      const res = await api('/newsletter', { method: 'POST', body: { email } });
      setState({ status: 'done', message: res.message });
      setEmail('');
    } catch (err) {
      setState({ status: 'error', message: err.message });
    }
  };

  return (
    <form className="newsletter" onSubmit={submit} noValidate>
      <label htmlFor="nl-email" className="newsletter-label">Friday deals, once a week</label>
      <p className="newsletter-sub">Seasonal arrivals and the week's best prices. No spam, unsubscribe any time.</p>
      <div className="newsletter-row">
        <input id="nl-email" className="input" type="email" placeholder="you@example.com" value={email}
          onChange={e => { setEmail(e.target.value); if (state.status === 'error') setState({ status: 'idle', message: '' }); }}
          aria-invalid={state.status === 'error' || undefined} aria-describedby="nl-msg" autoComplete="email" />
        <button type="submit" className="btn btn-dark" disabled={state.status === 'loading'}>
          {state.status === 'loading' ? <span className="spinner" aria-hidden="true" /> : 'Subscribe'}
        </button>
      </div>
      <p id="nl-msg" className={`newsletter-msg is-${state.status}`} role="status">{state.message}</p>
    </form>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container footer-top">
        <div className="footer-brand">
          <Logo />
          <p>A neighbourhood grocer that happens to live online. We buy from farms and mandis every morning and deliver the same day across five cities.</p>
          <dl className="footer-contact">
            <div><dt>Call</dt><dd><a href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`}>{SUPPORT_PHONE}</a></dd></div>
            <div><dt>WhatsApp</dt><dd><a href={`https://wa.me/${SUPPORT_WHATSAPP.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">{SUPPORT_WHATSAPP}</a></dd></div>
            <div><dt>Email</dt><dd><a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></dd></div>
            <div><dt>Hours</dt><dd>Every day, 8 am to 10 pm</dd></div>
          </dl>
        </div>

        <nav className="footer-col" aria-label="Shop">
          <h2>Shop</h2>
          <ul role="list">
            {CATEGORIES.slice(0, 6).map(c => <li key={c.slug}><Link to={`/shop?category=${encodeURIComponent(c.name)}`}>{c.name}</Link></li>)}
            <li><Link to="/shop?onSale=true">Deals</Link></li>
          </ul>
        </nav>

        <nav className="footer-col" aria-label="Help">
          <h2>Help</h2>
          <ul role="list">
            <li><Link to="/orders">Track an order</Link></li>
            <li><Link to="/faq">Delivery &amp; returns</Link></li>
            <li><Link to="/faq#payments">Payments</Link></li>
            <li><Link to="/contact">Contact us</Link></li>
            <li><Link to="/about">About NovaCart</Link></li>
          </ul>
        </nav>

        <Newsletter />
      </div>

      <div className="container footer-bottom">
        <p>© {year} NovaCart (Pvt) Ltd. Lahore, Pakistan.</p>
        <nav aria-label="Legal" className="footer-legal">
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <a href="/sitemap.xml">Sitemap</a>
        </nav>
        <ThemeSelect compact />
      </div>
    </footer>
  );
}
