import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { sendMessage, fetchSuggestions, parseMarkdown } from '../utils/ChatAgent';
import './ChatBot.css';

// ── Icons ─────────────────────────────────────────────────────────────────
const BotIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" y1="16" x2="8" y2="16" strokeWidth="3" strokeLinecap="round" />
    <line x1="12" y1="16" x2="12" y2="16" strokeWidth="3" strokeLinecap="round" />
    <line x1="16" y1="16" x2="16" y2="16" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const MinimizeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────
const formatTime = (date) =>
  new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

const getCategoryEmoji = (category = '') => {
  const cat = category.toLowerCase();
  if (cat.includes('fruit'))                       return '🍎';
  if (cat.includes('vegetable') || cat.includes('veggie')) return '🥦';
  if (cat.includes('dairy'))                       return '🥛';
  if (cat.includes('bakery') || cat.includes('bread')) return '🍞';
  if (cat.includes('meat') || cat.includes('chicken')) return '🍗';
  if (cat.includes('beverage') || cat.includes('drink')) return '🥤';
  if (cat.includes('snack'))                       return '🍿';
  if (cat.includes('grocery'))                     return '🛒';
  return '🛍️';
};

const WELCOME_SUGGESTIONS = [
  '🔍 Search Products',
  '📦 Track My Order',
  '🎟️ Apply Coupon',
  '🚚 Shipping Info',
  '🔄 Return Policy',
  '🌟 Recommendations',
];

// Abandoned cart threshold — 10 minutes
const ABANDONED_THRESHOLD_MS = 10 * 60 * 1000;

