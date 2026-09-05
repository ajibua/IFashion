import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Ruler,
  CheckCircle2,
  Star,
  Clock,
  Store,
  MapPin,
  Phone,
  Truck,
  ExternalLink,
  Share2,
  User,
  Scissors,
  Check,
  ChevronDown,
} from 'lucide-react';
import TapeDivider from './components/TapeDivider';
import ChatWidget from './components/ChatWidget';
import AdminModal from './components/AdminModal';
import AuthModal from './components/AuthModal';
import MeasurementPreview from './components/MeasurementPreview';
import './App.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';

const GARMENTS = [
  'BESPOKE AGBADA',
  'SENATOR SUITS',
  'ROYAL KAFTAN',
  'WIDE-LEG TROUSERS',
  'TAILORED ANKARA',
  'OWAMBE NATIVE WEAR',
  'CASUAL BESPOKE',
];

const CATEGORIES = ['All Styles', 'Agbada', 'Senator Suits', 'Kaftan', 'Trousers', 'Ankara'];

const GALLERY = [
  {
    title: 'Royal Navy Agbada Set',
    tag: 'Agbada',
    desc: '3-piece royal navy blue agbada with handcrafted gold embroidery and a matching fila cap. Perfect for weddings and special celebrations.',
    image: '/images/agbada_modern.jpg',
  },
  {
    title: 'Minimalist Charcoal Senator Suit',
    tag: 'Senator Suits',
    desc: 'Clean, fitted cut made from soft cashmere wool with neat geometric chest detailing and mandarin collar. Great for church, meetings, and formal dinners.',
    image: '/images/senator_modern.jpg',
  },
  {
    title: 'Champagne Silk Kaftan',
    tag: 'Kaftan',
    desc: 'Luxurious 2-piece native wear in cream silk brocade with intricate geometric neckline embroidery and tailored trousers.',
    image: '/images/kaftan_modern.jpg',
  },
  {
    title: 'Contemporary Ankara & Wide-Leg Trousers',
    tag: 'Trousers',
    desc: 'Fashion-week grade geometric Ankara native jacket paired with relaxed pleated navy wide-leg trousers.',
    image: '/images/ankara_modern.jpg',
  },
  {
    title: 'Tailored Ankara 2-Piece',
    tag: 'Ankara',
    desc: 'Bespoke matching emerald and gold geometric Ankara long-sleeve tunic and slim-cut trousers sewn to your exact fit.',
    image: '/images/ankara_set.jpg',
  },
  {
    title: 'Grand Velvet Agbada',
    tag: 'Agbada',
    desc: 'Rich wine-red velvet Agbada with bold gold thread patterns. Designed to make you look royal at any big event.',
    image: '/images/agbada_wine.jpg',
  },
];

const STEPS = [
  {
    mark: '01',
    title: 'Tell Us What You Want',
    body: 'Chat with our friendly assistant. Say the style you want (Agbada, Senator, Kaftan), pick your color, and tell us when you need it.',
  },
  {
    mark: '02',
    title: 'Save Your Size Once',
    body: 'Share your measurements once. Next time you order, just enter your phone number and we remember your exact size automatically.',
  },
  {
    mark: '03',
    title: 'Pickup or Bike Delivery',
    body: 'Your tailor receives your order on WhatsApp, sews it with care, and gives it to you at their shop or sends it to your house by dispatch rider.',
  },
];

const TRAITS = [
  {
    mark: '01',
    title: 'A Link for Your Bio',
    body: 'Tailors get a simple link for their Instagram, TikTok, or WhatsApp status. Customers can tap it and order clothes in 2 minutes.',
  },
  {
    mark: '02',
    title: 'Never Lose a Customer’s Size',
    body: 'No more searching for old paper notebooks. All your customer measurements are saved securely in your private online book.',
  },
  {
    mark: '03',
    title: 'Choose How You Get It',
    body: 'Walk into the tailor’s shop to pick up your clothes, or have a dispatch delivery driver drop it off right at your door.',
  },
];

