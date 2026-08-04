import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../utils/api';

function AdminDashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch('/api/admin-panel/dashboard/');
        setStats(data);
      } catch (err) {
        console.error('Dashboard stats error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cards = [
    { label: 'Products', key: 'total_products', icon: '🧬', section: 'Products', color: '#006ff2' },
    { label: 'Featured Solutions', key: 'total_featured_products', icon: '⭐', section: 'Featured Solutions', color: '#e5a800' },
    { label: 'Blog Posts', key: 'total_blogs', icon: '📝', section: 'Blogs', color: '#00b37e' },
    { label: 'Users', key: 'total_users', icon: '👥', section: 'Users', color: '#7c3aed' },
    { label: 'Quotes', key: 'total_quotes', icon: '📋', section: 'Quotes', color: '#0891b2' },
    { label: 'Unread Quotes', key: 'unread_quotes', icon: '🔔', section: 'Quotes', color: '#dc2626' },
  ];

  return (
    <>
      <h2 id="admin-content-title">Dashboard Overview</h2>
      <div className="admin-dashboard-grid">
        {cards.map((card) => (
          <button
            key={card.key}
            className="admin-stat-card"
            onClick={() => onNavigate(card.section)}
            style={{ '--card-accent': card.color }}
          >
            <span className="admin-stat-icon">{card.icon}</span>
            <div className="admin-stat-info">
              <span className="admin-stat-value">
                {loading ? '...' : (stats?.[card.key] ?? '—')}
              </span>
              <span className="admin-stat-label">{card.label}</span>
            </div>
          </button>
        ))}
      </div>
      <div className="admin-quick-actions">
        <h3>Quick Actions</h3>
        <div className="admin-quick-actions-grid">
          <button className="admin-quick-btn" onClick={() => onNavigate('Products')}>
            <span>+</span> Add Product
          </button>
          <button className="admin-quick-btn" onClick={() => onNavigate('Blogs')}>
            <span>+</span> Add Blog Post
          </button>
          <button className="admin-quick-btn" onClick={() => onNavigate('Users')}>
            <span>+</span> Add User
          </button>
          <button className="admin-quick-btn" onClick={() => onNavigate('Services')}>
            <span>+</span> Add Service
          </button>
        </div>
      </div>
    </>
  );
}

export default AdminDashboard;
