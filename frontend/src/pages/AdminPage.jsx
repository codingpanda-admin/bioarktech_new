import React, { useState, useEffect } from 'react';

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
import AdminSmtp from './admin/AdminSmtp';


const adminLinks = [
  'Overview',
  'Homepage',
  'Users',
  'Products',
  'Reagents',
  'Services',
  'Featured Solutions',
  'Blogs',
  'Documents',
  'Quotes',
  'Email (SMTP)',
  'Media',
];

function AdminPage({ currentUser, currentUserProfile, authChecked, onLoginSuccess, onLogout }) {
  const [activeSection, setActiveSection] = useState('Overview');
  const [featuredEditRequest, setFeaturedEditRequest] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const homepageSettings = ['Background Images', 'Hero Text', 'CTA Button', 'Metrics'];

  const handleFeaturedItemEdit = (item) => {
    const section = item.item_type === 'service'
      ? 'Services'
      : item.item_type === 'reagent'
        ? 'Reagents'
        : 'Products';

    setFeaturedEditRequest({ section, itemId: item.edit_id || item.id });
    setActiveSection(section);
  };

  const handleFeaturedEditOpened = () => {
    setFeaturedEditRequest(null);
  };

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

  const handleGoogleAdminResponse = async (response) => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/google-login/', {
        method: 'POST',
        body: { credential: response.credential }
      });
      if (onLoginSuccess) {
        await onLoginSuccess(data.email);
      }
    } catch (err) {
      setError(err.message || 'Failed to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timerId;
    const initGoogleAdmin = async () => {
      if (!currentUser && window.google) {
        try {
          let clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1047155694294-1a3b4c5d6e7f8g9h0i.apps.googleusercontent.com';
          try {
            const cfg = await apiFetch('/api/interface/get-google-auth-config/');
            if (cfg && cfg.client_id) {
              clientId = cfg.client_id;
            }
          } catch (e) {
            // fallback
          }

          if (window.google?.accounts?.id) {
            window.google.accounts.id.initialize({
              client_id: clientId,
              callback: handleGoogleAdminResponse,
              auto_select: false
            });

            timerId = setTimeout(() => {
              const btnElement = document.getElementById("admin-google-btn");
              if (btnElement && window.google?.accounts?.id) {
                window.google.accounts.id.renderButton(
                  btnElement,
                  { theme: "outline", size: "large", width: "100%", text: "signin_with" }
                );
              }
            }, 100);
          }
        } catch (err) {
          console.error("Error initializing Google Identity Services for admin:", err);
        }
      }
    };

    initGoogleAdmin();
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [currentUser]);




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

          <div style={{ marginBottom: '16px' }}>
            <div id="admin-google-btn" style={{ minHeight: '40px', display: 'flex', justifyContent: 'center' }}></div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              textAlign: 'center',
              margin: '16px 0',
              color: 'var(--muted)',
              fontSize: '12px'
            }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--line)' }}></div>
              <span style={{ padding: '0 10px', fontWeight: 500 }}>or sign in with password</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--line)' }}></div>
            </div>
          </div>

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
          <AdminProducts
            categoryFilter="products"
            initialEditId={featuredEditRequest?.section === 'Products' ? featuredEditRequest.itemId : null}
            onInitialEditHandled={handleFeaturedEditOpened}
          />
        )}

        {activeSection === 'Featured Solutions' && (
          <AdminFeaturedProducts onEditItem={handleFeaturedItemEdit} />
        )}

        {activeSection === 'Reagents' && (
          <AdminProducts
            categoryFilter="reagents"
            initialEditId={featuredEditRequest?.section === 'Reagents' ? featuredEditRequest.itemId : null}
            onInitialEditHandled={handleFeaturedEditOpened}
          />
        )}

        {activeSection === 'Services' && (
          <AdminServices
            initialEditId={featuredEditRequest?.section === 'Services' ? featuredEditRequest.itemId : null}
            onInitialEditHandled={handleFeaturedEditOpened}
          />
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
          <AdminSmtp />
        )}


        {activeSection === 'Media' && (
          <AdminMedia />
        )}
      </section>
    </main>
  );
}

export default AdminPage;