function Marquee() {
  const items = [...GARMENTS, ...GARMENTS];
  return (
    <div className="marquee-viewport">
      <div className="marquee-track">
        {items.map((item, i) => (
          <span className="marquee-item" key={i}>
            {item}
            <span className="marquee-dot" aria-hidden="true">&#9670;</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Header({ activeDesigner, loggedInDesigner, onOrderClick, onDesignerPortalClick }) {
  return (
    <div className="fixed-header-wrapper">
      {activeDesigner && (
        <div className="designer-atelier-banner">
          <div className="designer-atelier-banner__content">
            <div className="designer-atelier-banner__left">
              <span className="designer-atelier-banner__badge">
                <Store size={12} /> Official Storefront
              </span>
              <span>
                Ordering directly with <strong>{activeDesigner.brand_name}</strong>
                {activeDesigner.location ? ` (${activeDesigner.location})` : ''}
              </span>
            </div>
            <a href="/" className="designer-atelier-banner__link">
              Explore All Tailors &rarr;
            </a>
          </div>
        </div>
      )}

      <header className="nav">
        <div className="nav__brand">
          <a href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="nav__logo-mark">✦</span>
            <span className="nav__logo">IFASHION</span>
          </a>
          {activeDesigner && (
            <span className="nav__atelier-tag">
              <Store size={13} /> {activeDesigner.brand_name}
            </span>
          )}
        </div>

        <nav className="nav__links">
          <a href="#work">Styles</a>
          <a href="#how">How It Works</a>
          <a href="#measurements">Fit Guide</a>
          <a href="#about">About</a>
          <a href="#traits">Why Us</a>
        </nav>

        <div className="nav__actions">
          <button className="btn btn--ghost btn--small" onClick={onDesignerPortalClick}>
            <ShieldCheck size={15} />
            {loggedInDesigner ? `${loggedInDesigner.brand_name}` : 'Tailor Login'}
          </button>
          <button className="btn btn--gold btn--small" onClick={() => onOrderClick('')}>
            Order Outfit
          </button>
        </div>
      </header>
    </div>
  );
}

function Hero({ activeDesigner, onOrderClick, onRegisterClick }) {
  const brandSub = activeDesigner
    ? activeDesigner.bio ||
    `Welcome to ${activeDesigner.brand_name}! Order native wear sewn to your exact size. Our smart assistant helps you pick your style, records your size, and notifies the tailor on WhatsApp.`
    : 'Get clothes sewn to your exact body size — without any stress. Choose your style, save your size, and get it delivered to your home or pick it up at the shop.';

  return (
    <section className={`hero ${activeDesigner ? 'hero--has-banner' : ''}`}>


      <motion.div
        className="hero__content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <div className="hero__badge">
          <Sparkles size={13} />
          <span>{activeDesigner ? `Official Tailor: ${activeDesigner.brand_name}` : 'Custom Native Clothes Made For You'}</span>
        </div>

        <h1 className="hero__headline">
          {activeDesigner ? (
            <>
              {activeDesigner.brand_name}. <em>Sewn to your size.</em>
            </>
          ) : (
            <>
              Clothes sewn to your fit. <em>Neat, sharp, on time.</em>
            </>
          )}
        </h1>

        <p className="hero__sub">{brandSub}</p>

        <div className="hero__actions">
          <button className="btn btn--gold" onClick={() => onOrderClick('')}>
            Start Your Order &rarr;
          </button>
          {!activeDesigner && (
            <button className="btn btn--outline" onClick={onRegisterClick}>
              <Store size={15} /> Are you a tailor? Join here
            </button>
          )}
          {activeDesigner?.location && (
            <span className="hero-location-pill">
              <MapPin size={13} /> {activeDesigner.location}
            </span>
          )}
        </div>

        {/* Quick Trust Highlights for everyday people */}
        <div className="hero-trust-strip">
          <div className="trust-item">
            <CheckCircle2 size={15} className="text-gold" />
            <span>Exact Body Fit</span>
          </div>
          <div className="trust-item">
            <Truck size={15} className="text-gold" />
            <span>Pickup or Bike Delivery</span>
          </div>
          <div className="trust-item">
            <Clock size={15} className="text-gold" />
            <span>Orders Sent to WhatsApp and Emails.</span>
          </div>
        </div>
      </motion.div>

      {/* Spotlight Card */}
      <motion.div
        className="hero__card glass"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
      >
        <div className="hero__card-image-wrap">
          <img src="/images/agbada_modern.jpg" alt="Signature Royal Agbada" className="hero__card-image" />
          <span className="hero__card-badge">✦ Top Pick for Owambes</span>
        </div>
        <div className="hero__card-info">
          <div>
            <h3>{activeDesigner ? `${activeDesigner.brand_name} Agbada` : 'Royal Navy Agbada'}</h3>
            <p>100% Quality Fabric & Metallic Gold Details</p>
          </div>
          <button
            className="btn btn--gold btn--small"
            onClick={() => onOrderClick(`I want to order the Royal Navy Agbada from ${activeDesigner?.brand_name || 'your shop'}`)}
          >
            Order This Look
          </button>
        </div>
      </motion.div>
    </section>
  );
}

function Gallery({ onOrderClick }) {
  const [selectedCategory, setSelectedCategory] = useState('All Styles');

  const filteredItems =
    selectedCategory === 'All Styles'
      ? GALLERY
      : GALLERY.filter((item) => item.tag === selectedCategory);

  return (
    <section className="gallery" id="work">
      <div className="section-header">
        <span className="eyebrow">Styles You Can Order</span>
        <h2 className="section-title">Popular Native Wear</h2>
        <p className="section-sub">
          Every piece is sewn to your exact body measurements, carefully finished, and delivered looking neat.
        </p>
      </div>

      {/* Interactive Category Filter Pills */}
      <div className="gallery-filter-bar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`gallery-filter-btn ${selectedCategory === cat ? 'gallery-filter-btn--active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="gallery__grid">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((piece, i) => (
            <motion.div
              layout
              className="gallery__card glass"
              key={piece.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.3 }}
            >
              <div className="gallery__card-image-wrap">
                <img src={piece.image} alt={piece.title} className="gallery__card-img" />
                <div className="gallery__card-overlay">
                  <button
                    className="gallery__card-btn"
                    onClick={() => onOrderClick(`I want to order the ${piece.title}`)}
                  >
                    Order This Style &rarr;
                  </button>
                </div>
              </div>
              <div className="gallery__card-body">
                <div className="gallery__card-meta">
                  <span className="gallery__card-tag">{piece.tag}</span>
                </div>
                <h3>{piece.title}</h3>
                <p className="gallery__card-desc">{piece.desc}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

function Steps() {
  return (
    <section className="steps" id="how">
      <TapeDivider label="Simple 3-Step Process" />
      <div className="steps__grid">
        {STEPS.map((step) => (
          <div className="steps__card glass" key={step.mark}>
            <span className="steps__mark">{step.mark}</span>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function About({ activeDesigner }) {
  return (
    <section className="about" id="about">
      <div className="about__image-wrap">
        <img
          src="/images/designer.jpg"
          alt="Master Tailor at IFashion"
          className="about__image"
        />
      </div>
      <div className="about__content">
        <span className="eyebrow">Our Promise</span>
        <h2>{activeDesigner ? activeDesigner.brand_name : 'Quality Sewing. Respect in Every Seam.'}</h2>
        <p>
          {activeDesigner?.bio ||
            'At IFashion, we make it easy for you to get traditional clothes made without having to visit the tailor five times. We pair good tailors with modern technology so you always get the right fit, on the agreed date, with zero stories.'}
        </p>
        <div className="about__stats">
          <div className="stat-item glass">
            <span className="stat-num">500+</span>
            <span className="stat-label">Happy Clients</span>
          </div>
          <div className="stat-item glass">
            <span className="stat-num">100%</span>
            <span className="stat-label">Custom Fit</span>
          </div>
          <div className="stat-item glass">
            <span className="stat-num">24/7</span>
            <span className="stat-label">Instant Ordering</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Traits() {
  return (
    <section className="traits" id="traits">
      <TapeDivider label="Why Tailors & Clients Love Us" />
      <div className="traits__grid">
        {TRAITS.map((trait) => (
          <div className="traits__card glass" key={trait.mark}>
            <span className="traits__mark">{trait.mark}</span>
            <h3>{trait.title}</h3>
            <p>{trait.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA({ activeDesigner, onOrderClick, onRegisterClick }) {
  return (
    <section className="cta">
      <div className="cta__panel glass-strong">
        <span className="eyebrow">Simple, fast, and neat</span>
        <h2>{activeDesigner ? `Ready to order from ${activeDesigner.brand_name}?` : 'Ready for an outfit that fits you well?'}</h2>
        <p>
          Chat with our assistant to place your order in under 2 minutes, or create your tailor profile if you sew clothes.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn--gold" onClick={() => onOrderClick('')}>
            Start Your Order Now &rarr;
          </button>
          {!activeDesigner && (
            <button className="btn btn--outline" onClick={onRegisterClick}>
              Create Tailor Profile Link
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function Footer({ onAdminClick }) {
  return (
    <footer className="footer">
      <span>✦ IFASHION &copy; 2026</span>
      <span>Made for tailors, fashion designers, and stylish people everywhere</span>
      <button className="btn btn--ghost btn--small" onClick={onAdminClick}>
        <ShieldCheck size={14} /> Tailor Portal
      </button>
    </footer>
  );
}

export default function App() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatPrompt, setChatPrompt] = useState('');
  const [adminOpen, setAdminOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  // Authenticated designer session
  const [loggedInDesigner, setLoggedInDesigner] = useState(null);

  // Public Atelier profile loaded from URL (?designer=<handle> or /@<handle>)
  const [activeDesigner, setActiveDesigner] = useState(null);
  const [designerLoading, setDesignerLoading] = useState(false);

  useEffect(() => {
    // Check local storage for logged-in designer
    const savedDesigner = localStorage.getItem('ifashion_designer');
    if (savedDesigner) {
      try {
        setLoggedInDesigner(JSON.parse(savedDesigner));
      } catch (e) {
        localStorage.removeItem('ifashion_designer');
      }
    }

    // Detect designer handle from URL query (?designer=handle) or pathname (/@handle)
    const params = new URLSearchParams(window.location.search);
    let handle = params.get('designer');
    if (!handle && window.location.pathname.startsWith('/@')) {
      handle = window.location.pathname.slice(2);
    }

    if (handle) {
      loadDesignerProfile(handle.trim().toLowerCase());
    }
  }, []);

  async function loadDesignerProfile(handle) {
    setDesignerLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/designer/${handle}`);
      if (res.ok) {
        const data = await res.json();
        setActiveDesigner(data);
      }
    } catch (err) {
      console.error('Failed to load designer profile', err);
    } finally {
      setDesignerLoading(false);
    }
  }

  function handleOpenOrder(prompt = '') {
    setChatPrompt(prompt);
    setChatOpen(true);
  }

  function handleDesignerPortalClick() {
    if (loggedInDesigner) {
      setAdminOpen(true);
    } else {
      setAuthMode('login');
      setAuthOpen(true);
    }
  }

  function handleRegisterClick() {
    setAuthMode('register');
    setAuthOpen(true);
  }

  function handleAuthSuccess(designer) {
    setLoggedInDesigner(designer);
    setAdminOpen(true);
  }

  function handleLogout() {
    localStorage.removeItem('ifashion_token');
    localStorage.removeItem('ifashion_designer');
    setLoggedInDesigner(null);
    setAdminOpen(false);
  }

  return (
    <div className="app">
      <Header
        activeDesigner={activeDesigner}
        loggedInDesigner={loggedInDesigner}
        onOrderClick={handleOpenOrder}
        onDesignerPortalClick={handleDesignerPortalClick}
      />

      <Hero
        activeDesigner={activeDesigner}
        onOrderClick={handleOpenOrder}
        onRegisterClick={handleRegisterClick}
      />

      <Marquee />
      <Gallery onOrderClick={handleOpenOrder} />

      {/* Interactive How We Measure Fit Section */}
      <div id="measurements">
        <MeasurementPreview onOrderWithMeasurements={handleOpenOrder} />
      </div>

      <Steps />
      <About activeDesigner={activeDesigner} />
      <Traits />
      <CTA
        activeDesigner={activeDesigner}
        onOrderClick={handleOpenOrder}
        onRegisterClick={handleRegisterClick}
      />
      <Footer onAdminClick={handleDesignerPortalClick} />

      {/* Sleek Floating Quick Order Button */}
      <motion.button
        className="floating-order-btn glass-strong"
        onClick={() => handleOpenOrder('')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        title="Start your custom order"
      >
        <span className="live-dot" />
        <Sparkles size={15} className="text-gold" />
        <span>Order Outfit</span>
      </motion.button>

      {/* Refined AI Bespoke Order Concierge */}
      <ChatWidget
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        initialPrompt={chatPrompt}
        currentDesigner={activeDesigner || loggedInDesigner}
      />

      {/* Designer Authentication Modal */}
      <AuthModal
        open={authOpen}
        initialMode={authMode}
        onClose={() => setAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Private Designer Portal & Measurement Book */}
      <AdminModal
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        currentDesigner={loggedInDesigner}
        onLogout={handleLogout}
      />
    </div>
  );
}
