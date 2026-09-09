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
  MessageCircle,
  Copy,
  Plus,
} from 'lucide-react';
import TapeDivider from './components/TapeDivider';
import ChatWidget from './components/ChatWidget';
import AdminModal from './components/AdminModal';
import AuthModal from './components/AuthModal';
import MeasurementPreview from './components/MeasurementPreview';
import './App.css';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';

const STEPS = [
  {
    mark: '01',
    title: 'Choose a Tailor or Style',
    body: 'Browse verified tailors on IFashion, or chat with our assistant to pick your style (Agbada, Senator, Kaftan), color, and target date.',
  },
  {
    mark: '02',
    title: 'Save Your Measurements Once',
    body: 'Enter your sizes once. Next time you order, your phone number automatically loads your saved body measurements for any tailor.',
  },
  {
    mark: '03',
    title: 'Pickup or Doorstep Delivery',
    body: 'Your tailor receives your order on WhatsApp, cuts, sews, and dispatches your outfit directly to your door or prepares it for pickup.',
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

function Header({ activeDesigner, loggedInDesigner, onOrderClick, onDesignerPortalClick, onRegisterClick }) {
  const isOwner = loggedInDesigner && activeDesigner && loggedInDesigner.id === activeDesigner.id;

  return (
    <div className="fixed-header-wrapper">
      {activeDesigner && (
        <div className="designer-atelier-banner">
          <div className="designer-atelier-banner__content">
            <div className="designer-atelier-banner__left">
              <span className="designer-atelier-banner__badge">
                <Store size={12} /> Official Tailor Shop
              </span>
              <span>
                Ordering directly from <strong>{activeDesigner.brand_name}</strong>
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
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="nav__logo">IFASHION</span>
              {!activeDesigner && (
                <span style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--cognac)', letterSpacing: '0.08em', marginTop: -3 }}>
                  TAILOR OPERATING PLATFORM
                </span>
              )}
            </div>
          </a>
          {activeDesigner && (
            <span className="nav__atelier-tag">
              <Store size={13} /> {activeDesigner.brand_name}
            </span>
          )}
        </div>

        <nav className="nav__links">
          {!activeDesigner ? (
            <>
              <a href="#tailors">Find Tailors</a>
              <a href="#platform">Platform</a>
              <a href="#measurements">Fit Studio</a>
              <a href="#how">How It Works</a>
            </>
          ) : (
            <>
              <a href="#collection">Collection</a>
              <a href="#measurements">Fit Guide</a>
              <a href="#how">How It Works</a>
              <a href="#about">About</a>
            </>
          )}
        </nav>

        <div className="nav__actions">
          {/* If the logged-in tailor is visiting their own shop page, show Manage Shop */}
          {isOwner && (
            <button className="btn btn--ghost btn--small" onClick={onDesignerPortalClick} title="Open your tailor dashboard">
              <ShieldCheck size={15} />
              Manage Shop
            </button>
          )}

          {/* If on main homepage (no active tailor shop selected), show Tailor Login or Tailor Name */}
          {!activeDesigner && (
            <>
              <button className="btn btn--ghost btn--small" onClick={onDesignerPortalClick}>
                <ShieldCheck size={15} />
                {loggedInDesigner ? `${loggedInDesigner.brand_name}` : 'Tailor Login'}
              </button>
              <button className="btn btn--outline btn--small" onClick={onRegisterClick}>
                Register Shop
              </button>
            </>
          )}

          <button className="btn btn--gold btn--small" onClick={() => onOrderClick('')}>
            Order Clothes
          </button>
        </div>
      </header>
    </div>
  );
}

function Hero({ activeDesigner, onOrderClick, onRegisterClick }) {
  if (activeDesigner) {
    return (
      <section className="hero hero--has-banner hero--tailor">
        <motion.div
          className="hero__content--tailor"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="hero__badge">
            <Store size={13} />
            <span>Official Tailor Shop</span>
          </div>

          <h1 className="hero__headline">
            Handcrafted Native Outfits by <br />
            <span className="text-gold italic">{activeDesigner.brand_name}</span>
          </h1>

          {activeDesigner.location && (
            <div
              className="hero-location-pill"
              style={{
                margin: '10px auto 18px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 16px',
                borderRadius: 999,
                background: 'rgba(179, 112, 42, 0.1)',
                color: 'var(--cognac)',
                fontWeight: 600,
                fontSize: '0.86rem',
              }}
            >
              <MapPin size={14} />
              <span>{activeDesigner.location}</span>
            </div>
          )}

          <p className="hero__sub" style={{ maxWidth: 660, margin: '0 auto 28px' }}>
            {activeDesigner.bio ||
              `Welcome to ${activeDesigner.brand_name}! Order native wear sewn to your exact body measurements with direct WhatsApp updates and doorstep delivery.`}
          </p>

          <div className="hero__actions" style={{ justifyContent: 'center' }}>
            <button
              className="btn btn--gold"
              onClick={() => onOrderClick(`I want to order a custom outfit from ${activeDesigner.brand_name}`)}
            >
              <Sparkles size={16} /> Order from {activeDesigner.brand_name}
            </button>
            <a href="#collection" className="btn btn--outline">
              View Work
            </a>
          </div>
        </motion.div>
      </section>
    );
  }

  // Platform Homepage Hero: Centered, spacious, clean, with frosted platform pillars
  return (
    <section className="hero hero--platform">
      <motion.div
        className="hero__content--centered"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <div className="hero__badge">
          <Sparkles size={13} />
          <span>Nigeria's Digital Tailoring Platform</span>
        </div>

        <h1 className="hero__headline hero__title--platform">
          Where Master Tailors &amp; <br />
          <span className="text-gold italic">Stylish Clients Connect.</span>
        </h1>

        <p className="hero__sub hero__sub--centered">
          An operating platform connecting verified Nigerian fashion designers with stylish clients.
          Save your measurements once, eliminate paper notebooks, and automate customer orders via WhatsApp.
        </p>

        <div className="hero__actions hero__actions--centered">
          <a href="#tailors" className="btn btn--gold">
            <Store size={16} /> Explore Tailor Shops
          </a>
          <button className="btn btn--outline" onClick={onRegisterClick}>
            <Scissors size={16} /> Register as a Tailor
          </button>
          <button className="btn btn--ghost" onClick={() => onOrderClick('')}>
            <Sparkles size={16} /> Order an Outfit
          </button>
        </div>

        {/* Executive Frosted Glass Platform Strip */}
        <div className="platform-glass-strip">
          <div className="platform-pill-item">
            <div className="platform-pill-icon">
              <Store size={20} />
            </div>
            <div>
              <strong>Verified Workshops</strong>
              <span>Real physical shops across Nigeria</span>
            </div>
          </div>

          <div className="platform-pill-divider" />

          <div className="platform-pill-item">
            <div className="platform-pill-icon">
              <Ruler size={20} />
            </div>
            <div>
              <strong>Digital Measurement Book</strong>
              <span>Save sizes once, zero paper notebooks</span>
            </div>
          </div>

          <div className="platform-pill-divider" />

          <div className="platform-pill-item">
            <div className="platform-pill-icon">
              <MessageCircle size={20} />
            </div>
            <div>
              <strong>WhatsApp Workflows</strong>
              <span>Live status alerts to client &amp; tailor</span>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function RoleSwitcherSection({ onOrderClick, onRegisterClick }) {
  const [activeRole, setActiveRole] = useState('clients'); // 'clients' | 'tailors'

  return (
    <section className="role-switcher-section" id="platform">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <span className="eyebrow">Two Sides • One Integrated Platform</span>
        <h2 className="section-title">An Operating System for African Fashion</h2>
        <p className="section-sub">
          IFashion bridges the gap between stylish clients who want dependable native wear and master tailors seeking modern software to grow.
        </p>
      </div>

      <div className="role-switcher-container">
        <button
          className={`role-switch-btn ${activeRole === 'clients' ? 'active' : ''}`}
          onClick={() => setActiveRole('clients')}
        >
          <Sparkles size={16} className="text-gold" />
          <span>For Clients Looking for Outfits</span>
        </button>
        <button
          className={`role-switch-btn ${activeRole === 'tailors' ? 'active' : ''}`}
          onClick={() => setActiveRole('tailors')}
        >
          <Scissors size={16} className="text-gold" />
          <span>For Tailors & Fashion Designers</span>
        </button>
      </div>

      <div className="role-features-grid">
        {activeRole === 'clients' ? (
          <>
            <div className="role-feature-card">
              <div className="role-feature-icon-box">
                <Store size={22} />
              </div>
              <h3>Verified Tailor Directory</h3>
              <p>
                Browse verified native tailors in your state. Inspect real photos of their sewn work, workshop locations, and specialties before trusting them with your expensive fabrics.
              </p>
            </div>

            <div className="role-feature-card">
              <div className="role-feature-icon-box">
                <Ruler size={22} />
              </div>
              <h3>Save Your Sizes Once</h3>
              <p>
                Never stand for a measurement tape every single time you want new clothes. Your sizes are stored securely in your digital profile so any tailor can sew to your exact fit.
              </p>
            </div>

            <div className="role-feature-card">
              <div className="role-feature-icon-box">
                <Truck size={22} />
              </div>
              <h3>WhatsApp Order Tracking</h3>
              <p>
                Get real-time updates as your outfit moves from measuring to cutting, sewing, and doorstep bike delivery. Zero stories, zero unpicked calls.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="role-feature-card">
              <div className="role-feature-icon-box">
                <ExternalLink size={22} />
              </div>
              <h3>Your Official Shop Link</h3>
              <p>
                Get a clean link (e.g. ifashion.ng/?designer=yourname) to put on your WhatsApp Status, Instagram, and TikTok bio. Clients can browse and order from you 24/7.
              </p>
            </div>

            <div className="role-feature-card">
              <div className="role-feature-icon-box">
                <ShieldCheck size={22} />
              </div>
              <h3>Digital Measurement Book</h3>
              <p>
                Replace old lost paper notebooks forever. Look up any client's chest, waist, and length in 2 seconds right from your phone by typing their phone number.
              </p>
            </div>

            <div className="role-feature-card">
              <div className="role-feature-icon-box">
                <Clock size={22} />
              </div>
              <h3>Instant WhatsApp Alerts</h3>
              <p>
                When a client places an order, you instantly receive an automated WhatsApp notification and email summary with their style, color, deadline, and sizes.
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function TailorDirectory({ designers, loading, onRegisterClick }) {
  return (
    <section className="tailor-directory-section" id="tailors">
      <div className="section-header">
        <span className="eyebrow">Discover Workshops</span>
        <h2 className="section-title">Verified Tailor Shops on IFashion</h2>
        <p className="section-sub">
          Order custom native wear directly from verified fashion designers and workshops. Click any tailor to view their shop and designs.
        </p>
      </div>

      <div className="tailor-directory-grid">
        {designers.map((designer) => (
          <div className="tailor-shop-card" key={designer.id}>
            <div>
              <div className="tailor-shop-card__head">
                <div className="tailor-avatar-circle">
                  <Scissors size={22} />
                </div>
                <span className="tailor-verified-pill">
                  <CheckCircle2 size={12} /> Verified Shop
                </span>
              </div>

              <h3 className="tailor-shop-card__title">{designer.brand_name}</h3>

              <div className="tailor-location-badge">
                <MapPin size={13} className="text-gold" />
                <span>{designer.location || 'Nigeria'}</span>
              </div>

              <p className="tailor-shop-card__bio">
                {designer.bio || 'Master tailor specializing in clean custom Senator suits, Agbada, and native wear.'}
              </p>
            </div>

            <div>
              <div className="tailor-tags-row" style={{ marginBottom: 16 }}>
                <span className="tailor-feature-pill">🏬 Shop Pickup</span>
                <span className="tailor-feature-pill">🛵 Courier Delivery</span>
                {designer.portfolio && designer.portfolio.length > 0 && (
                  <span className="tailor-feature-pill text-gold">✦ {designer.portfolio.length} Custom Styles</span>
                )}
              </div>

              <a
                href={`/?designer=${designer.handle}`}
                className="tailor-shop-card__action"
              >
                <span>Visit Storefront & Order</span>
                <ArrowRight size={15} />
              </a>
            </div>
          </div>
        ))}

        {/* Tailor Invitation Card */}
        <div className="tailor-invite-card">
          <div>
            <span className="admin-badge" style={{ background: 'rgba(179, 112, 42, 0.25)', color: '#CFA468' }}>
              ✦ For Tailors & Designers
            </span>
            <h3>Are You a Tailor?</h3>
            <p>
              Join IFashion today. Get your verified shop link, receive orders directly to WhatsApp, and digitize your customer sizes in under 60 seconds.
            </p>
          </div>

          <button className="tailor-invite-btn" onClick={onRegisterClick}>
            <Store size={16} />
            <span>Register Your Shop Link</span>
          </button>
        </div>
      </div>
    </section>
  );
}

function TailorStorefrontStyles({ activeDesigner, isOwner, onOrderClick, onOpenDashboard }) {
  if (!activeDesigner) return null;

  const portfolio = activeDesigner.portfolio || [];
  const hasItems = portfolio.length > 0;

  return (
    <section className="gallery" id="collection">
      <div className="section-header">
        <span className="eyebrow">Work Showcase</span>
        <h2 className="section-title">
          {activeDesigner.brand_name}’s Outfits
        </h2>
        <p className="section-sub">
          {hasItems
            ? `Real outfits sewn and finished by ${activeDesigner.brand_name}. Choose any style to get started.`
            : `Handcrafted native wear sewn to your exact body measurements.`}
        </p>

        {isOwner && (
          <div style={{ marginTop: 14 }}>
            <button className="btn btn--outline btn--small" onClick={onOpenDashboard}>
              <Plus size={14} className="text-gold" /> Upload Your Finished Outfits
            </button>
          </div>
        )}
      </div>

      {hasItems ? (
        <div className="gallery__grid">
          <AnimatePresence mode="popLayout">
            {portfolio.map((piece, i) => (
              <motion.div
                layout
                className="gallery__card glass"
                key={piece.id || i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.3 }}
              >
                <div className="gallery__card-image-wrap">
                  <img
                    src={piece.image}
                    alt={piece.title}
                    className="gallery__card-img"
                  />
                  <div className="gallery__card-overlay">
                    <button
                      className="gallery__card-btn"
                      onClick={() => onOrderClick(`I want to order ${piece.title} from ${activeDesigner.brand_name}`)}
                    >
                      Order This Style &rarr;
                    </button>
                  </div>
                </div>
                <div className="gallery__card-body">
                  <div className="gallery__card-meta">
                    <span className="gallery__card-tag">{piece.tag || 'Custom Native'}</span>
                  </div>
                  <h3>{piece.title}</h3>
                  {piece.desc && <p>{piece.desc}</p>}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="storefront-empty-state glass">
          <div className="storefront-empty-icon">
            <Scissors size={28} />
          </div>
          <h3>Custom Made-to-Measure Outfits</h3>
          <p>
            {activeDesigner.brand_name} specializes in custom Agbada, Senator suits, Kaftans, and traditional native wear.
            Every piece is made from scratch to your exact measurements with premium finishing.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 12 }}>
            <button
              className="btn btn--gold"
              onClick={() => onOrderClick(`I want to order a custom outfit from ${activeDesigner.brand_name}`)}
            >
              <Sparkles size={15} /> Order Custom Outfit
            </button>
            {isOwner && (
              <button className="btn btn--outline" onClick={onOpenDashboard}>
                <Plus size={15} /> Add Styles to Your Shop
              </button>
            )}
          </div>
        </div>
      )}
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

  const [designers, setDesigners] = useState([]);
  const [designersLoading, setDesignersLoading] = useState(false);

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

    // Load live designers directory
    fetchDesigners();

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

  async function fetchDesigners() {
    setDesignersLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/designers`);
      if (res.ok) {
        const data = await res.json();
        setDesigners(data);
      }
    } catch (err) {
      console.error('Failed to load designers list', err);
    } finally {
      setDesignersLoading(false);
    }
  }

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
        onRegisterClick={handleRegisterClick}
      />

      <Hero
        activeDesigner={activeDesigner}
        onOrderClick={handleOpenOrder}
        onRegisterClick={handleRegisterClick}
      />

      {/* Main Platform Modules (Only shown on the main platform homepage) */}
      {!activeDesigner && (
        <>
          <TailorDirectory
            designers={designers}
            loading={designersLoading}
            onRegisterClick={handleRegisterClick}
          />

          <RoleSwitcherSection
            onOrderClick={handleOpenOrder}
            onRegisterClick={handleRegisterClick}
          />
        </>
      )}

      {/* Tailor Custom Outfits (Only shown when visiting a specific tailor's storefront) */}
      {activeDesigner && (
        <TailorStorefrontStyles
          activeDesigner={activeDesigner}
          isOwner={Boolean(loggedInDesigner && activeDesigner && loggedInDesigner.id === activeDesigner.id)}
          onOrderClick={handleOpenOrder}
          onOpenDashboard={() => setAdminOpen(true)}
        />
      )}

      {/* Interactive How We Measure Fit Section */}
      <div id="measurements">
        <MeasurementPreview onOrderWithMeasurements={handleOpenOrder} />
      </div>

      <Steps />
      {activeDesigner && <About activeDesigner={activeDesigner} />}
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

      {/* AI Tailor Order Assistant */}
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