// ── Product Card ──────────────────────────────────────────────────────────
const ProductCard = ({ product, onAdd }) => {
  const [added, setAdded] = useState(false);
  const API_BASE = 'http://localhost:5000';

  const handleAdd = () => {
    onAdd(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="nc-product-card">
      {product.image ? (
        <img
          className="nc-product-img"
          src={product.image.startsWith('http') ? product.image : `${API_BASE}/${product.image}`}
          alt={product.name}
          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
        />
      ) : null}
      <div className="nc-product-img-placeholder" style={{ display: product.image ? 'none' : 'flex' }}>
        {getCategoryEmoji(product.category)}
      </div>
      <div className="nc-product-body">
        <div className="nc-product-name" title={product.name}>{product.name}</div>
        <div className="nc-product-cat">{product.category}</div>
        <div className="nc-product-price">₨{product.price?.toLocaleString()}</div>
        {product.stock === 0 ? (
          <div className="nc-out-stock">Out of Stock</div>
        ) : (
          <button className={`nc-add-btn ${added ? 'nc-added' : ''}`} onClick={handleAdd} disabled={product.stock === 0}>
            {added ? '✓ Added!' : '+ Add to Cart'}
          </button>
        )}
      </div>
    </div>
  );
};

// ── Remove Item Card ──────────────────────────────────────────────────────
const RemoveItemCard = ({ item, onConfirm, onCancel }) => (
  <div className="nc-remove-card">
    <div className="nc-remove-card-info">
      <span className="nc-remove-icon">🗑️</span>
      <div>
        <div className="nc-remove-name">{item.name}</div>
        <div className="nc-remove-meta">₨{item.price?.toLocaleString()} × {item.quantity}</div>
      </div>
    </div>
    <div className="nc-remove-actions">
      <button className="nc-remove-confirm-btn" onClick={() => onConfirm(item.productId)}>
        Remove
      </button>
      <button className="nc-remove-cancel-btn" onClick={onCancel}>
        Keep
      </button>
    </div>
  </div>
);

// ── Multi-Remove Card (multiple matches) ──────────────────────────────────
const MultiRemoveCard = ({ items, onConfirm }) => (
  <div className="nc-remove-multi">
    {items.map(item => (
      <div key={item.productId} className="nc-remove-multi-row">
        <span>{item.name}</span>
        <button className="nc-remove-confirm-btn" onClick={() => onConfirm(item.productId)}>
          Remove
        </button>
      </div>
    ))}
  </div>
);

// ── Coupon Apply Card ─────────────────────────────────────────────────────
const CouponCard = ({ couponData, onApply, applied }) => (
  <div className="nc-coupon-card">
    <div className="nc-coupon-header">
      <span className="nc-coupon-icon">🎟️</span>
      <div>
        <div className="nc-coupon-code">{couponData.code}</div>
        <div className="nc-coupon-desc">{couponData.description}</div>
      </div>
    </div>
    {!applied ? (
      <button className="nc-coupon-apply-btn" onClick={() => onApply(couponData)}>
        Apply to Cart
      </button>
    ) : (
      <div className="nc-coupon-applied">✅ Applied!</div>
    )}
  </div>
);

// ── Abandoned Cart Banner ─────────────────────────────────────────────────
const AbandonedCartBanner = ({ cartCount, cartTotal, onCheckout, onDismiss }) => (
  <div className="nc-abandoned-banner">
    <div className="nc-abandoned-icon">🛒</div>
    <div className="nc-abandoned-content">
      <div className="nc-abandoned-title">You left items in your cart!</div>
      <div className="nc-abandoned-sub">
        {cartCount} item{cartCount > 1 ? 's' : ''} · ₨{cartTotal.toLocaleString()}
      </div>
    </div>
    <div className="nc-abandoned-actions">
      <button className="nc-abandoned-checkout-btn" onClick={onCheckout}>
        Checkout →
      </button>
      <button className="nc-abandoned-dismiss-btn" onClick={onDismiss}>
        ✕
      </button>
    </div>
  </div>
);

// ── Chat Message ──────────────────────────────────────────────────────────
const ChatMessage = ({ msg, onAddToCart, onRemoveFromCart, onQuickReply, onNavigate, onApplyCoupon }) => {
  const isUser = msg.role === 'user';

  return (
    <div className={`nc-msg ${isUser ? 'nc-user' : 'nc-bot'}`}>
      <div className={`nc-msg-avatar ${isUser ? 'nc-user-av' : ''}`}>
        {isUser ? '👤' : '🤖'}
      </div>
      <div className="nc-msg-content">
        {/* Main bubble */}
        <div className="nc-bubble" dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.text) }} />

        {/* Product grid */}
        {msg.products?.length > 0 && (
          <div className="nc-product-grid">
            {msg.products.map(p => (
              <ProductCard key={p._id} product={p} onAdd={onAddToCart} />
            ))}
          </div>
        )}

        {/* Remove item confirmation */}
        {msg.removeItem && !msg.removeDone && (
          <RemoveItemCard
            item={msg.removeItem}
            onConfirm={(productId) => onRemoveFromCart(productId, msg.id)}
            onCancel={() => onQuickReply('Continue shopping')}
          />
        )}
        {msg.removeDone && (
          <div className="nc-remove-done">✅ Item removed from your cart!</div>
        )}

        {/* Multiple remove options */}
        {msg.removeItems?.length > 0 && !msg.removeDone && (
          <MultiRemoveCard
            items={msg.removeItems}
            onConfirm={(productId) => onRemoveFromCart(productId, msg.id)}
          />
        )}

        {/* Coupon card */}
        {msg.couponData && (
          <CouponCard
            couponData={msg.couponData}
            onApply={onApplyCoupon}
            applied={msg.couponApplied}
          />
        )}

        {/* Navigation action button */}
        {msg.action?.type === 'navigate' && msg.action.label && (
          <button className="nc-nav-btn" onClick={() => onNavigate(msg.action.url, msg.action.state)}>
            🔗 {msg.action.label}
          </button>
        )}

        {/* Quick reply chips */}
        {msg.quickReplies?.length > 0 && (
          <div className="nc-quick-replies">
            {msg.quickReplies.map((qr, i) => (
              <button key={i} className="nc-chip" onClick={() => onQuickReply(qr)}>
                {qr}
              </button>
            ))}
          </div>
        )}

        <span className="nc-msg-time">{formatTime(msg.timestamp)}</span>
      </div>
    </div>
  );
};

// ── Typing Indicator ──────────────────────────────────────────────────────
const TypingIndicator = () => (
  <div className="nc-typing">
    <div className="nc-msg-avatar">🤖</div>
    <div className="nc-typing-bubble">
      <div className="nc-dot" />
      <div className="nc-dot" />
      <div className="nc-dot" />
    </div>
  </div>
);

