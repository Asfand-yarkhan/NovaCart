import { Link } from 'react-router-dom';
import Seo from '../components/ui/Seo';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import { SUPPORT_EMAIL } from '../lib/store';
import './Content.css';

const PRIVACY = {
  title: 'Privacy policy',
  description: 'What NovaCart collects, why, how long we keep it and how to delete your account.',
  sections: [
    ['What we collect', ['Your name, email, phone number and delivery address when you create an account or place an order. Your order history, saved items and basket. Basic technical data such as browser type, used to keep the site working.']],
    ['Why we collect it', ['To deliver your orders, contact you about a delivery, handle refunds and answer support messages. If you subscribe to our Friday email, we use your email address to send it.']],
    ['Who we share it with', ['Your name, phone and address are shared with the rider delivering your order. We do not sell your data or share it with advertisers.']],
    ['How long we keep it', ['Order records are kept for six years for tax purposes. Everything else is deleted within 30 days of closing your account.']],
    ['Your choices', [`You can update your details on the account page. To close your account or get a copy of your data, email ${SUPPORT_EMAIL} from the address on your account.`]],
    ['Cookies and storage', ['We store your sign-in token, basket and theme choice in your browser so the site remembers them. We do not use advertising or tracking cookies.']]
  ]
};

const TERMS = {
  title: 'Terms of service',
  description: 'The terms that apply when you shop with NovaCart: orders, pricing, delivery, payment and returns.',
  sections: [
    ['Orders', ['An order is confirmed when you receive an order number. We may cancel an order if an item is out of stock or the address is outside our delivery area, and we will tell you before the delivery window.']],
    ['Prices', ['Prices include sales tax and are confirmed at checkout. Weights for fresh produce are approximate; we never charge more than the listed price.']],
    ['Delivery', ['We deliver within the window you choose. If we are running late we will call you. Missed deliveries can be rebooked once at no cost.']],
    ['Payment', ['Payment is cash on delivery. Please check your order before paying the rider.']],
    ['Returns', ['Fresh items covered by our 24-hour quality promise. Unopened packaged goods can be returned within 7 days. See the help page for details.']],
    ['Accounts', ['You are responsible for keeping your password private. We may suspend accounts used for fraud or abuse of riders.']],
    ['Contact', [`Questions about these terms go to ${SUPPORT_EMAIL}.`]]
  ]
};

export default function Legal({ kind }) {
  const doc = kind === 'terms' ? TERMS : PRIVACY;
  return (
    <>
      <Seo title={doc.title} description={doc.description} />
      <section className="container ct-hero">
        <Breadcrumbs items={[{ label: doc.title }]} />
        <h1>{doc.title}</h1>
        <p className="ct-updated">Last updated 1 October 2026</p>
      </section>
      <article className="container" style={{ paddingBottom: 'var(--space-20)' }}>
        <div className="ct-legal">
          {doc.sections.map(([h, ps]) => (
            <section key={h}>
              <h2>{h}</h2>
              {ps.map((p, i) => <p key={i}>{p}</p>)}
            </section>
          ))}
          <p style={{ marginTop: 'var(--space-10)' }}>
            See also: {kind === 'terms' ? <Link to="/privacy">Privacy policy</Link> : <Link to="/terms">Terms of service</Link>} · <Link to="/faq">Delivery and returns</Link>
          </p>
        </div>
      </article>
    </>
  );
}
