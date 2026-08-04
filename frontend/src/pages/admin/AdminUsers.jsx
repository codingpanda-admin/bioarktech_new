import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../utils/api';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [userStatus, setUserStatus] = useState('active');

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 20;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const isActive = userStatus === 'active' ? 'true' : 'false';
      const url = `/api/admin-panel/users/?page_number=${page}&page_size=${pageSize}&is_active=${isActive}`;
      const data = await apiFetch(url);
      setUsers(data.results || data.users || []);
      setTotalPages(data.pages || 1);
      setTotalItems(data.total || (data.results || data.users || []).length);
    } catch (err) {
      setError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [page, userStatus]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleCreate = () => {
    setEditingUser({
      email: '',
      first_name: '',
      last_name: '',
      company: '',
      mobile: '',
      telephone: '',
      is_admin: false,
      password: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = async (userId) => {
    try {
      const data = await apiFetch(`/api/admin-panel/users/${userId}/`);
      setEditingUser({ ...(data.user || data), password: '' });
      setIsModalOpen(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleAdmin = async (userId) => {
    try {
      const data = await apiFetch(`/api/admin-panel/users/${userId}/toggle-admin/`, { method: 'POST' });
      showSuccess(data.message || 'Admin status toggled.');
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeactivate = async (userId) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;
    try {
      await apiFetch(`/api/admin-panel/users/${userId}/delete/`, { method: 'POST' });
      showSuccess('User deactivated.');
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleActivate = async (userId) => {
    if (!confirm('Are you sure you want to activate this user?')) return;
    try {
      await apiFetch(`/api/admin-panel/users/${userId}/update/`, {
        method: 'POST',
        body: { is_active: true },
      });
      showSuccess('User activated.');
      loadUsers();
    } catch (err) {
      setError(err.message);
    }
  };

  const selectUserStatus = (status) => {
    setUserStatus(status);
    setPage(1);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const isNew = !editingUser.id;
      const endpoint = isNew
        ? '/api/admin-panel/users/create/'
        : `/api/admin-panel/users/${editingUser.id}/update/`;

      const body = { ...editingUser };
      if (!body.password) delete body.password;

      await apiFetch(endpoint, { method: 'POST', body });
      showSuccess(isNew ? 'User created!' : 'User updated!');
      setIsModalOpen(false);
      setEditingUser(null);
      loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setEditingUser(prev => ({ ...prev, [field]: value }));
  };

  const filtered = users.filter(u => {
    const matchesSearch = !searchQuery || 
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.company?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === 'all' || 
      (filterRole === 'admin' && u.is_admin) || 
      (filterRole === 'customer' && !u.is_admin);
    
    return matchesSearch && matchesRole;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <>
      <div className="admin-section-header">
        <h2 id="admin-content-title">Users</h2>
        <div className="admin-section-actions">
          <div className="admin-search-box">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="admin-filter-group">
            <button 
              className={`admin-filter-btn ${filterRole === 'all' ? 'active' : ''}`}
              onClick={() => setFilterRole('all')}
            >All</button>
            <button 
              className={`admin-filter-btn ${filterRole === 'admin' ? 'active' : ''}`}
              onClick={() => setFilterRole('admin')}
            >Admins</button>
            <button 
              className={`admin-filter-btn ${filterRole === 'customer' ? 'active' : ''}`}
              onClick={() => setFilterRole('customer')}
            >Customers</button>
          </div>
          <button className="primary-button" onClick={handleCreate}>+ Add User</button>
        </div>
      </div>

      <div className="admin-tabs" role="tablist" aria-label="User status">
        <button
          type="button"
          role="tab"
          aria-selected={userStatus === 'active'}
          className={userStatus === 'active' ? 'is-active' : ''}
          onClick={() => selectUserStatus('active')}
        >
          Active Users
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={userStatus === 'deactivated'}
          className={userStatus === 'deactivated' ? 'is-active' : ''}
          onClick={() => selectUserStatus('deactivated')}
        >
          Deactivated Users
        </button>
      </div>

      {successMsg && <div className="admin-alert success">{successMsg}</div>}
      {error && <div className="admin-alert error">{error}</div>}

      {loading ? (
        <div className="admin-empty-table">Loading users...</div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty-table">No users found.</div>
      ) : (
        <>
          <div className="admin-data-table-wrap">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || '—';
                  const phone = user.mobile || user.telephone || '—';
                  return (
                    <tr key={user.id}>
                      <td><strong>{fullName}</strong></td>
                      <td>{user.email}</td>
                      <td>{user.company || '—'}</td>
                      <td>{phone}</td>
                      <td>
                        <span className={`admin-badge ${user.is_admin ? 'badge-accent' : 'badge-default'}`}>
                          {user.is_admin ? 'Admin' : 'Customer'}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-badge ${user.is_active ? 'badge-success' : 'badge-muted'}`}>
                          {user.is_active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td>{formatDate(user.date_joined)}</td>
                      <td>
                        <div className="admin-row-actions">
                          <button className="admin-action-btn edit" onClick={() => handleEdit(user.id)}>Edit</button>
                          {user.is_active && (
                            <button className="admin-action-btn toggle" onClick={() => handleToggleAdmin(user.id)}>
                              {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                            </button>
                          )}
                          {user.is_active ? (
                            <button className="admin-action-btn delete" onClick={() => handleDeactivate(user.id)}>Deactivate</button>
                          ) : (
                            <button className="admin-action-btn edit" onClick={() => handleActivate(user.id)}>Activate</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Pagination UI */}
          <div className="admin-pagination">
            <button 
              className="admin-page-btn" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span className="admin-page-info">
              Page {page} of {totalPages} (Total: {totalItems} users)
            </span>
            <button 
              className="admin-page-btn" 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}

      {isModalOpen && editingUser && (
        <div className="admin-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{editingUser.id ? 'Edit User' : 'Create User'}</h3>
              <button className="admin-modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSave} className="admin-modal-body">
              <div className="admin-form-grid">
                <label className="admin-form-field">
                  <span>First Name</span>
                  <input type="text" value={editingUser.first_name || ''} onChange={(e) => updateField('first_name', e.target.value)} />
                </label>
                <label className="admin-form-field">
                  <span>Last Name</span>
                  <input type="text" value={editingUser.last_name || ''} onChange={(e) => updateField('last_name', e.target.value)} />
                </label>
                <label className="admin-form-field">
                  <span>Email *</span>
                  <input type="email" value={editingUser.email || ''} onChange={(e) => updateField('email', e.target.value)} required />
                </label>
                {!editingUser.id && (
                  <label className="admin-form-field">
                    <span>Password</span>
                    <input type="password" value={editingUser.password || ''} onChange={(e) => updateField('password', e.target.value)} placeholder="Leave blank for invite-only" />
                  </label>
                )}
                <label className="admin-form-field">
                  <span>Company</span>
                  <input type="text" value={editingUser.company || ''} onChange={(e) => updateField('company', e.target.value)} />
                </label>
                <label className="admin-form-field">
                  <span>Mobile</span>
                  <input type="text" value={editingUser.mobile || ''} onChange={(e) => updateField('mobile', e.target.value)} />
                </label>
                <label className="admin-form-field">
                  <span>Telephone</span>
                  <input type="text" value={editingUser.telephone || ''} onChange={(e) => updateField('telephone', e.target.value)} />
                </label>
              </div>
              <div className="admin-form-toggles">
                <label className="admin-toggle">
                  <input type="checkbox" checked={!!editingUser.is_admin} onChange={(e) => updateField('is_admin', e.target.checked)} />
                  <span>Admin Privileges</span>
                </label>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="secondary-admin-button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button" disabled={saving}>
                  {saving ? 'Saving...' : (editingUser.id ? 'Update User' : 'Create User')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminUsers;
