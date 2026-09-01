import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../utils/api';

const FEATURE_GROUPS = [
  {
    title: 'Site & access',
    description: 'Manage the public experience and customer access.',
    cards: [
      { section: 'Homepage', label: 'Homepage', icon: 'H', statKey: 'total_homepage_slides', suffix: 'active slides', accent: 'blue' },
      { section: 'Users', label: 'Users', icon: 'U', statKey: 'total_users', suffix: 'registered accounts', accent: 'violet' },
    ],
  },
  {
    title: 'Catalog management',
    description: 'Maintain every customer-facing solution and its merchandising.',
    cards: [
      { section: 'Products', label: 'Products', icon: 'P', statKey: 'total_products', suffix: 'active items', accent: 'blue' },
      { section: 'Reagents', label: 'Reagents', icon: 'R', statKey: 'total_reagents', suffix: 'active items', accent: 'green' },
      { section: 'Services', label: 'Services', icon: 'S', statKey: 'total_services', suffix: 'active services', accent: 'violet' },
      { section: 'Featured Solutions', label: 'Featured Solutions', icon: 'F', statKey: 'total_featured_solutions', suffix: 'homepage features', accent: 'amber' },
    ],
  },
  {
    title: 'Content & company',
    description: 'Publish resources, news, and core company information.',
    cards: [
      { section: 'Blogs', label: 'Blogs', icon: 'B', statKey: 'total_blogs', detailKey: 'total_blog_categories', detailSuffix: 'categories', suffix: 'published posts', accent: 'green' },
      { section: 'About BioArk', label: 'About BioArk', icon: 'A', statKey: 'total_about_records', suffix: 'active content blocks', accent: 'blue' },
      { section: 'Investors', label: 'Investors', icon: 'I', statKey: 'total_investor_records', suffix: 'active content blocks', accent: 'violet' },
    ],
  },
  {
    title: 'Operations',
    description: 'Handle customer requests, files, email delivery, and media.',
    cards: [
      { section: 'Quotes', label: 'Quotes', icon: 'Q', statKey: 'total_quotes', detailKey: 'unread_quotes', detailSuffix: 'need review', suffix: 'customer requests', accent: 'rose' },
      { section: 'Documents', label: 'Documents', icon: 'D', statKey: 'total_documents', suffix: 'resource files', accent: 'cyan' },
      { section: 'Email (SMTP)', label: 'Email (SMTP)', icon: 'E', displayValue: 'SMTP', suffix: 'templates & delivery', accent: 'slate' },
      { section: 'Media', label: 'Media', icon: 'M', statKey: 'total_media', suffix: 'uploaded images', accent: 'amber' },
    ],
  },
];

const formatNumber = (value, loading) => {
  if (loading) return '--';
  return Number(value || 0).toLocaleString();
};

const formatQuoteDate = (value) => {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  }).format(date);
};

function AdminDashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/admin-panel/dashboard/');
      setStats(data);
    } catch (err) {
      setError(err.message || 'Dashboard data could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Loading is intentionally triggered when the dashboard is mounted.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard();
  }, [loadDashboard]);

  const catalog = useMemo(() => {
    const products = Number(stats?.total_products || 0);
    const reagents = Number(stats?.total_reagents || 0);
    const services = Number(stats?.total_services || 0);
    const total = products + reagents + services;
    const productEnd = total ? (products / total) * 360 : 0;
    const reagentEnd = total ? productEnd + (reagents / total) * 360 : 0;
    return { total, products, reagents, services, productEnd, reagentEnd };
  }, [stats]);

  const unreadQuotes = Number(stats?.unread_quotes || 0);
  const totalQuotes = Number(stats?.total_quotes || 0);
  const reviewedPercent = totalQuotes
    ? Math.max(0, Math.round(((totalQuotes - unreadQuotes) / totalQuotes) * 100))
    : 100;

  const metricCards = [
    { label: 'Active catalog', value: stats?.total_catalog_items, note: `${stats?.inactive_catalog_items || 0} inactive`, tone: 'blue' },
    { label: 'Content assets', value: stats?.total_content_assets, note: 'Blogs, files & media', tone: 'green' },
    { label: 'Registered users', value: stats?.total_users, note: 'Customer accounts', tone: 'violet' },
    { label: 'Quote requests', value: stats?.total_quotes, note: `${unreadQuotes} need review`, tone: unreadQuotes ? 'rose' : 'cyan' },
  ];

  return (
    <div className="admin-dashboard">
      <section className="admin-dashboard-hero" aria-labelledby="admin-content-title">
        <div className="admin-dashboard-hero-copy">
          <span className="admin-dashboard-eyebrow">BioArk command center</span>
          <h2 id="admin-content-title">Dashboard Overview</h2>
          <p>Monitor your catalog, content, and customer activity from one workspace.</p>
          <div className="admin-dashboard-hero-actions">
            <a
              href="https://analytics.google.com/analytics/web/?authuser=0#/a203284310p483258026/reports/intelligenthome"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-dashboard-analytics-action"
            >
              Open Google Analytics
              <span aria-hidden="true">↗</span>
            </a>
            <button type="button" className="admin-dashboard-primary-action" onClick={() => onNavigate('Quotes')}>
              Review quote requests
              {unreadQuotes > 0 && <span>{unreadQuotes}</span>}
            </button>
            <a href="/" target="_blank" rel="noreferrer" className="admin-dashboard-secondary-action">
              View public website
            </a>
          </div>
        </div>
        <div className="admin-dashboard-hero-summary" aria-label="Active catalog summary">
          <span className="admin-dashboard-live"><i aria-hidden="true" /> Live catalog</span>
          <strong>{formatNumber(stats?.total_catalog_items, loading)}</strong>
          <span>active solutions</span>
          <div className="admin-dashboard-mini-breakdown">
            <span><b>{formatNumber(stats?.total_products, loading)}</b> products</span>
            <span><b>{formatNumber(stats?.total_reagents, loading)}</b> reagents</span>
            <span><b>{formatNumber(stats?.total_services, loading)}</b> services</span>
          </div>
        </div>
      </section>

      {error && (
        <div className="admin-dashboard-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={loadDashboard}>Try again</button>
        </div>
      )}

      <section className="admin-dashboard-metrics" aria-label="Key business metrics">
        {metricCards.map((metric) => (
          <article className={`admin-dashboard-metric tone-${metric.tone}`} key={metric.label}>
            <span className="admin-dashboard-metric-label">{metric.label}</span>
            <strong>{formatNumber(metric.value, loading)}</strong>
            <span className="admin-dashboard-metric-note">{metric.note}</span>
          </article>
        ))}
      </section>

      <section className="admin-dashboard-insights" aria-label="Dashboard insights">
        <article className="admin-dashboard-panel admin-dashboard-catalog-panel">
          <div className="admin-dashboard-panel-heading">
            <div>
              <span className="admin-dashboard-kicker">Catalog mix</span>
              <h3>Active solutions</h3>
            </div>
            <button type="button" onClick={() => onNavigate('Products')}>Manage catalog</button>
          </div>
          <div className="admin-dashboard-catalog-visual">
            <div
              className={`admin-dashboard-donut ${catalog.total ? '' : 'is-empty'}`}
              style={{
                '--product-end': `${catalog.productEnd}deg`,
                '--reagent-end': `${catalog.reagentEnd}deg`,
              }}
              aria-label={`${catalog.total} active catalog items`}
            >
              <span><strong>{formatNumber(catalog.total, loading)}</strong>total</span>
            </div>
            <div className="admin-dashboard-chart-legend">
              {[
                ['Products', catalog.products, 'products'],
                ['Reagents', catalog.reagents, 'reagents'],
                ['Services', catalog.services, 'services'],
              ].map(([label, value, className]) => (
                <div key={label}>
                  <span className={`admin-dashboard-legend-dot ${className}`} />
                  <span>{label}</span>
                  <strong>{formatNumber(value, loading)}</strong>
                  <small>{catalog.total ? Math.round((value / catalog.total) * 100) : 0}%</small>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="admin-dashboard-panel admin-dashboard-quotes-panel">
          <div className="admin-dashboard-panel-heading">
            <div>
              <span className="admin-dashboard-kicker">Customer activity</span>
              <h3>Recent quote requests</h3>
            </div>
            <button type="button" onClick={() => onNavigate('Quotes')}>View all</button>
          </div>
          <div className="admin-dashboard-review-progress">
            <div><span>Requests reviewed</span><strong>{reviewedPercent}%</strong></div>
            <span><i style={{ width: `${reviewedPercent}%` }} /></span>
          </div>
          <div className="admin-dashboard-recent-list">
            {!loading && (stats?.recent_quotes || []).length === 0 && (
              <div className="admin-dashboard-empty">No quote requests yet.</div>
            )}
            {(stats?.recent_quotes || []).map((quote) => (
              <button type="button" key={quote.id} onClick={() => onNavigate('Quotes')}>
                <span className={`admin-dashboard-quote-status ${quote.read ? 'is-read' : ''}`} aria-label={quote.read ? 'Reviewed' : 'Unread'} />
                <span className="admin-dashboard-quote-copy">
                  <strong>{quote.name}</strong>
                  <small>{quote.service_type}</small>
                </span>
                <time dateTime={quote.created_at || undefined}>{formatQuoteDate(quote.created_at)}</time>
              </button>
            ))}
            {loading && [1, 2, 3].map((item) => <div className="admin-dashboard-list-skeleton" key={item} />)}
          </div>
        </article>
      </section>

      <section className="admin-dashboard-features" aria-labelledby="admin-dashboard-features-title">
        <div className="admin-dashboard-section-heading">
          <div>
            <span className="admin-dashboard-kicker">Management workspace</span>
            <h3 id="admin-dashboard-features-title">All features</h3>
          </div>
          <p>Select a card to open its management area.</p>
        </div>

        {FEATURE_GROUPS.map((group) => (
          <div className="admin-dashboard-feature-group" key={group.title}>
            <div className="admin-dashboard-feature-group-heading">
              <h4>{group.title}</h4>
              <p>{group.description}</p>
            </div>
            <div className="admin-dashboard-feature-grid">
              {group.cards.map((card) => {
                const detail = card.detailKey ? Number(stats?.[card.detailKey] || 0) : null;
                return (
                  <button
                    type="button"
                    className={`admin-dashboard-feature-card accent-${card.accent}`}
                    key={card.section}
                    onClick={() => onNavigate(card.section)}
                  >
                    <span className="admin-dashboard-feature-icon" aria-hidden="true">{card.icon}</span>
                    <span className="admin-dashboard-feature-copy">
                      <span className="admin-dashboard-feature-title">{card.label}</span>
                      <strong>{card.displayValue || formatNumber(stats?.[card.statKey], loading)}</strong>
                      <small>{card.suffix}</small>
                      {detail !== null && detail > 0 && <em>{detail} {card.detailSuffix}</em>}
                    </span>
                    <span className="admin-dashboard-feature-arrow" aria-hidden="true">&gt;</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

export default AdminDashboard;
