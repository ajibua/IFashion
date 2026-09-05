import { useState, useEffect } from 'react';
import {
  X,
  Search,
  User,
  Package,
  Clock,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Ruler,
  Copy,
  Check,
  ExternalLink,
  MapPin,
  Phone,
  Truck,
  Scissors,
  LogOut,
  Sparkles,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';

const STATUS_PILLS = [
  { id: 'all', label: 'All Orders' },
  { id: 'received', label: 'New Orders' },
  { id: 'measuring', label: 'Measuring' },
  { id: 'cutting', label: 'Cutting Cloth' },
  { id: 'stitching', label: 'Sewing' },
  { id: 'ready', label: 'Ready for Pickup / Delivery' },
  { id: 'delivered', label: 'Delivered' },
];

export default function AdminModal({ open, onClose, currentDesigner, onLogout }) {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'customers' | 'profile'
  const [statusFilter, setStatusFilter] = useState('all');
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Profile edit states
  const [brandName, setBrandName] = useState(currentDesigner?.brand_name || '');
  const [phone, setPhone] = useState(currentDesigner?.phone || '');
  const [location, setLocation] = useState(currentDesigner?.location || '');
  const [bio, setBio] = useState(currentDesigner?.bio || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (open && currentDesigner) {
      fetchOrders();
      setBrandName(currentDesigner.brand_name || '');
      setPhone(currentDesigner.phone || '');
      setLocation(currentDesigner.location || '');
      setBio(currentDesigner.bio || '');
    }
  }, [open, currentDesigner]);

  if (!open) return null;

  const publicLink = currentDesigner?.handle
    ? `${window.location.origin}/?designer=${currentDesigner.handle}`
    : window.location.origin;

  function handleCopyLink() {
    navigator.clipboard.writeText(publicLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }

  async function fetchOrders() {
    setLoading(true);
    try {
      const url = currentDesigner?.id
        ? `${API_BASE}/orders/?designer_id=${currentDesigner.id}`
        : `${API_BASE}/orders/`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCustomerSearch(e) {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const designerParam = currentDesigner?.id ? `&designer_id=${currentDesigner.id}` : '';
      const res = await fetch(
        `${API_BASE}/customers/search?q=${encodeURIComponent(searchQuery.trim())}${designerParam}`
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error('Failed to search customers', err);
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(orderId, newStatus) {
    setStatusUpdating(orderId);
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
        );
      }
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setStatusUpdating(null);
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setProfileSaving(true);
    setSaveSuccess(false);

    try {
      const token = localStorage.getItem('ifashion_token');
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          brand_name: brandName,
          phone,
          location,
          bio,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        localStorage.setItem('ifashion_designer', JSON.stringify(updated));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setProfileSaving(false);
    }
  }

  const filteredOrders = orders.filter((o) =>
    statusFilter === 'all' ? true : o.status === statusFilter
  );

  return (
    <div className="admin-overlay" role="dialog" aria-modal="true" aria-label="Tailor Dashboard">
      <div className="admin-overlay__backdrop" onClick={onClose} />
      <div className="admin-panel glass-strong">
        {/* Header & Bio Link banner */}
        <div className="admin-panel__header">
          <div className="admin-panel__title-wrap">
            <span className="admin-badge">
              <ShieldCheck size={14} /> Tailor Dashboard
            </span>
            <h2>{currentDesigner?.brand_name || 'My Shop Dashboard'}</h2>
            <p className="admin-sub">
              {currentDesigner?.location ? `📍 ${currentDesigner.location} • ` : ''}
              Manage incoming customer orders and look up measurements
            </p>
          </div>
          <div className="admin-header-actions">
            <button className="btn btn--ghost btn--small" onClick={onLogout} title="Log out">
              <LogOut size={15} /> Sign Out
            </button>
            <button className="admin-panel__close" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Shareable Bio Link Banner */}
        {currentDesigner?.handle && (
          <div className="bio-link-banner glass">
            <div className="bio-link-info">
              <span className="bio-link-eyebrow">
                <Sparkles size={13} /> Your Personal Link (Share on WhatsApp & Instagram)
              </span>
              <span className="bio-link-url">{publicLink}</span>
            </div>
            <div className="bio-link-actions">
              <button
                className={`btn btn--small ${copiedLink ? 'btn--success' : 'btn--gold'}`}
                onClick={handleCopyLink}
              >
                {copiedLink ? (
                  <>
                    <Check size={14} /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copy My Link
                  </>
                )}
              </button>
              <a
                href={publicLink}
                target="_blank"
                rel="noreferrer"
                className="btn btn--outline btn--small"
                title="View your public storefront"
              >
                <ExternalLink size={14} /> View My Link
              </a>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'orders' ? 'admin-tab--active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <Package size={16} /> Orders ({orders.length})
          </button>
          <button
            className={`admin-tab ${activeTab === 'customers' ? 'admin-tab--active' : ''}`}
            onClick={() => {
              setActiveTab('customers');
              if (searchResults.length === 0) handleCustomerSearch();
            }}
          >
            <Ruler size={16} /> Measurement Book
          </button>
          <button
            className={`admin-tab ${activeTab === 'profile' ? 'admin-tab--active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={16} /> Atelier Settings
          </button>
        </div>

        {/* Tab 1: Orders */}
        {activeTab === 'orders' && (
          <div className="admin-content">
            <div className="orders-toolbar">
              <div className="status-filter-pills">
                {STATUS_PILLS.map((pill) => (
                  <button
                    key={pill.id}
                    className={`status-pill ${statusFilter === pill.id ? 'status-pill--active' : ''}`}
                    onClick={() => setStatusFilter(pill.id)}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
              <button className="btn btn--ghost btn--small" onClick={fetchOrders} disabled={loading}>
                <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
              </button>
            </div>

            {loading && orders.length === 0 ? (
              <div className="admin-empty">Loading bespoke orders...</div>
            ) : filteredOrders.length === 0 ? (
              <div className="admin-empty">
                <Package size={36} opacity={0.3} />
                <p>No orders in this status category.</p>
                <p className="text-muted">
                  Share your profile link in your bio to begin receiving AI-verified orders!
                </p>
              </div>
            ) : (
              <div className="orders-grid">
                {filteredOrders.map((order) => (
                  <div className="order-card glass" key={order.id}>
                    <div className="order-card__head">
                      <div>
                        <h4>{order.style || 'Custom Bespoke Outfit'}</h4>
                        <span className="order-card__meta">
                          Placed {new Date(order.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={`status-badge status-badge--${order.status}`}>
                        {order.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="order-card__details">
                      <div className="order-detail-row">
                        <span className="detail-label">Client:</span>
                        <span className="detail-value">
                          {order.customer?.name || 'Walk-in Client'} (
                          <a href={`tel:${order.customer?.phone}`}>{order.customer?.phone}</a>)
                        </span>
                      </div>

                      {order.color && (
                        <div className="order-detail-row">
                          <span className="detail-label">Color / Fabric:</span>
                          <span className="detail-value">{order.color}</span>
                        </div>
                      )}

                      {order.occasion && (
                        <div className="order-detail-row">
                          <span className="detail-label">Occasion:</span>
                          <span className="detail-value">{order.occasion}</span>
                        </div>
                      )}

                      <div className="order-detail-row">
                        <span className="detail-label">Deadline:</span>
                        <span className="detail-value text-gold">
                          <Clock size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                          {order.deadline || 'Flexible'}
                        </span>
                      </div>

                      {/* Delivery fulfillment badge */}
                      <div className="order-detail-row fulfillment-row">
                        <span className="detail-label">Fulfillment:</span>
                        <span className="fulfillment-badge">
                          {order.delivery_method === 'delivery' ? (
                            <>
                              <Truck size={14} /> Courier Dispatch
                              {order.delivery_address && (
                                <span className="fulfillment-address">
                                  &rarr; {order.delivery_address}
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <MapPin size={14} /> Atelier In-Person Walk-in / Pickup
                            </>
                          )}
                        </span>
                      </div>

                      {/* Client measurements summary */}
                      {order.customer?.measurements && Object.keys(order.customer.measurements).length > 0 && (
                        <div className="order-measurements-preview">
                          <span className="detail-label">Measurements:</span>
                          <div className="meas-tags">
                            {Object.entries(order.customer.measurements).map(([k, v]) => (
                              <span className="meas-tag" key={k}>
                                {k}: <strong>{v}</strong>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Tailoring Lifecycle Status Changer */}
                    <div className="order-card__actions">
                      <label>Update Tailoring Stage:</label>
                      <select
                        value={order.status}
                        disabled={statusUpdating === order.id}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      >
                        <option value="received">1. Received</option>
                        <option value="measuring">2. Measuring</option>
                        <option value="cutting">3. Cutting Fabric</option>
                        <option value="stitching">4. Stitching & Detailing</option>
                        <option value="ready">5. Ready for Pickup/Dispatch</option>
                        <option value="delivered">6. Delivered / Completed</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Measurement Book */}
        {activeTab === 'customers' && (
          <div className="admin-content">
            <form className="admin-search-bar" onSubmit={handleCustomerSearch}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Search measurement book by client name or phone number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="btn btn--gold btn--small" disabled={loading}>
                Look up
              </button>
            </form>

            <div className="customers-list">
              {searchResults.length === 0 ? (
                <div className="admin-empty">
                  <Ruler size={36} opacity={0.3} />
                  <p>Search for a client or enter a phone number above.</p>
                  <p className="text-muted">
                    Clients who order through your AI concierge automatically have their measurements saved here.
                  </p>
                </div>
              ) : (
                searchResults.map((cust) => (
                  <div className="customer-card glass" key={cust.id}>
                    <div className="customer-card__header">
                      <div>
                        <h3>{cust.name}</h3>
                        <span className="text-muted">📞 {cust.phone}</span>
                      </div>
                      <span className="meas-count">
                        {cust.measurements ? Object.keys(cust.measurements).length : 0} Parameters Saved
                      </span>
                    </div>

                    <div className="customer-card__measurements">
                      {cust.measurements && Object.keys(cust.measurements).length > 0 ? (
                        <div className="meas-grid">
                          {Object.entries(cust.measurements).map(([param, val]) => (
                            <div className="meas-grid-item" key={param}>
                              <span className="meas-label">{param}</span>
                              <span className="meas-val">{val}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted">No measurements recorded yet for this client.</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Atelier Settings */}
        {activeTab === 'profile' && (
          <div className="admin-content">
            <form className="atelier-settings-form" onSubmit={handleSaveProfile}>
              {saveSuccess && (
                <div className="auth-success-badge">
                  <CheckCircle2 size={16} /> Profile settings updated successfully!
                </div>
              )}

              <div className="auth-form__group">
                <label>Brand / Atelier Display Name</label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                />
              </div>

              <div className="auth-form__group">
                <label>WhatsApp Number (Receives incoming automated order alerts)</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="auth-form__group">
                <label>Atelier Physical City / Address</label>
                <input
                  type="text"
                  placeholder="e.g. Victoria Island, Lagos"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="auth-form__group">
                <label>Atelier Bio / Specialty Statement</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn--gold" disabled={profileSaving}>
                {profileSaving ? 'Saving...' : 'Save Atelier Profile'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
