import React, { useState } from 'react';
import { apiFetch } from '../utils/api';

// Sub-components
import AdminDashboard from './admin/AdminDashboard';
import AdminUsers from './admin/AdminUsers';
import AdminProducts from './admin/AdminProducts';
import AdminFeaturedProducts from './admin/AdminFeaturedProducts';
import AdminServices from './admin/AdminServices';
import AdminBlogs from './admin/AdminBlogs';
import AdminResources from './admin/AdminResources';
import AdminQuotes from './admin/AdminQuotes';
import AdminMedia from './admin/AdminMedia';
import AdminHomepage from './admin/AdminHomepage';

const adminLinks = [
  'Overview',
  'Homepage',
  'Users',
  'Products',
  'Featured Products',
  'Reagents',
  'Services',
  'Blogs',
  'Documents',
  'Quotes',
  'Email (SMTP)',
  'Media',
];

function AdminPage({ currentUser, currentUserProfile, authChecked, onLoginSuccess, onLogout }) {
  const [activeSection, setActiveSection] = useState('Overview');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const homepageSettings = ['Background Images', 'Hero Text', 'CTA Button', 'Metrics'];

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await apiFetch('/api/login/', {
        method: 'POST',
        body: { email, password }
      });
      if (onLoginSuccess) {
        await onLoginSuccess(email);
      }
    } catch (err) {
      setError('Failed to login, please check username and password again');
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked) {
    return (
      <main className="admin-loading-page">
        <div className="admin-spinner"></div>
        <p>Checking administrator session...</p>
      </main>
    );
  }

  // 1. Not logged in -> Show admin login form
  if (!currentUser) {
    return (
      <main className="admin-login-page">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <h2>BioArk Tech</h2>
            <p>Admin Console Sign In</p>
          </div>
          {error && <div className="admin-login-error">{error}</div>}
          <form onSubmit={handleLoginSubmit} autoComplete="off">
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                name="admin-email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                autoComplete="off"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                name="admin-password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                autoComplete="new-password"
              />
            </div>
            <button type="submit" className="admin-login-btn" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>
      </main>
    );
  }

  // 2. Logged in, but profile is still loading
  if (currentUser && !currentUserProfile) {
    return (
      <main className="admin-loading-page">
        <div className="admin-spinner"></div>
        <p>Loading administrator profile...</p>
      </main>
    );
  }

  // 3. Logged in, profile loaded, but NOT admin/staff
  const isAdmin = currentUserProfile && (currentUserProfile.is_admin || currentUserProfile.isAdmin || currentUserProfile.is_staff);
  if (!isAdmin) {
    return (
      <main className="admin-login-page">
        <div className="admin-login-card access-denied">
          <div className="admin-login-header">
            <h2>Access Denied</h2>
            <p>You do not have administrative permissions to view this console.</p>
          </div>
          <p className="logged-in-as">Logged in as: <strong>{currentUser}</strong></p>
          <div className="access-denied-actions">
            <button onClick={onLogout} className="admin-login-btn secondary">
              Sign In with different account
            </button>
            <a href="/" className="back-to-home">Back to Homepage</a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page" aria-label="Admin Console">
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <nav>
          {adminLinks.map((label) => (
            <a
              className={activeSection === label ? 'is-active' : undefined}
              href={`#${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
              key={label}
              onClick={(event) => {
                event.preventDefault();
                setActiveSection(label);
              }}
            >
              {label}
            </a>
          ))}
        </nav>
      </aside>

      <section className="admin-content" aria-labelledby="admin-content-title">
        {activeSection === 'Overview' && (
          <AdminDashboard onNavigate={(section) => setActiveSection(section)} />
        )}

        {activeSection === 'Homepage' && (
          <AdminHomepage />
        )}

        {activeSection === 'Users' && (
          <AdminUsers />
        )}

        {activeSection === 'Products' && (
          <AdminProducts categoryFilter="products" />
        )}

        {activeSection === 'Featured Products' && (
          <AdminFeaturedProducts />
        )}

        {activeSection === 'Reagents' && (
          <AdminProducts categoryFilter="reagents" />
        )}

        {activeSection === 'Services' && (
          <AdminServices />
        )}

        {activeSection === 'Blogs' && (
          <AdminBlogs />
        )}

        {activeSection === 'Documents' && (
          <AdminResources />
        )}

        {activeSection === 'Quotes' && (
          <AdminQuotes />
        )}

        {activeSection === 'Email (SMTP)' && (
          <>
            <h2 id="admin-content-title">SMTP Configuration</h2>
            <form className="smtp-form">
              <div className="smtp-grid">
                <label>
                  Host
                  <input type="text" name="smtpHost" defaultValue="smtp.gmail.com" />
                </label>
                <label>
                  Port
                  <input type="text" name="smtpPort" defaultValue="465" />
                </label>
              </div>
              <label className="smtp-check">
                <input type="checkbox" name="smtpSecure" defaultChecked />
                Secure (TLS/SSL)
              </label>
              <div className="smtp-grid">
                <label>
                  User
                  <input type="email" name="smtpUser" defaultValue="wulipeng@gmail.com" />
                </label>
                <label>
                  Password
                  <input type="password" name="smtpPassword" placeholder="SMTP password" />
                </label>
                <label>
                  From Email
                  <input type="email" name="smtpFromEmail" defaultValue="wulipeng@gmail.com" />
                </label>
                <label>
                  Admin To Emails
                  <input type="text" name="smtpAdminEmails" defaultValue="Lipengwu@bioarktech.com" />
                </label>
              </div>

              <section className="smtp-template-section" aria-labelledby="full-form-template-title">
                <h3 id="full-form-template-title">Full Form Email Template</h3>
                <p>Used by the full “Request a Quote” form.</p>
                <label>
                  Subject
                  <input type="text" name="fullSubject" defaultValue="New Quote (Full) from {{firstName}} {{lastName}} — {{serviceType}}" />
                </label>
                <label>
                  HTML Body
                  <textarea
                    name="fullBody"
                    rows="10"
                    defaultValue={`<h2>New Quote (Full) Notification</h2>\n<p><strong>Name:</strong> {{firstName}} {{lastName}}</p>\n<p><strong>Email:</strong> {{email}}</p>\n{{#if phone}}<p><strong>Phone:</strong> {{phone}}</p>{{/if}}\n<p><strong>Company:</strong> {{company}}</p>\n{{#if department}}<p><strong>Department:</strong> {{department}}</p>{{/if}}\n<p><strong>Service:</strong> {{serviceType}}</p>\n<p><strong>Description:</strong> {{projectDescription}}</p>`}
                  />
                </label>
                <button type="button" className="smtp-test-button">Test Full</button>
              </section>

              <section className="smtp-template-section" aria-labelledby="product-template-title">
                <h3 id="product-template-title">Product Quote Email Template</h3>
                <p>Used by the simplified product quote form (name, email, and product info only).</p>
                <label>
                  Subject
                  <input type="text" name="productSubject" defaultValue="New Product Quote from {{firstName}} {{lastName}}" />
                </label>
                <label>
                  HTML Body
                  <textarea
                    name="productBody"
                    rows="8"
                    defaultValue={`<h2>New Product Quote</h2>\n<p><strong>Name:</strong> {{firstName}} {{lastName}}</p>\n<p><strong>Email:</strong> {{email}}</p>\n<hr/>\n<p><strong>Product:</strong> {{projectDescription}}</p>\n{{#if catalogNumber}}<p><strong>Catalog #:</strong> {{catalogNumber}}</p>{{/if}}`}
                  />
                </label>
                <button type="button" className="smtp-test-button">Test Product</button>
              </section>

              <p className="smtp-help">
                {'Template syntax: variables like {{key}}; conditionals {{#if key}}...{{/if}}.'}
                Available keys: firstName, lastName, email, phone, company, department, serviceType, timeline,
                budget, projectDescription, additionalInfo, createdAt, and for product template, catalogNumber.
              </p>

              <div className="smtp-actions">
                <button type="button" className="secondary-admin-button">Send Test (Default)</button>
                <button type="submit" className="primary-button">Save</button>
              </div>

              <p className="smtp-note">
                Note: After deployment, the server will use the above configuration to send emails via SMTP.
                The frontend only stores these settings and exposes them for the server to read/use.
              </p>
            </form>
          </>
        )}

        {activeSection === 'Media' && (
          <AdminMedia />
        )}
      </section>
    </main>
  );
}

export default AdminPage;
