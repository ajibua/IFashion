import { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Lock,
  Mail,
  Phone,
  MapPin,
  Store,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';

export default function AuthModal({ open, onClose, onAuthSuccess, initialMode = 'login' }) {
  const [isRegister, setIsRegister] = useState(initialMode === 'register');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [brandName, setBrandName] = useState('');
  const [handle, setHandle] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');

  // Sync mode whenever modal opens or initialMode changes
  useEffect(() => {
    if (open) {
      setIsRegister(initialMode === 'register');
      setError('');
    }
  }, [open, initialMode]);

  if (!open) return null;

  function switchMode(registerMode) {
    setIsRegister(registerMode);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Client-side password validation on registration
    if (isRegister) {
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      if (!/[A-Za-z]/.test(password)) {
        setError('Password must contain at least one letter.');
        return;
      }
      if (!/\d/.test(password)) {
        setError('Password must contain at least one number.');
        return;
      }
      if (!/[^A-Za-z0-9]/.test(password)) {
        setError('Password must contain at least one symbol (e.g. !@#$%^&*).');
        return;
      }
    }

    setLoading(true);

    const endpoint = isRegister ? `${API_BASE}/auth/register` : `${API_BASE}/auth/login`;
    const payload = isRegister
      ? {
          brand_name: brandName.trim(),
          handle: handle.trim().toLowerCase().replace(/\s+/g, '-'),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim(),
          location: location.trim(),
          bio: bio.trim(),
          delivery_options: ['pickup', 'delivery'],
        }
      : {
          email: email.trim().toLowerCase(),
          password,
        };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        let msg = 'Authentication failed. Please check your credentials.';
        if (typeof data.detail === 'string') {
          msg = data.detail;
          if (msg === 'Invalid email or password.' && !isRegister) {
            msg = 'Invalid email or password. If you do not have an account yet, tap "Create Profile" above.';
          }
        } else if (Array.isArray(data.detail)) {
          msg = data.detail
            .map((d) => (d.msg ? `${d.loc ? d.loc.slice(-1)[0] + ': ' : ''}${d.msg}` : String(d)))
            .join(' | ');
        } else if (data.message) {
          msg = data.message;
        }
        throw new Error(msg);
      }

      // Save token and designer session
      localStorage.setItem('ifashion_token', data.token);
      localStorage.setItem('ifashion_designer', JSON.stringify(data));
      onAuthSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message || 'Unable to connect to server. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-modal-overlay" role="dialog" aria-modal="true" aria-label="Designer Authentication Portal">
      <div className="auth-modal-backdrop" onClick={onClose} />
      <div className="auth-card glass-strong">
        {/* Header */}
        <div className="auth-card__header">
          <div className="auth-card__brand">
            <span className="nav__logo-mark">✦</span>
            <div>
              <h3>{isRegister ? 'Create Your Tailor Profile' : 'Tailor Sign In'}</h3>
              <p className="text-muted">
                {isRegister
                  ? 'Get your personal link to share on WhatsApp, Instagram, or TikTok'
                  : 'Sign in to see incoming customer orders and your measurement book'}
              </p>
            </div>
          </div>
          <button className="chat-panel__close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Clear Segmented Switcher */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${!isRegister ? 'auth-tab-btn--active' : ''}`}
            onClick={() => switchMode(false)}
          >
            <ShieldCheck size={15} /> Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${isRegister ? 'auth-tab-btn--active' : ''}`}
            onClick={() => switchMode(true)}
          >
            <UserCheck size={15} /> Create Profile
          </button>
        </div>

        {error && <div className="auth-error-badge">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div className="auth-form__group">
                <label>
                  <Store size={14} /> Shop or Brand Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marvelous Stitches"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                />
              </div>

              <div className="auth-form__group">
                <label>
                  <Sparkles size={14} /> Your Custom Link Name (Handle)
                </label>
                <div className="handle-input-wrap">
                  <span className="handle-prefix">ifashion.ng/?designer=</span>
                  <input
                    type="text"
                    required
                    placeholder="marvelous"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                  />
                </div>
              </div>

              <div className="auth-form__group">
                <label>
                  <Phone size={14} /> WhatsApp Phone Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 08012345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="auth-form__group">
                <label>
                  <MapPin size={14} /> Shop City / Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ikeja, Lagos"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="auth-form__group">
                <label>What You Specialize In (Short Bio)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. We sew luxury Agbadas, Senator suits, and custom trousers for weddings and events."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="auth-form__group">
            <label>
              <Mail size={14} /> Email Address
            </label>
            <input
              type="email"
              required
              placeholder="tailor@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="auth-form__group">
            <label>
              <Lock size={14} /> Password
            </label>
            <div className="auth-password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="auth-toggle-pwd"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {isRegister && (
              <span className="auth-hint">
                Must have 8+ characters including letters, numbers & symbols (e.g. #, @, !).
              </span>
            )}
          </div>

          <button type="submit" className="btn btn--gold auth-submit-btn" disabled={loading}>
            {loading ? (
              'Processing...'
            ) : isRegister ? (
              <>
                Create My Profile Link <ArrowRight size={16} />
              </>
            ) : (
              <>
                Sign In to Dashboard <ShieldCheck size={16} />
              </>
            )}
          </button>
        </form>

        <div className="auth-switch-footer">
          {isRegister ? (
            <span>
              Already registered?{' '}
              <button type="button" className="text-link" onClick={() => switchMode(false)}>
                Sign In here
              </button>
            </span>
          ) : (
            <span>
              New fashion designer or tailor?{' '}
              <button type="button" className="text-link" onClick={() => switchMode(true)}>
                Create your profile link for free &rarr;
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
