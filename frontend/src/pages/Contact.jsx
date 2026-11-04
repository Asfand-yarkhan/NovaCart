import { useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Seo from '../components/ui/Seo';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import Field from '../components/ui/Field';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_WHATSAPP } from '../lib/store';
import './Content.css';

const SUBJECTS = ['General question', 'Order issue', 'Delivery', 'Bulk or business order', 'Feedback'];

export default function Contact() {
  const { user } = useAuth();
  const location = useLocation();
  const fromOrder = location.state?.orderNumber || '';
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', subject: fromOrder ? 'Order issue' : SUBJECTS[0], orderNumber: fromOrder, message: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [serverError, setServerError] = useState('');
  const formRef = useRef(null);

  const set = (k) => (e) => { setForm(f => ({ ...f, [k]: e.target.value })); if (errors[k]) setErrors(x => ({ ...x, [k]: undefined })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Enter your name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid email address';
    if (form.message.trim().length < 10) e.message = 'Tell us a little more (at least 10 characters)';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      formRef.current?.querySelector(`[aria-invalid="true"]`)?.focus();
      return;
    }
    setStatus('sending'); setServerError('');
    try {
      await api('/contact', { method: 'POST', body: form });
      setStatus('sent');
    } catch (err) {
      setStatus('idle');
      setServerError(err.message);
      if (err.fields) setErrors(err.fields);
    }
  };

  return (
    <>
      <Seo title="Contact us" description="Call, WhatsApp or email NovaCart support. We answer every day from 8 am to 10 pm and reply to messages within one working day." />
      <section className="container ct-hero">
        <Breadcrumbs items={[{ label: 'Contact' }]} />
        <h1>Talk to a person</h1>
        <p className="ct-lede">Missing item, late rider or a question about a product? The fastest way is WhatsApp. For anything else, send a message and we will reply within one working day.</p>
      </section>

      <section className="container ct-contact" style={{ paddingBottom: 'var(--space-20)' }}>
        <div>
          <div className="ct-channels">
            <a className="ct-channel" href={`https://wa.me/${SUPPORT_WHATSAPP.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
              <i className="fa-brands fa-whatsapp" aria-hidden="true" />
              <div><strong>WhatsApp</strong><span>{SUPPORT_WHATSAPP} · replies in about 10 minutes</span></div>
            </a>
            <a className="ct-channel" href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`}>
              <i className="fa-solid fa-phone" aria-hidden="true" />
              <div><strong>Call us</strong><span>{SUPPORT_PHONE}</span></div>
            </a>
            <a className="ct-channel" href={`mailto:${SUPPORT_EMAIL}`}>
              <i className="fa-regular fa-envelope" aria-hidden="true" />
              <div><strong>Email</strong><span>{SUPPORT_EMAIL}</span></div>
            </a>
            <div className="ct-channel">
              <i className="fa-solid fa-location-dot" aria-hidden="true" />
              <div><strong>Warehouse</strong><span>Plot 41, Sundar Industrial Estate, Raiwind Road, Lahore</span></div>
            </div>
          </div>
          <div className="ct-hours">
            <div><span>Support</span><span>Every day, 8 am to 10 pm</span></div>
            <div><span>Deliveries</span><span>9 am to 9 pm, in 3-hour windows</span></div>
            <div><span>Eid and public holidays</span><span>Reduced slots, shown at checkout</span></div>
          </div>
        </div>

        <div className="card card-pad">
          {status === 'sent' ? (
            <div className="ct-sent" role="status">
              <i className="fa-solid fa-circle-check" aria-hidden="true" />
              <h2>Message received</h2>
              <p className="muted">Thanks, {form.name.split(' ')[0]}. We will reply to {form.email} within one working day.</p>
              <button type="button" className="btn btn-secondary" onClick={() => { setStatus('idle'); setForm(f => ({ ...f, message: '', orderNumber: '' })); }}>Send another message</button>
            </div>
          ) : (
            <form ref={formRef} className="ct-form" onSubmit={submit} noValidate>
              <h2 className="card-title" style={{ fontSize: 'var(--text-lg)', fontFamily: 'var(--font-display)' }}>Send us a message</h2>
              {serverError && <div className="alert alert-error" role="alert"><i className="fa-solid fa-circle-exclamation" aria-hidden="true" />{serverError}</div>}
              <div className="form-grid">
                <Field label="Your name" error={errors.name}><input className="input" value={form.name} onChange={set('name')} autoComplete="name" /></Field>
                <Field label="Email" error={errors.email}><input className="input" type="email" value={form.email} onChange={set('email')} autoComplete="email" /></Field>
                <Field label="Topic"><select className="select" value={form.subject} onChange={set('subject')}>{SUBJECTS.map(s => <option key={s}>{s}</option>)}</select></Field>
                <Field label="Order number" optional hint="Looks like NC-261104-4821"><input className="input" value={form.orderNumber} onChange={set('orderNumber')} /></Field>
                <Field label="Message" error={errors.message} className="span-2"><textarea className="textarea" rows={6} value={form.message} onChange={set('message')} /></Field>
              </div>
              <button type="submit" className="btn btn-primary btn-lg" disabled={status === 'sending'}>
                {status === 'sending' && <span className="spinner" aria-hidden="true" />}Send message
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
