import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { imageUrl } from '../../lib/assets';
import { formatDate, formatPrice, STATUS_LABELS } from '../../lib/format';
import './assistant.css';

const STORE_KEY = 'novacart_chat';
const MAX_KEPT = 40;
const START_REPLIES = ['Track my order', "This week's picks", 'Show me deals', 'Delivery times'];

const greeting = (name) => ({
  id: 'hello',
  from: 'bot',
  text: `${name ? `Hi ${name}. ` : 'Hi. '}I can find products, add them to your basket, and track or cancel orders. Try "2 kg aloo" or "fruit under 400".`,
  quickReplies: START_REPLIES
});

const load = () => { try { return JSON.parse(sessionStorage.getItem(STORE_KEY)) || null; } catch { return null; } };
const save = (msgs) => { try { sessionStorage.setItem(STORE_KEY, JSON.stringify(msgs.slice(-MAX_KEPT))); } catch { /* storage unavailable */ } };

let nextId = 1;
const uid = () => `${Date.now().toString(36)}-${nextId++}`;

function ProductChip({ product }) {
  const { getQty, addToCart, updateQty } = useCart();
  const qty = getQty(product._id);
  const soldOut = product.stock <= 0;
  return (
    <div className="nc-chat-product">
      <Link to={`/product/${product.slug}`} className="nc-chat-product-img">
        <img src={imageUrl(product.image)} alt="" width="64" height="64" loading="lazy" />
      </Link>
      <div className="nc-chat-product-info">
        <Link to={`/product/${product.slug}`} className="nc-chat-product-name">{product.name}</Link>
        <span className="nc-chat-product-meta">{product.unit}</span>
        <span className="nc-chat-product-price">
          {formatPrice(product.price)}
          {product.compareAtPrice > product.price && <s>{formatPrice(product.compareAtPrice)}</s>}
        </span>
      </div>
      {soldOut ? (
        <span className="nc-chat-soldout">Sold out</span>
      ) : qty > 0 ? (
        <div className="nc-chat-qty" role="group" aria-label={`Quantity of ${product.name}`}>
          <button type="button" onClick={() => updateQty(product._id, qty - 1)} aria-label={`One less ${product.name}`}><i className={`fa-solid ${qty === 1 ? 'fa-trash-can' : 'fa-minus'}`} aria-hidden="true" /></button>
          <output>{qty}</output>
          <button type="button" onClick={() => updateQty(product._id, qty + 1)} disabled={qty >= product.stock} aria-label={`One more ${product.name}`}><i className="fa-solid fa-plus" aria-hidden="true" /></button>
        </div>
      ) : (
        <button type="button" className="nc-chat-add" onClick={() => addToCart(product, 1, { silent: true })} aria-label={`Add ${product.name} to basket`}>
          <i className="fa-solid fa-plus" aria-hidden="true" /> Add
        </button>
      )}
    </div>
  );
}

function OrderChip({ order }) {
  return (
    <Link to={`/orders/${order._id}`} className="nc-chat-order">
      <div className="nc-chat-order-thumbs" aria-hidden="true">
        {order.images.filter(Boolean).slice(0, 3).map((src, i) => <img key={i} src={imageUrl(src)} alt="" />)}
      </div>
      <div className="nc-chat-order-info">
        <strong>{order.orderNumber}</strong>
        <span>{formatDate(order.createdAt, { day: 'numeric', month: 'short' })} · {order.itemCount} items · {formatPrice(order.total)}</span>
      </div>
      <span className={`status status-${order.status}`}>{STATUS_LABELS[order.status]}</span>
    </Link>
  );
}