// ── Main ChatBot Component ────────────────────────────────────────────────
const ChatBot = () => {
  const [isOpen, setIsOpen]       = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [isTyping, setIsTyping]   = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [unreadCount, setUnreadCount] = useState(1);
  const [showAbandonedBanner, setShowAbandonedBanner] = useState(false);

  const messagesEndRef    = useRef(null);
  const inputRef          = useRef(null);
  const suggestionsTimeout = useRef(null);
  const abandonedShown    = useRef(false); // prevent repeat on same session open

  const navigate = useNavigate();
  const { addToCart, removeFromCart, applyDiscount, cartCount, cartTotal, lastCartActivity, chatCartItems } = useCart();
  const { user } = useAuth();

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  const appendBotMessage = useCallback((data) => {
    const msg = {
      id: Date.now() + Math.random(),
      role: 'bot',
      text:         data.text || '',
      products:     data.products || [],
      quickReplies: data.quickReplies || [],
      action:       data.action || null,
      removeItem:   data.removeItem || null,
      removeItems:  data.removeItems || null,
      couponData:   data.couponData || null,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, msg]);
    scrollToBottom();
  }, [scrollToBottom]);

  // ── Abandoned cart check on open ─────────────────────────────────
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setShowWelcome(false);
      setTimeout(() => {
        appendBotMessage({
          text: `👋 Hi${user ? ` **${user.name}**` : ''}! Welcome to **NovaCart** — your freshest grocery experience!\n\nI'm **Nova**, your AI shopping assistant. How can I help you today?`,
          quickReplies: ['🔍 Search Products', '📦 Track My Order', '🎟️ Apply Coupon', '🌟 Trending']
        });
        setUnreadCount(0);

        // Check for abandoned cart (after greeting delay)
        setTimeout(() => {
          if (!abandonedShown.current && cartCount > 0 && lastCartActivity) {
            const timeSince = Date.now() - lastCartActivity;
            if (timeSince >= ABANDONED_THRESHOLD_MS) {
              setShowAbandonedBanner(true);
              abandonedShown.current = true;
            }
          }
        }, 1000);
      }, 400);
    }
    if (isOpen) {
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => { setIsOpen(false); setIsClosing(false); }, 250);
  };

  // ── Core: send message ────────────────────────────────────────────
  const handleSend = useCallback(async (text) => {
    const msgText = (text || input).trim();
    if (!msgText || isTyping) return;

    setSuggestions([]);
    setInput('');
    setShowWelcome(false);
    setShowAbandonedBanner(false);

    setMessages(prev => [...prev, {
      id: Date.now(),
      role: 'user',
      text: msgText,
      timestamp: new Date()
    }]);
    scrollToBottom();
    setIsTyping(true);

    await new Promise(r => setTimeout(r, 600 + Math.random() * 500));

    const response = await sendMessage(msgText, [], chatCartItems);
    setIsTyping(false);
    appendBotMessage(response);

    if (!isOpen) setUnreadCount(prev => prev + 1);
    if (response.closeChat) setTimeout(() => handleClose(), 1800);
  }, [input, isTyping, isOpen, appendBotMessage, scrollToBottom, chatCartItems]);

  const handleQuickReply = useCallback((text) => {
    // Strip emoji prefix
    const clean = text.replace(/^[\u{1F300}-\u{1FFFF}]\s*/u, '').trim();
    handleSend(clean);
  }, [handleSend]);

  const handleNavigate = useCallback((url, state) => {
    navigate(url, { state });
    handleClose();
  }, [navigate]);

  // ── Add to cart ────────────────────────────────────────────────────
  const handleAddToCart = useCallback((product) => {
    if (!user) {
      localStorage.setItem('pendingCartItem', JSON.stringify(product));
      appendBotMessage({
        text: `🔒 First login to add **${product.name}** to your cart.\n\nAfter logging in, it will be automatically added!`,
        quickReplies: ['Continue shopping'],
        action: { type: 'navigate', url: '/login', state: { from: { pathname: '/cart' } }, label: '🔑 Go to Login' }
      });
      return;
    }
    addToCart(product, 1);
    appendBotMessage({
      text: `✅ **${product.name}** added to your cart!\n\nQuantity: 1 × ₨${product.price?.toLocaleString()}\n\nContinue shopping or proceed to checkout.`,
      quickReplies: ['Go to cart', 'Continue shopping', 'Apply coupon'],
      action: { type: 'navigate', url: '/cart', label: '🛒 View Cart' }
    });
  }, [addToCart, appendBotMessage, user]);

  // ── Remove from cart (inline confirm) ────────────────────────────
  const handleRemoveFromCart = useCallback(async (productId, msgId) => {
    await removeFromCart(productId);
    // Mark the message as done so buttons disappear
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, removeDone: true, removeItem: null, removeItems: null } : m
    ));
    appendBotMessage({
      text: `✅ Item removed from your cart!\n\nAnything else you'd like to do?`,
      quickReplies: ['View cart', 'Continue shopping', 'Apply coupon'],
      action: { type: 'navigate', url: '/cart', label: '🛒 View Cart' }
    });
  }, [removeFromCart, appendBotMessage]);

  // ── Apply coupon from chat ─────────────────────────────────────────
  const handleApplyCoupon = useCallback(async (couponData) => {
    applyDiscount(couponData);
    // Mark the coupon card as applied in the message
    setMessages(prev => prev.map(m =>
      m.couponData?.code === couponData.code ? { ...m, couponApplied: true } : m
    ));
    appendBotMessage({
      text: `🎉 Coupon **${couponData.code}** applied to your cart!\n\nYour discount will be reflected at checkout. Ready to order?`,
      quickReplies: ['Go to checkout', 'Continue shopping'],
      action: { type: 'navigate', url: '/checkout', label: '🛍️ Checkout Now' }
    });
  }, [applyDiscount, appendBotMessage]);

  // ── Autocomplete ──────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    clearTimeout(suggestionsTimeout.current);
    if (val.length >= 2) {
      suggestionsTimeout.current = setTimeout(async () => {
        const results = await fetchSuggestions(val);
        setSuggestions(results);
      }, 300);
    } else {
      setSuggestions([]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === 'Escape') setSuggestions([]);
  };

  const handleSuggestionClick = (s) => {
    setSuggestions([]);
    handleSend(s.text);
  };

  return (
    <>
      {/* Floating Trigger */}
      <button
        id="nc-chatbot-trigger"
        className={`nc-chat-trigger ${isOpen ? 'nc-open' : ''}`}
        onClick={() => isOpen ? handleClose() : setIsOpen(true)}
        aria-label="Open Nova AI Chat Assistant"
        title="Chat with Nova"
      >
        {isOpen ? <CloseIcon /> : <BotIcon />}
        {!isOpen && unreadCount > 0 && (
          <span className="nc-badge">{unreadCount}</span>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className={`nc-chat-panel ${isClosing ? 'nc-closing' : ''}`} role="dialog" aria-label="Nova AI Chat">
          {/* Header */}
          <div className="nc-chat-header">
            <div className="nc-bot-avatar">🤖</div>
            <div className="nc-chat-header-info">
              <h4>Nova — AI Assistant</h4>
              <div className="nc-chat-status">
                <span className="nc-status-dot" />
                Online · NovaCart Support
              </div>
            </div>
            <button className="nc-chat-header-btn" onClick={handleClose} title="Minimize" aria-label="Minimize chat">
              <MinimizeIcon />
            </button>
          </div>

          {/* Abandoned Cart Banner */}
          {showAbandonedBanner && (
            <AbandonedCartBanner
              cartCount={cartCount}
              cartTotal={cartTotal}
              onCheckout={() => { handleNavigate('/cart'); }}
              onDismiss={() => setShowAbandonedBanner(false)}
            />
          )}

          {/* Messages or Welcome */}
          <div className="nc-messages" id="nc-messages-container">
            {showWelcome && messages.length === 0 ? (
              <div className="nc-welcome">
                <div className="nc-welcome-emoji">🤖</div>
                <h3>Hi, I'm Nova!</h3>
                <p>Your AI shopping assistant for NovaCart. Ask me anything about products, orders, shipping, or tips!</p>
                <div className="nc-welcome-chips">
                  {WELCOME_SUGGESTIONS.map((s, i) => (
                    <button key={i} className="nc-welcome-chip" onClick={() => handleQuickReply(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map(msg => (
                  <ChatMessage
                    key={msg.id}
                    msg={msg}
                    onAddToCart={handleAddToCart}
                    onRemoveFromCart={handleRemoveFromCart}
                    onQuickReply={handleQuickReply}
                    onNavigate={handleNavigate}
                    onApplyCoupon={handleApplyCoupon}
                  />
                ))}
                {isTyping && <TypingIndicator />}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="nc-input-area">
            {/* Autocomplete */}
            {suggestions.length > 0 && (
              <div className="nc-suggestions">
                {suggestions.map((s, i) => (
                  <div key={i} className="nc-suggestion-item" onClick={() => handleSuggestionClick(s)}>
                    <span className="nc-suggestion-icon">
                      {s.type === 'product' ? getCategoryEmoji(s.category) : '⚡'}
                    </span>
                    <span className="nc-suggestion-text">{s.text}</span>
                    {s.category && <span className="nc-suggestion-cat">{s.category}</span>}
                  </div>
                ))}
              </div>
            )}

            <div className="nc-input-row">
              <textarea
                ref={inputRef}
                id="nc-chat-input"
                className="nc-input"
                placeholder='Ask Nova... "remove milk" · "apply WELCOME10" · "show fruits"'
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                rows={1}
                aria-label="Chat message input"
              />
              <button
                id="nc-send-btn"
                className="nc-send-btn"
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                aria-label="Send message"
              >
                <SendIcon />
              </button>
            </div>
            <div className="nc-input-hint">Powered by Nova AI · NovaCart</div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
