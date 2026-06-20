import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch, API_URL } from '../../utils/api';

function AdminFeaturedProducts() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingFP, setEditingFP] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadFeaturedProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/admin-panel/featured-products/');
      setFeaturedProducts(data.results || data.featured_products || []);
    } catch (err) {
      setError(err.message || 'Failed to load featured products.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeaturedProducts();
  }, [loadFeaturedProducts]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleCreate = () => {
    setEditingFP({
      catalog_number: '',
      product_name: '',
      description: '',
      key_features: '',
      performance_data: '',
      storage_info: '',
      ship_info: '',
      shelf_status: true,
      on_display: true,
      on_discount: false,
      priority: 1,
      units_in_stock: 10,
      units: 'vials',
    });
    setIsModalOpen(true);
  };

  const handleEdit = async (fpId) => {
    try {
      const data = await apiFetch(`/api/admin-panel/featured-products/${fpId}/`);
      setEditingFP(data);
      setIsModalOpen(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (fpId) => {
    if (!confirm('Are you sure you want to delete this featured product?')) return;
    try {
      await apiFetch(`/api/admin-panel/featured-products/${fpId}/delete/`, { method: 'POST' });
      showSuccess('Featured product deleted successfully.');
      loadFeaturedProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const isNew = !editingFP.id;
      const endpoint = isNew
        ? '/api/admin-panel/featured-products/create/'
        : `/api/admin-panel/featured-products/${editingFP.id}/update/`;

      await apiFetch(endpoint, {
        method: 'POST',
        body: editingFP,
      });

      showSuccess(isNew ? 'Featured product created!' : 'Featured product updated!');
      setIsModalOpen(false);
      setEditingFP(null);
      loadFeaturedProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setEditingFP(prev => ({ ...prev, [field]: value }));
  };

  const filtered = featuredProducts.filter(fp =>
    !searchQuery ||
    fp.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fp.catalog_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="admin-section-header">
        <h2 id="admin-content-title">Featured Products</h2>
        <div className="admin-section-actions">
          <div className="admin-search-box">
            <input
              type="text"
              placeholder="Search featured..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="primary-button" onClick={handleCreate}>+ Add Featured Product</button>
        </div>
      </div>

      {successMsg && <div className="admin-alert success">{successMsg}</div>}
      {error && <div className="admin-alert error">{error}</div>}

      {loading ? (
        <div className="admin-empty-table">Loading featured products...</div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty-table">No featured products found.</div>
      ) : (
        <div className="admin-data-table-wrap">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Catalog #</th>
                <th>Priority</th>
                <th>In Stock</th>
                <th>Discount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((fp) => (
                <tr key={fp.id}>
                  <td>
                    <div className="admin-product-cell">
                      {fp.images && fp.images.length > 0 && (
                        <img
                          src={fp.images[0].url}
                          alt=""
                          className="admin-thumb"
                        />
                      )}
                      <span>{fp.product_name}</span>
                    </div>
                  </td>
                  <td><code>{fp.catalog_number}</code></td>
                  <td>{fp.priority}</td>
                  <td>{fp.units_in_stock} {fp.units}</td>
                  <td>
                    <span className={`admin-badge ${fp.on_discount ? 'badge-accent' : 'badge-muted'}`}>
                      {fp.on_discount ? 'Discounted' : 'Normal'}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-badge ${fp.shelf_status ? 'badge-success' : 'badge-muted'}`}>
                      {fp.shelf_status ? 'Active' : 'Draft'}
                    </span>
                    {fp.on_display && <span className="admin-badge badge-accent">On Display</span>}
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button className="admin-action-btn edit" onClick={() => handleEdit(fp.id)}>Edit</button>
                      <button className="admin-action-btn delete" onClick={() => handleDelete(fp.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && editingFP && (
        <div className="admin-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="admin-modal admin-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{editingFP.id ? 'Edit Featured Product' : 'Create Featured Product'}</h3>
              <button className="admin-modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSave} className="admin-modal-body">
              <div className="admin-form-grid">
                <label className="admin-form-field span-2">
                  <span>Product Name *</span>
                  <input type="text" value={editingFP.product_name || ''} onChange={(e) => updateField('product_name', e.target.value)} required />
                </label>
                <label className="admin-form-field">
                  <span>Catalog Number *</span>
                  <input type="text" value={editingFP.catalog_number || ''} onChange={(e) => updateField('catalog_number', e.target.value)} required />
                </label>
                <label className="admin-form-field">
                  <span>Priority (Order)</span>
                  <input type="number" value={editingFP.priority || 1} onChange={(e) => updateField('priority', parseInt(e.target.value) || 1)} />
                </label>
                <label className="admin-form-field">
                  <span>Units in Stock</span>
                  <input type="number" value={editingFP.units_in_stock || 0} onChange={(e) => updateField('units_in_stock', parseInt(e.target.value) || 0)} />
                </label>
                <label className="admin-form-field">
                  <span>Unit Label (e.g. pcs, vials)</span>
                  <input type="text" value={editingFP.units || ''} onChange={(e) => updateField('units', e.target.value)} />
                </label>
                <label className="admin-form-field">
                  <span>Shipping Info</span>
                  <input type="text" value={editingFP.ship_info || ''} onChange={(e) => updateField('ship_info', e.target.value)} placeholder="e.g. Ship with dry ice" />
                </label>
                <label className="admin-form-field span-3">
                  <span>Description (HTML)</span>
                  <textarea rows="4" value={editingFP.description || ''} onChange={(e) => updateField('description', e.target.value)} />
                </label>
                <label className="admin-form-field span-3">
                  <span>Key Features (HTML)</span>
                  <textarea rows="4" value={editingFP.key_features || ''} onChange={(e) => updateField('key_features', e.target.value)} />
                </label>
                <label className="admin-form-field span-3">
                  <span>Performance Data (HTML)</span>
                  <textarea rows="4" value={editingFP.performance_data || ''} onChange={(e) => updateField('performance_data', e.target.value)} />
                </label>
                <label className="admin-form-field span-3">
                  <span>Storage Info (HTML)</span>
                  <textarea rows="3" value={editingFP.storage_info || ''} onChange={(e) => updateField('storage_info', e.target.value)} />
                </label>
              </div>
              <div className="admin-form-toggles">
                <label className="admin-toggle">
                  <input type="checkbox" checked={!!editingFP.shelf_status} onChange={(e) => updateField('shelf_status', e.target.checked)} />
                  <span>On Sale / Active (Shelf Status)</span>
                </label>
                <label className="admin-toggle">
                  <input type="checkbox" checked={!!editingFP.on_display} onChange={(e) => updateField('on_display', e.target.checked)} />
                  <span>Show on Home Page</span>
                </label>
                <label className="admin-toggle">
                  <input type="checkbox" checked={!!editingFP.on_discount} onChange={(e) => updateField('on_discount', e.target.checked)} />
                  <span>On Discount</span>
                </label>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="secondary-admin-button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button" disabled={saving}>
                  {saving ? 'Saving...' : (editingFP.id ? 'Update Featured Product' : 'Create Featured Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminFeaturedProducts;
