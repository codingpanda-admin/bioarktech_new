import React, { useEffect, useState } from 'react';
import { apiFetch, formatAssetUrl } from '../utils/api';

const emptyProfile = {
  firstName: '',
  lastName: '',
  title: '',
  company: '',
  jobTitle: '',
  mobile: '',
  telephone: '',
  addressLine1: '',
  addressLine2: '',
  aptSuite: '',
  city: '',
  state: '',
  country: 'US',
  zipcode: '',
};

function ProfilePage({ navigate, initialTab }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'personal'); // 'personal', 'address', 'orders', 'security'

  useEffect(() => {
    setActiveTab(initialTab || 'personal');
  }, [initialTab]);
  const [formData, setFormData] = useState(emptyProfile);
  const [profilePicture, setProfilePicture] = useState(null);
  const [readOnlyData, setReadOnlyData] = useState({
    email: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  
  // Security change password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState({ type: '', message: '' });

  // Order history state
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Load profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setStatus({ type: '', message: '' });

      try {
        const user = await apiFetch('/api/users/view-user-info/');
        const address = user.shipping_address || {};

        setFormData({
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          title: user.title || '',
          company: user.company || '',
          jobTitle: user.job_title || '',
          mobile: user.mobile || '',
          telephone: user.telephone || '',
          addressLine1: address.address_line_1 || '',
          addressLine2: address.address_line_2 || '',
          aptSuite: address.apt_suite || '',
          city: address.city || '',
          state: address.state || '',
          country: address.country || 'US',
          zipcode: address.zipcode || '',
        });

        setReadOnlyData({
          email: user.email || '',
        });

        setProfilePicture(user.profile_picture || null);
      } catch (err) {
        setStatus({ type: 'error', message: err.message || 'Failed to load profile.' });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Fetch orders when orders tab is active
  useEffect(() => {
    if (activeTab === 'orders') {
      const fetchOrders = async () => {
        setOrdersLoading(true);
        try {
          const res = await apiFetch('/api/users/view-orders/?page_size=30');
          setOrders(res.order_items || []);
        } catch (err) {
          console.error('Error fetching orders:', err);
        } finally {
          setOrdersLoading(false);
        }
      };
      fetchOrders();
    }
  }, [activeTab]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handlePasswordInputChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
  };

  // Submit profile edits (Personal info or Address)
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await apiFetch('/api/users/update-user-info/', {
        method: 'POST',
        body: formData,
      });

      if (response.user) {
        const address = response.user.shipping_address || {};
        setFormData((current) => ({
          ...current,
          firstName: response.user.first_name || '',
          lastName: response.user.last_name || '',
          title: response.user.title || '',
          company: response.user.company || '',
          jobTitle: response.user.job_title || '',
          mobile: response.user.mobile || '',
          telephone: response.user.telephone || '',
          addressLine1: address.address_line_1 || '',
          addressLine2: address.address_line_2 || '',
          aptSuite: address.apt_suite || '',
          city: address.city || '',
          state: address.state || '',
          country: address.country || current.country || 'US',
          zipcode: address.zipcode || '',
        }));
        setProfilePicture(response.user.profile_picture || null);
      }

      setStatus({ type: 'success', message: 'Profile updated successfully.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Failed to save profile.' });
    } finally {
      setSaving(false);
    }
  };

  // Profile Picture Upload Handler
  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileFormData = new FormData();
    fileFormData.append('profile_picture', file);

    setSaving(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await apiFetch('/api/users/upload-profile-picture/', {
        method: 'POST',
        body: fileFormData,
      });

      if (response.user) {
        setProfilePicture(response.user.profile_picture);
        setStatus({ type: 'success', message: 'Profile picture updated successfully.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Failed to upload profile picture.' });
    } finally {
      setSaving(false);
    }
  };

  // Submit Password Change
  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordSaving(true);
    setPasswordStatus({ type: '', message: '' });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New password and confirmation do not match.' });
      setPasswordSaving(false);
      return;
    }

    try {
      await apiFetch('/api/users/reset-user-password/', {
        method: 'POST',
        body: passwordForm,
      });

      setPasswordStatus({ type: 'success', message: 'Password updated successfully.' });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setPasswordStatus({ type: 'error', message: err.message || 'Failed to update password.' });
    } finally {
      setPasswordSaving(false);
    }
  };

  // Helper to format order status badge
  const renderStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    let label = status;
    let colorClass = 'status-pending';

    if (s === 'paid' || s === 'completed') {
      label = 'Paid';
      colorClass = 'status-paid';
    } else if (s === 'in_progress' || s === 'invoiced') {
      label = 'In Progress';
      colorClass = 'status-progress';
    } else if (s === 'cancelled') {
      label = 'Cancelled';
      colorClass = 'status-cancelled';
    }

    return <span className={`status-badge ${colorClass}`}>{label}</span>;
  };

  // Get initials for profile picture replacement
  const getInitials = () => {
    const f = formData.firstName ? formData.firstName.charAt(0).toUpperCase() : '';
    const l = formData.lastName ? formData.lastName.charAt(0).toUpperCase() : '';
    return f + l || readOnlyData.email.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto' }} />
      </main>
    );
  }

  return (
    <main className="profile-page" style={{ paddingBottom: '60px' }}>
      {/* Premium Inline Styles */}
      <style>{`
        .profile-container-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 32px;
          width: min(1200px, calc(100% - 48px));
          margin: 40px auto;
        }
        @media (max-width: 992px) {
          .profile-container-layout {
            grid-template-columns: 1fr;
          }
        }
        .profile-sidebar-card {
          background: #fff;
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: fit-content;
        }
        .avatar-uploader-container {
          position: relative;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          overflow: hidden;
          margin-bottom: 16px;
          background: var(--panel);
          border: 2px solid var(--line);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.3s;
        }
        .avatar-uploader-container:hover {
          border-color: var(--blue);
        }
        .avatar-image-pic {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .avatar-initials-pic {
          font-size: 36px;
          font-weight: 700;
          color: var(--blue);
        }
        .avatar-file-label {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          background: rgba(0, 0, 0, 0.6);
          color: #fff;
          text-align: center;
          font-size: 11px;
          padding: 4px 0;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .avatar-uploader-container:hover .avatar-file-label {
          opacity: 1;
        }
        .profile-sidebar-nav {
          width: 100%;
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .profile-sidebar-tab {
          width: 100%;
          padding: 12px 16px;
          border: none;
          background: transparent;
          border-radius: 8px;
          text-align: left;
          font-size: 14px;
          font-weight: 500;
          color: var(--muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.2s;
        }
        .profile-sidebar-tab:hover {
          background: var(--panel);
          color: var(--ink);
        }
        .profile-sidebar-tab.active {
          background: rgba(59, 130, 246, 0.08);
          color: var(--blue);
          font-weight: 600;
        }
        .profile-content-card {
          background: #fff;
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 32px;
        }
        .orders-table-wrapper {
          overflow-x: auto;
          margin-top: 16px;
        }
        .orders-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 14px;
        }
        .orders-table th {
          padding: 12px 16px;
          background: var(--panel);
          border-bottom: 2px solid var(--line);
          font-weight: 600;
          color: var(--muted);
        }
        .orders-table td {
          padding: 16px;
          border-bottom: 1px solid var(--line);
        }
        .orders-table tr:hover {
          background: rgba(0, 0, 0, 0.01);
        }
        .status-badge {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }
        .status-paid {
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
        }
        .status-progress {
          background: rgba(59, 130, 246, 0.1);
          color: #2563eb;
        }
        .status-pending {
          background: rgba(245, 158, 11, 0.1);
          color: #d97706;
        }
        .status-cancelled {
          background: rgba(244, 63, 94, 0.1);
          color: #e11d48;
        }
      `}</style>

      <section className="profile-header" style={{ width: 'min(1200px, calc(100% - 48px))', margin: '40px auto 0' }}>
        <div>
          <h1 style={{ fontWeight: 700 }}>My Account</h1>
          <p style={{ color: 'var(--muted)', fontSize: '15px' }}>Manage your profile, shipping addresses, and review your purchases.</p>
        </div>
      </section>

      <div className="profile-container-layout">
        {/* Left Sidebar */}
        <aside className="profile-sidebar-card">
          <div className="avatar-uploader-container">
            {profilePicture ? (
              <img src={formatAssetUrl(profilePicture)} alt="Profile" className="avatar-image-pic" />
            ) : (
              <div className="avatar-initials-pic">{getInitials()}</div>
            )}
            <label htmlFor="profile-pic-upload" className="avatar-file-label">
              Change Photo
            </label>
            <input 
              type="file" 
              id="profile-pic-upload" 
              accept="image/*" 
              onChange={handleProfilePictureChange} 
              style={{ display: 'none' }} 
            />
          </div>

          <h3 style={{ margin: '4px 0', fontSize: '16px', fontWeight: 600 }}>{formData.firstName} {formData.lastName}</h3>
          <span style={{ fontSize: '13px', color: 'var(--muted)', wordBreak: 'break-all' }}>{readOnlyData.email}</span>

          <nav className="profile-sidebar-nav">
            <button 
              type="button" 
              className={`profile-sidebar-tab ${activeTab === 'personal' ? 'active' : ''}`}
              onClick={() => { setActiveTab('personal'); setStatus({ type: '', message: '' }); }}
            >
              👤 Personal Information
            </button>
            <button 
              type="button" 
              className={`profile-sidebar-tab ${activeTab === 'address' ? 'active' : ''}`}
              onClick={() => { setActiveTab('address'); setStatus({ type: '', message: '' }); }}
            >
              📍 Shipping Address
            </button>
            <button 
              type="button" 
              className={`profile-sidebar-tab ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => { setActiveTab('orders'); setStatus({ type: '', message: '' }); }}
            >
              🛍️ Order History
            </button>
            <button 
              type="button" 
              className={`profile-sidebar-tab ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => { setActiveTab('security'); setStatus({ type: '', message: '' }); }}
            >
              🔒 Security
            </button>
          </nav>
        </aside>

        {/* Right Main Content */}
        <section className="profile-content-card">
          {status.message && (
            <div className={`alert-banner ${status.type}`} style={{
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              marginBottom: '24px',
              background: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
              color: status.type === 'success' ? '#059669' : '#e11d48',
              border: `1px solid ${status.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`
            }}>
              {status.message}
            </div>
          )}

          {/* TAB 1: PERSONAL INFORMATION */}
          {activeTab === 'personal' && (
            <form onSubmit={handleSubmit}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>
                Personal Information
              </h2>
              <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <label>
                  First Name
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} />
                </label>
                <label>
                  Last Name
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} />
                </label>
                <label>
                  Title / Greeting (e.g. Dr., Prof.)
                  <input type="text" name="title" value={formData.title} onChange={handleInputChange} />
                </label>
                <label>
                  Company / Institution
                  <input type="text" name="company" value={formData.company} onChange={handleInputChange} />
                </label>
                <label>
                  Job Title
                  <input type="text" name="jobTitle" value={formData.jobTitle} onChange={handleInputChange} />
                </label>
                <label>
                  Mobile Phone
                  <input type="tel" name="mobile" value={formData.mobile} onChange={handleInputChange} />
                </label>
                <label>
                  Office Telephone
                  <input type="tel" name="telephone" value={formData.telephone} onChange={handleInputChange} />
                </label>
              </div>
              <button type="submit" className="primary-button" disabled={saving} style={{ marginTop: '24px', padding: '12px 24px', borderRadius: '8px' }}>
                {saving ? 'Saving...' : 'Save Personal Info'}
              </button>
            </form>
          )}

          {/* TAB 2: SHIPPING ADDRESS */}
          {activeTab === 'address' && (
            <form onSubmit={handleSubmit}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>
                Shipping Address
              </h2>
              <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <label className="full-span" style={{ gridColumn: 'span 2' }}>
                  Address Line 1
                  <input type="text" name="addressLine1" value={formData.addressLine1} onChange={handleInputChange} />
                </label>
                <label className="full-span" style={{ gridColumn: 'span 2' }}>
                  Address Line 2
                  <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleInputChange} />
                </label>
                <label>
                  Apt / Suite / Dept
                  <input type="text" name="aptSuite" value={formData.aptSuite} onChange={handleInputChange} />
                </label>
                <label>
                  City
                  <input type="text" name="city" value={formData.city} onChange={handleInputChange} />
                </label>
                <label>
                  State / Province
                  <input type="text" name="state" value={formData.state} onChange={handleInputChange} />
                </label>
                <label>
                  Country
                  <input type="text" name="country" value={formData.country} onChange={handleInputChange} />
                </label>
                <label>
                  ZIP / Postal Code
                  <input type="text" name="zipcode" value={formData.zipcode} onChange={handleInputChange} />
                </label>
              </div>
              <button type="submit" className="primary-button" disabled={saving} style={{ marginTop: '24px', padding: '12px 24px', borderRadius: '8px' }}>
                {saving ? 'Saving...' : 'Save Shipping Address'}
              </button>
            </form>
          )}

          {/* TAB 3: ORDER HISTORY */}
          {activeTab === 'orders' && (
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>
                Order History
              </h2>

              {ordersLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div className="spinner" style={{ margin: '0 auto' }} />
                </div>
              ) : orders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--muted)' }}>
                  <p style={{ fontSize: '16px', marginBottom: '8px' }}>You haven't made any purchases yet.</p>
                  <button type="button" className="secondary-button" onClick={() => navigate('/')} style={{ marginTop: '12px' }}>
                    Browse Products
                  </button>
                </div>
              ) : (
                <div className="orders-table-wrapper">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Order ID</th>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Total Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((item) => (
                        <tr key={item.order_item_id}>
                          <td>{item.order_placed_date || 'N/A'}</td>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--blue)' }}>
                              {item.order_id}
                            </span>
                          </td>
                          <td>
                            <strong>{item.product_name}</strong>
                            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                              SKU: {item.product_sku} {item.unit_size ? `(${item.unit_size})` : ''}
                            </div>
                          </td>
                          <td>{item.quantity}</td>
                          <td>
                            <strong>${Number(item.total_price).toFixed(2)}</strong>
                          </td>
                          <td>{renderStatusBadge(item.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SECURITY */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSubmit}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>
                Change Password
              </h2>

              {passwordStatus.message && (
                <div className={`alert-banner ${passwordStatus.type}`} style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  marginBottom: '20px',
                  background: passwordStatus.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                  color: passwordStatus.type === 'success' ? '#059669' : '#e11d48',
                  border: `1px solid ${passwordStatus.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`
                }}>
                  {passwordStatus.message}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', fontWeight: 500 }}>
                  Current Password
                  <input 
                    type="password" 
                    name="currentPassword" 
                    value={passwordForm.currentPassword} 
                    onChange={handlePasswordInputChange} 
                    required 
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', fontWeight: 500 }}>
                  New Password
                  <input 
                    type="password" 
                    name="newPassword" 
                    value={passwordForm.newPassword} 
                    onChange={handlePasswordInputChange} 
                    required 
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px', fontWeight: 500 }}>
                  Confirm New Password
                  <input 
                    type="password" 
                    name="confirmPassword" 
                    value={passwordForm.confirmPassword} 
                    onChange={handlePasswordInputChange} 
                    required 
                    style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}
                  />
                </label>
                <button type="submit" className="primary-button" disabled={passwordSaving} style={{ marginTop: '10px', padding: '12px 24px', borderRadius: '8px', width: 'fit-content' }}>
                  {passwordSaving ? 'Saving...' : 'Change Password'}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

export default ProfilePage;
