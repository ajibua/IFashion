import { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  Scissors,
  Calendar,
  Truck,
  MapPin,
  Phone,
  Ruler,
  MessageCircle,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';

function renderFormattedText(text) {
  if (!text) return null;

  const lines = text.split('\n');

  return lines.map((line, lIdx) => {
    const isBullet = /^\s*[\*\-]\s+/.test(line);
    const cleanLine = isBullet ? line.replace(/^\s*[\*\-]\s+/, '') : line;

    const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
    const renderedParts = parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return <strong key={pIdx}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    return (
      <span key={lIdx} style={{ display: 'block', marginBottom: isBullet ? '4px' : '6px', paddingLeft: isBullet ? '12px' : '0' }}>
        {isBullet && <span style={{ marginRight: '6px' }}>•</span>}
        {renderedParts}
      </span>
    );
  });
}

export default function ChatWidget({ open, onClose, initialPrompt = '', currentDesigner = null }) {
  const brandName = currentDesigner?.brand_name || 'IFashion';
  const defaultIntro = `Hello and welcome to ${brandName}! What would you like to get sewn? Tell me the style you want (like Agbada, Senator suit, or Kaftan), what color you like, when you need it, and if you want to pick it up or have it delivered to your house.`;

  const [messages, setMessages] = useState([{ role: 'assistant', content: defaultIntro }]);
  const [input, setInput] = useState('');
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [lastExtracted, setLastExtracted] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: `Hello and welcome to ${brandName}! What would you like to get sewn? Tell me the style you want (like Agbada, Senator suit, or Kaftan), what color you like, when you need it, and if you want to pick it up or have it delivered to your house.`,
      },
    ]);
    setOrderConfirmed(false);
    setLastExtracted(null);
  }, [brandName]);

  useEffect(() => {
    if (initialPrompt && open) {
      setInput(initialPrompt);
    }
  }, [initialPrompt, open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open, lastExtracted]);

  if (!open) return null;

  async function handleSend(textToSend) {
    const text = (textToSend || input).trim();
    if (!text || sending) return;

    const nextMessages = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setSending(true);

    // If user sent a phone number embedded
    let currentPhone = phone;
    const phoneMatch = text.match(/\b(?:\+?\d{1,4}[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4,6}\b/);
    if (!currentPhone && phoneMatch) {
      currentPhone = phoneMatch[0].replace(/\s+/g, '');
      setPhone(currentPhone);
    }

    try {
      const res = await fetch(`${API_BASE}/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: currentPhone || null,
          designer_handle: currentDesigner?.handle || null,
          designer_id: currentDesigner?.id || null,
          messages: nextMessages,
        }),
      });
      const data = await res.json();

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);

      if (data.extracted) {
        setLastExtracted(data.extracted);
        if (data.extracted.phone && !currentPhone) {
          setPhone(data.extracted.phone);
        }
      }

      if (data.order_ready) {
        setOrderConfirmed(true);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "I couldn't connect to our ordering concierge just now. Please ensure the backend server is running.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const designerPhoneClean = currentDesigner?.phone
    ? currentDesigner.phone.replace(/[^\d]/g, '')
    : '';

  const waSummary = lastExtracted
    ? encodeURIComponent(
      `Hello ${brandName}, I just placed a custom clothes order on IFashion!\n` +
      `Style: ${lastExtracted.style || 'Custom Outfit'}\n` +
      `Color: ${lastExtracted.color || 'Custom'}\n` +
      `Deadline: ${lastExtracted.deadline || 'Soon'}\n` +
      `Fulfillment: ${lastExtracted.delivery_method === 'delivery' ? 'Courier Dispatch' : 'Pick Up at Shop'}`
    )
    : '';

  return (
    <div className="chat-overlay" role="dialog" aria-modal="true" aria-label={`Order chat with ${brandName}`}>
      <div className="chat-overlay__backdrop" onClick={onClose} />
      <div className="chat-panel glass-strong">
        {/* Chat Header */}
        <div className="chat-panel__header">
          <div className="chat-panel__brand">
            <span className="chat-panel__sparkle">✦</span>
            <div>
              <h3>{brandName}</h3>
              <span className="chat-panel__status">
                <span className="status-dot" /> AI Tailor Assistant • Online
              </span>
            </div>
          </div>
          <button className="chat-panel__close" onClick={onClose} aria-label="Close chat">
            <X size={18} />
          </button>
        </div>

        {/* Messages Body */}
        <div className="chat-panel__messages" ref={scrollRef}>
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`chat-msg ${m.role === 'user' ? 'chat-msg--user' : 'chat-msg--assistant'}`}
            >
              <div className="chat-msg__bubble">
                <div className="chat-msg__text">{renderFormattedText(m.content)}</div>
              </div>
            </div>
          ))}

          {sending && (
            <div className="chat-msg chat-msg--assistant">
              <div className="chat-msg__bubble typing-indicator">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}

          {/* Verified Order Confirmation Card */}
          {orderConfirmed && lastExtracted && (
            <div className="order-confirmed-banner glass">
              <div className="order-confirmed-banner__head">
                <CheckCircle2 size={24} className="text-gold" />
                <div>
                  <h4>Order Confirmed!</h4>
                  <p className="text-muted">
                    Your order details have been saved and sent to {brandName} on WhatsApp.
                  </p>
                </div>
              </div>

              <div className="order-summary-grid">
                {lastExtracted.style && (
                  <div className="summary-item">
                    <span className="summary-label">Style</span>
                    <span className="summary-val">{lastExtracted.style}</span>
                  </div>
                )}
                {lastExtracted.color && (
                  <div className="summary-item">
                    <span className="summary-label">Color / Fabric</span>
                    <span className="summary-val">{lastExtracted.color}</span>
                  </div>
                )}
                {lastExtracted.deadline && (
                  <div className="summary-item">
                    <span className="summary-label">Date Needed</span>
                    <span className="summary-val text-gold">{lastExtracted.deadline}</span>
                  </div>
                )}
                <div className="summary-item">
                  <span className="summary-label">How You Get It</span>
                  <span className="summary-val">
                    {lastExtracted.delivery_method === 'delivery' ? (
                      <>🛵 Bike Delivery to: {lastExtracted.delivery_address || 'Your Address'}</>
                    ) : (
                      <>🏃 Pick up at the shop ({currentDesigner?.location || 'Tailor Shop'})</>
                    )}
                  </span>
                </div>
              </div>

              {designerPhoneClean && (
                <div className="order-wa-action">
                  <a
                    href={`https://wa.me/${designerPhoneClean}?text=${waSummary}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn--gold btn--small"
                  >
                    <MessageCircle size={15} /> Chat with {brandName} on WhatsApp
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Style Chips */}
        {!orderConfirmed && (
          <div className="chat-panel__chips">
            <button
              className="chip"
              onClick={() => handleSend('I want to sew a Royal Agbada for an event')}
            >
              Royal Agbada
            </button>
            <button
              className="chip"
              onClick={() => handleSend('I want a sharp Senator suit')}
            >
              Senator Suit
            </button>
            <button
              className="chip"
              onClick={() => handleSend('I want a clean Kaftan')}
            >
              Native Kaftan
            </button>
            <button
              className="chip"
              onClick={() => handleSend('I prefer dispatch rider delivery')}
            >
              Bike Delivery
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="chat-panel__input-bar">
          <input
            type="text"
            placeholder={
              orderConfirmed
                ? 'Order confirmed. Feel free to ask any other questions...'
                : 'Describe your style, measurements, deadline, or delivery preference...'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
          />
          <button
            className="btn btn--gold btn--small"
            onClick={() => handleSend()}
            disabled={!input.trim() || sending}
            aria-label="Send message"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
