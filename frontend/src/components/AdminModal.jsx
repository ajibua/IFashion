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
  MessageCircle,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';

const STATUS_PILLS = [
  { id: 'all', label: 'All Orders' },
  { id: 'received', label: 'New' },
  { id: 'measuring', label: 'Measuring' },
  { id: 'cutting', label: 'Cutting' },
  { id: 'stitching', label: 'Sewing' },
  { id: 'ready', label: 'Ready' },
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

  function handleShareWhatsApp() {
    const text = encodeURIComponent(
      `Hello! You can now book your bespoke tailored outfits directly with ${currentDesigner?.brand_name || 'our shop'}. Order custom native wear sewn to your exact body measurements here: ${publicLink}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
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

  // Quick order metrics
  const activeOrdersCount = orders.filter((o) => o.status !== 'delivered').length;
  const readyOrdersCount = orders.filter((o) => o.status === 'ready').length;

  return (
    <div className="admin-overlay" role="dialog" aria-modal="true" aria-label="Tailor Dashboard">
      <div className="admin-overlay__backdrop" onClick={onClose} />
      <div className="admin-panel glass-strong">
        {/* Executive Atelier Header */}
        <div className="admin-panel__header">
          <div className="admin-panel__brand-area">
            <div className="admin-panel__avatar">
              <Scissors size={20} />
            </div>
            <div className="admin-panel__title-wrap">
              <div className="admin-panel__badge-row">
                <span className="admin-badge">
                  <ShieldCheck size={13} /> Official Atelier Portal
                </span>
                {currentDesigner?.location && (
                  <span className="admin-location-tag">
                    <MapPin size={11} /> {currentDesigner.location}
                  </span>
                )}
              </div>
              <h2 className="admin-panel__title">
                {currentDesigner?.brand_name || 'My Atelier Dashboard'}
              </h2>
            </div>
          </div>

          <div className="admin-header-actions">
            <button className="btn-portal-ghost" onClick={onLogout} title="Sign Out">
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
            <button className="admin-panel__close-btn" onClick={onClose} aria-label="Close dashboard">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Shareable Storefront Link Bar */}
        {currentDesigner?.handle && (
          <div className="bio-link-banner">
            <div className="bio-link-header-row">
              <div className="bio-link-title">
                <Sparkles size={14} className="text-gold" />
                <span>Your Official Atelier Storefront Link</span>
              </div>
              <span className="bio-link-sub">Share with clients on WhatsApp Status & Instagram Bio</span>
            </div>

            <div className="bio-link-control-bar">
              <div className="bio-link-pill-box" title={publicLink}>
                <span className="link-icon">✦</span>
                <span className="bio-link-text">{publicLink}</span>
              </div>

              <div className="bio-link-btn-group">
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
                      <Copy size={14} /> Copy Link
                    </>
                  )}
                </button>

                <button
                  className="btn btn--small btn-whatsapp-share"
                  onClick={handleShareWhatsApp}
                  title="Share directly to WhatsApp"
                >
                  <MessageCircle size={14} /> WhatsApp
                </button>

                <a
                  href={publicLink}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn--outline btn--small"
                  title="View your live public storefront"
                >
                  <ExternalLink size={14} /> View
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Floating Segmented Navigation Tabs */}
        <div className="admin-tabs-bar">
          <div className="admin-segmented-tabs">
            <button
              className={`admin-segment-tab ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <Package size={15} />
              <span>Orders</span>
              <span className="tab-pill-count">{orders.length}</span>
            </button>
            <button
              className={`admin-segment-tab ${activeTab === 'customers' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('customers');
                if (searchResults.length === 0) handleCustomerSearch();
              }}
            >
              <Ruler size={15} />
              <span>Measurement Book</span>
            </button>
            <button
              className={`admin-segment-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={15} />
              <span>Atelier Settings</span>
            </button>
          </div>

          {activeTab === 'orders' && (
            <button
              className="admin-refresh-btn"
              onClick={fetchOrders}
              disabled={loading}
              title="Refresh order list"
            >
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          )}
        </div>

        {/* Tab 1: Orders View */}
        {activeTab === 'orders' && (
          <div className="admin-content">
            {/* Quick Metrics Strip */}
            {orders.length > 0 && (
              <div className="admin-metrics-strip">
                <div className="metric-chip">
                  <span className="metric-chip__num">{orders.length}</span>
                  <span className="metric-chip__lbl">Total Orders</span>
                </div>
                <div className="metric-chip">
                  <span className="metric-chip__num text-gold">{activeOrdersCount}</span>
                  <span className="metric-chip__lbl">In Progress</span>
                </div>
                <div className="metric-chip">
                  <span className="metric-chip__num text-green">{readyOrdersCount}</span>
                  <span className="metric-chip__lbl">Ready for Pickup</span>
                </div>
              </div>
            )}

            {/* Filter Pills Toolbar */}
            <div className="orders-toolbar">
              <div className="status-filter-pills">
                {STATUS_PILLS.map((pill) => {
                  const count =
                    pill.id === 'all'
                      ? orders.length
                      : orders.filter((o) => o.status === pill.id).length;
                  return (
                    <button
                      key={pill.id}
                      className={`status-pill ${statusFilter === pill.id ? 'status-pill--active' : ''}`}
                      onClick={() => setStatusFilter(pill.id)}
                    >
                      <span>{pill.label}</span>
                      {count > 0 && <span className="pill-counter">{count}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Orders Feed */}
            {loading && orders.length === 0 ? (
              <div className="admin-empty">
                <RefreshCw size={28} className="spin text-gold" />
                <p>Loading your atelier orders...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="admin-empty-card">
                <div className="empty-icon-circle">
                  <Package size={32} />
                </div>
                <h3>No Orders In This Category</h3>
                <p>
                  Share your personalized link on your WhatsApp Status or Instagram Bio. When customers order through your storefront, their verified sizes and style requests appear right here!
                </p>
                <div className="empty-actions">
                  <button className="btn btn--gold btn--small" onClick={handleCopyLink}>
                    <Copy size={14} /> Copy Storefront Link
                  </button>
                  <button className="btn btn--outline btn--small" onClick={handleShareWhatsApp}>
                    <MessageCircle size={14} /> Share on WhatsApp
                  </button>
                </div>
              </div>
            ) : (
              <div className="orders-grid">
                {filteredOrders.map((order) => (
                  <div className="order-card" key={order.id}>
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
                      <div className="order-detail-row client-row">
                        <span className="detail-label">Client:</span>
                        <div className="client-contact-box">
                          <strong>{order.customer?.name || 'Walk-in Client'}</strong>
                          {order.customer?.phone && (
                            <div className="client-contact-links">
                              <a href={`tel:${order.customer.phone}`} className="contact-chip" title="Call client">
                                <Phone size={11} /> {order.customer.phone}
                              </a>
                              <a
                                href={`https://wa.me/${order.customer.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="contact-chip contact-chip--wa"
                                title="Chat on WhatsApp"
                              >
                                <MessageCircle size={11} /> Chat
                              </a>
                            </div>
                          )}
                        </div>
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
                              <MapPin size={14} /> Workshop In-Person Pickup
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
                        className="status-select"
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
              <Search size={16} className="search-icon" />
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
                <div className="admin-empty-card">
                  <div className="empty-icon-circle">
                    <Ruler size={32} />
                  </div>
                  <h3>No Clients Looked Up Yet</h3>
                  <p>
                    Enter a client's name or phone number in the search bar above to look up their exact body measurements.
                  </p>
                </div>
              ) : (
                searchResults.map((cust) => (
                  <div className="customer-card" key={cust.id}>
                    <div className="customer-card__header">
                      <div className="customer-avatar-row">
                        <div className="cust-initials">
                          {cust.name ? cust.name.slice(0, 2).toUpperCase() : 'CL'}
                        </div>
                        <div>
                          <h3>{cust.name}</h3>
                          <a href={`tel:${cust.phone}`} className="text-muted text-phone">
                            📞 {cust.phone}
                          </a>
                        </div>
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
                  <CheckCircle2 size={16} /> Atelier profile updated successfully!
                </div>
              )}

              <div className="form-grid-2">
                <div className="auth-form__group">
                  <label>Brand / Atelier Display Name</label>
                  <input
                    type="text"
                    required
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. Light Fashion Concept"
                  />
                </div>

                <div className="auth-form__group">
                  <label>WhatsApp Number (Receives Order Alerts)</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 08012345678"
                  />
                </div>
              </div>

              <div className="auth-form__group">
                <label>Workshop / Atelier Physical Location</label>
                <input
                  type="text"
                  placeholder="e.g. Akure, Ondo State or Victoria Island, Lagos"
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
                  placeholder="e.g. Master tailor specializing in bespoke modern Agbada, sharp Senator suits, and handcrafted royal native wear."
                />
              </div>

              <div className="form-actions-row">
                <button type="submit" className="btn btn--gold" disabled={profileSaving}>
                  {profileSaving ? 'Saving Profile...' : 'Save Atelier Profile'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
