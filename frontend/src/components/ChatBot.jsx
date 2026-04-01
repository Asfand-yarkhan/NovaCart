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
const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const getCategoryEmoji = (category = '') => {
  const cat = category.toLowerCase();
  if (cat.includes('fruit')) return '🍎';
  if (cat.includes('vegetable') || cat.includes('veggie')) return '🥦';
  if (cat.includes('dairy')) return '🥛';
  if (cat.includes('bakery') || cat.includes('bread')) return '🍞';
  if (cat.includes('meat') || cat.includes('chicken')) return '🍗';
  if (cat.includes('beverage') || cat.includes('drink')) return '🥤';
  if (cat.includes('snack')) return '🍿';
  if (cat.includes('grocery')) return '🛒';
  return '🛍️';
};

const WELCOME_SUGGESTIONS = [
  '🔍 Search Products',
  '📦 Track My Order',
  '🚚 Shipping Info',
  '🔄 Return Policy',
  '💳 Payment Methods',
  '🌟 Recommendations'
];

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
      <div
        className="nc-product-img-placeholder"
        style={{ display: product.image ? 'none' : 'flex' }}
      >
        {getCategoryEmoji(product.category)}
      </div>

      <div className="nc-product-body">
        <div className="nc-product-name" title={product.name}>{product.name}</div>
        <div className="nc-product-cat">{product.category}</div>
        <div className="nc-product-price">₨{product.price?.toLocaleString()}</div>
        {product.stock === 0 ? (
          <div className="nc-out-stock">Out of Stock</div>
        ) : (
          <button
            className={`nc-add-btn ${added ? 'nc-added' : ''}`}
            onClick={handleAdd}
            disabled={product.stock === 0}
          >
            {added ? '✓ Added!' : '+ Add to Cart'}
          </button>
        )}
      </div>
    </div>
  );
};

// ── Chat Message ──────────────────────────────────────────────────────────
const ChatMessage = ({ msg, onAddToCart, onQuickReply, onNavigate }) => {
  const isUser = msg.role === 'user';

  return (
    <div className={`nc-msg ${isUser ? 'nc-user' : 'nc-bot'}`}>
      <div className={`nc-msg-avatar ${isUser ? 'nc-user-av' : ''}`}>
        {isUser ? '👤' : '🤖'}
      </div>
      <div className="nc-msg-content">
        {/* Main bubble */}
        <div
          className="nc-bubble"
          dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.text) }}
        />

        {/* Product grid */}
        {msg.products?.length > 0 && (
          <div className="nc-product-grid">
            {msg.products.map(p => (
              <ProductCard key={p._id} product={p} onAdd={onAddToCart} />
            ))}
          </div>
        )}

        {/* Navigation action button */}
        {msg.action?.type === 'navigate' && msg.action.label && (
          <button className="nc-nav-btn" onClick={() => onNavigate(msg.action.url)}>
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
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [unreadCount, setUnreadCount] = useState(1); // initial greeting counts

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const suggestionsTimeout = useRef(null);

  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  // Append a bot message
  const appendBotMessage = useCallback((data) => {
    const msg = {
      id: Date.now(),
      role: 'bot',
      text: data.text || '',
      products: data.products || [],
      quickReplies: data.quickReplies || [],
      action: data.action || null,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, msg]);
    scrollToBottom();
  }, [scrollToBottom]);

  // Initial greeting on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setShowWelcome(false);
      setTimeout(() => {
        appendBotMessage({
          text: `👋 Hi${user ? ` **${user.name}**` : ''}! Welcome to **NovaCart** — your freshest grocery experience!\n\nI'm **Nova**, your AI shopping assistant. How can I help you today?`,
          quickReplies: ['🔍 Search Products', '📦 Track My Order', '🚚 Shipping Info', '🌟 Trending']
        });
        setUnreadCount(0);
      }, 400);
    }
    if (isOpen) {
      setUnreadCount(0);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Handle close with animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 250);
  };

  // Core: send message
  const handleSend = useCallback(async (text) => {
    const msgText = (text || input).trim();
    if (!msgText || isTyping) return;

    setSuggestions([]);
    setInput('');
    setShowWelcome(false);

    // Add user message
    setMessages(prev => [...prev, {
      id: Date.now(),
      role: 'user',
      text: msgText,
      timestamp: new Date()
    }]);
    scrollToBottom();

    setIsTyping(true);

    // Simulated delay for realism
    await new Promise(r => setTimeout(r, 600 + Math.random() * 600));

    const response = await sendMessage(msgText);
    setIsTyping(false);
    appendBotMessage(response);

    if (!isOpen) {
      setUnreadCount(prev => prev + 1);
    }

    // Handle close intent
    if (response.closeChat) {
      setTimeout(() => handleClose(), 1800);
    }
  }, [input, isTyping, isOpen, appendBotMessage, scrollToBottom]);

  // Quick reply clicks
  const handleQuickReply = useCallback((text) => {
    // Strip emoji prefix if present
    const clean = text.replace(/^[\u{1F300}-\u{1FFFF}]\s*/u, '').trim();
    handleSend(clean);
  }, [handleSend]);

  // Navigate inside chat
  const handleNavigate = useCallback((url) => {
    navigate(url);
    handleClose();
  }, [navigate]);

  // Add to cart from chatbot
  const handleAddToCart = useCallback((product) => {
    addToCart(product, 1);
    appendBotMessage({
      text: `✅ **${product.name}** added to your cart!\n\nQuantity: 1 × ₨${product.price?.toLocaleString()}\n\nContinue shopping or proceed to checkout.`,
      quickReplies: ['Go to cart', 'Continue shopping'],
      action: { type: 'navigate', url: '/cart', label: '🛒 View Cart' }
    });
  }, [addToCart, appendBotMessage]);

  // Autocomplete
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      setSuggestions([]);
    }
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

          {/* Messages or Welcome */}
          <div className="nc-messages" id="nc-messages-container">
            {showWelcome && messages.length === 0 ? (
              <div className="nc-welcome">
                <div className="nc-welcome-emoji">🤖</div>
                <h3>Hi, I'm Nova!</h3>
                <p>Your AI shopping assistant for NovaCart. Ask me anything about products, orders, shipping, or tips!</p>
                <div className="nc-welcome-chips">
                  {WELCOME_SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      className="nc-welcome-chip"
                      onClick={() => handleQuickReply(s)}
                    >
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
                    onQuickReply={handleQuickReply}
                    onNavigate={handleNavigate}
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
                  <div
                    key={i}
                    className="nc-suggestion-item"
                    onClick={() => handleSuggestionClick(s)}
                  >
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
                placeholder='Ask me anything... "show me fruits under ₨500"'
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
            <div className="nc-input-hint">
              Powered by Nova AI · NovaCart
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