function BotMessage({ msg, isLast, onQuick, onConfirm, onNavigate, busy }) {
  return (
    <div className="nc-chat-row is-bot">
      <span className="nc-chat-avatar" aria-hidden="true">
        <svg viewBox="0 0 32 32" width="16" height="16"><path d="M8 24c0-8.8 5.8-15 15.6-15.6-.4 9.9-6.7 15.6-15.6 15.6Z" fill="currentColor" /></svg>
      </span>
      <div className="nc-chat-bot-body">
        <p className={`nc-chat-bubble${msg.error ? ' is-error' : ''}`}>{msg.text}</p>

        {msg.products?.length > 0 && (
          <div className="nc-chat-products">
            {msg.products.map(p => <ProductChip key={p._id} product={p} />)}
          </div>
        )}
        {msg.orders?.length > 0 && (
          <div className="nc-chat-orders">
            {msg.orders.map(o => <OrderChip key={o._id} order={o} />)}
          </div>
        )}
        {msg.confirm && !msg.confirmDone && (
          <div className="nc-chat-confirm">
            <button type="button" className="btn btn-danger btn-sm" onClick={() => onConfirm(msg)} disabled={busy}>{msg.confirm.label}</button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => onQuick('Keep my order')} disabled={busy}>Keep it</button>
          </div>
        )}
        {(msg.links?.length > 0 || msg.showBasket) && (
          <div className="nc-chat-links">
            {msg.showBasket && <button type="button" className="nc-chat-link" onClick={() => onNavigate('basket')}>View basket <i className="fa-solid fa-basket-shopping" aria-hidden="true" /></button>}
            {msg.links?.map(l => (
              <button key={l.to} type="button" className="nc-chat-link" onClick={() => onNavigate(l.to)}>
                {l.label} <i className="fa-solid fa-arrow-right" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
        {isLast && msg.quickReplies?.length > 0 && (
          <div className="nc-chat-quick">
            {msg.quickReplies.map(q => <button key={q} type="button" className="chip" onClick={() => onQuick(q)} disabled={busy}>{q}</button>)}
          </div>
        )}
      </div>
    </div>
  );
}

/** Floating shopping assistant. Works for guests (search, basket) and signed-in shoppers (orders). */
export default function ChatWidget() {
  const { user } = useAuth();
  const cart = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => load() || [greeting()]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [unread, setUnread] = useState(false);
  const logRef = useRef(null);
  const inputRef = useRef(null);
  const panelRef = useRef(null);
  const launcherRef = useRef(null);

  useEffect(() => { save(messages); }, [messages]);

  // Keep the newest message in view
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy, open]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus({ preventScroll: true });
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); launcherRef.current?.focus(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const push = (msg) => setMessages(m => [...m, { id: uid(), ...msg }]);

  const runActions = async (reply) => {
    let showBasket = false;
    for (const a of reply.actions || []) {
      if (a.type === 'add_to_cart') {
        const product = reply.products?.find(p => p._id === a.productId);
        if (product) await cart.addToCart(product, a.quantity || 1, { silent: true });
      } else if (a.type === 'remove_from_cart') {
        await cart.removeFromCart(a.productId);
      } else if (a.type === 'open_cart') {
        showBasket = true;
      }
    }
    return showBasket;
  };

  const send = async (text) => {
    const message = text.trim();
    if (!message || busy) return;
    setInput('');
    push({ from: 'user', text: message });
    setBusy(true);
    try {
      const reply = await api('/assistant', {
        method: 'POST',
        body: {
          message,
          cart: cart.items.map(i => ({ productId: i.product._id, name: i.product.name, price: i.product.price, quantity: i.quantity }))
        }
      });
      const showBasket = await runActions(reply);
      push({ from: 'bot', text: reply.reply, products: reply.products, orders: reply.orders, links: reply.links, confirm: reply.confirm, quickReplies: reply.quickReplies, showBasket });
      if (!open) setUnread(true);
    } catch (err) {
      push({ from: 'bot', error: true, text: err.status ? err.message : 'I could not reach the store just now. Check your connection and try again.', quickReplies: [message] });
    } finally {
      setBusy(false);
    }
  };

  const confirmAction = async (msg) => {
    if (msg.confirm.type !== 'cancel_order') return;
    setBusy(true);
    try {
      const order = await api(`/orders/${msg.confirm.orderId}/cancel`, { method: 'PUT' });
      setMessages(m => m.map(x => (x.id === msg.id ? { ...x, confirmDone: true } : x)));
      push({ from: 'bot', text: `Done. ${order.orderNumber} is cancelled and nothing will be charged.`, quickReplies: ['Track my order', "This week's picks"] });
      toast.success(`Order ${order.orderNumber} cancelled`);
    } catch (err) {
      push({ from: 'bot', error: true, text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const go = (to) => {
    if (to === 'basket') cart.openCart();
    else navigate(to);
    if (window.matchMedia('(max-width: 560px)').matches || to === 'basket') setOpen(false);
  };

  const reset = () => setMessages([greeting(user?.name?.split(' ')[0])]);

  const lastBot = [...messages].reverse().find(m => m.from === 'bot');

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        className={`nc-chat-launcher${open ? ' is-open' : ''}`}
        onClick={() => { setOpen(o => !o); setUnread(false); }}
        aria-expanded={open}
        aria-controls="nc-chat-panel"
        aria-label={open ? 'Close shopping assistant' : 'Open shopping assistant'}
      >
        <i className={`fa-solid ${open ? 'fa-xmark' : 'fa-comment-dots'}`} aria-hidden="true" />
        {!open && <span className="nc-chat-launcher-label">Ask NovaCart</span>}
        {unread && !open && <span className="nc-chat-unread" aria-hidden="true" />}
      </button>

      {open && (
        <section ref={panelRef} id="nc-chat-panel" className="nc-chat" role="dialog" aria-label="Shopping assistant">
          <header className="nc-chat-head">
            <span className="nc-chat-avatar is-lg" aria-hidden="true">
              <svg viewBox="0 0 32 32" width="18" height="18"><path d="M8 24c0-8.8 5.8-15 15.6-15.6-.4 9.9-6.7 15.6-15.6 15.6Z" fill="currentColor" /></svg>
            </span>
            <div className="nc-chat-title">
              <h2>NovaCart assistant</h2>
              <p><span className="nc-chat-live" aria-hidden="true" /> Live prices and stock{user ? ' · your orders' : ''}</p>
            </div>
            <button type="button" className="icon-btn" onClick={reset} aria-label="Start a new conversation" title="New conversation">
              <i className="fa-solid fa-rotate-left" aria-hidden="true" />
            </button>
            <button type="button" className="icon-btn" onClick={() => { setOpen(false); launcherRef.current?.focus(); }} aria-label="Close assistant">
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          </header>

          <div className="nc-chat-log" ref={logRef} role="log" aria-live="polite" aria-relevant="additions">
            {messages.map(m => (m.from === 'user'
              ? <div key={m.id} className="nc-chat-row is-user"><p className="nc-chat-bubble">{m.text}</p></div>
              : <BotMessage key={m.id} msg={m} isLast={m === lastBot && !busy} busy={busy} onQuick={send} onConfirm={confirmAction} onNavigate={go} />
            ))}
            {busy && (
              <div className="nc-chat-row is-bot">
                <span className="nc-chat-avatar" aria-hidden="true" />
                <p className="nc-chat-bubble nc-chat-typing" aria-label="Assistant is typing"><span /><span /><span /></p>
              </div>
            )}
          </div>

          <form className="nc-chat-input" onSubmit={e => { e.preventDefault(); send(input); }}>
            <label htmlFor="nc-chat-text" className="visually-hidden">Message the assistant</label>
            <input
              id="nc-chat-text"
              ref={inputRef}
              className="input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={user ? 'Ask about products or your orders' : 'Search, add to basket, ask anything'}
              autoComplete="off"
              maxLength={300}
            />
            <button type="submit" className="nc-chat-send" disabled={!input.trim() || busy} aria-label="Send">
              <i className="fa-solid fa-arrow-up" aria-hidden="true" />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
