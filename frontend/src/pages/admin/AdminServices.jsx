import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch, API_URL, formatAssetUrl } from '../../utils/api';

const SERVICE_CATEGORIES = [
  { key: 'genome-editing', name: 'Genome Editing' },
  { key: 'synthesis-cloning', name: 'Synthesis & Cloning' },
  { key: 'ivt-mrna-services', name: 'IVT mRNA Services' },
  { key: 'protein-purification', name: 'Protein Purification' },
  { key: 'virus-packaging', name: 'Virus Packaging' },
  { key: 'cell-line-services', name: 'Cell Line Services' },
  { key: 'uncategorized', name: 'Uncategorized' }
];

function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingService, setEditingService] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [imageFile, setImageFile] = useState(null);

  const loadServices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/admin-panel/services/');
      setServices(data.results || data.services || []);
    } catch (err) {
      setError(err.message || 'Failed to load services.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadServices(); }, [loadServices]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleCreate = () => {
    setEditingService({
      url: '',
      title: '',
      content: '',
      category: selectedCategory !== 'All' ? selectedCategory : 'uncategorized',
    });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleEdit = async (serviceId) => {
    try {
      const data = await apiFetch(`/api/admin-panel/services/${serviceId}/`);
      setEditingService(data.service || data);
      setImageFile(null);
      setIsModalOpen(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (serviceId) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      await apiFetch(`/api/admin-panel/services/${serviceId}/delete/`, { method: 'POST' });
      showSuccess('Service deleted.');
      loadServices();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const isNew = !editingService.id;
      const endpoint = isNew
        ? '/api/admin-panel/services/create/'
        : `/api/admin-panel/services/${editingService.id}/update/`;

      const formData = new FormData();
      formData.append('url', editingService.url);
      formData.append('title', editingService.title);
      formData.append('content', editingService.content);
      formData.append('category', editingService.category || 'uncategorized');
      if (imageFile) {
        formData.append('image', imageFile);
      }

      await apiFetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      showSuccess(isNew ? 'Service created!' : 'Service updated!');
      setIsModalOpen(false);
      setEditingService(null);
      setImageFile(null);
      loadServices();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setEditingService(prev => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <div className="admin-section-header">
        <h2 id="admin-content-title">Services Catalog</h2>
        <button className="primary-button" onClick={handleCreate}>+ Add Service</button>
      </div>

      {/* Category Pills Filter */}
      <div className="admin-category-pills">
        <button 
          className={`category-pill ${selectedCategory === 'All' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('All')}
        >
          All ({services.length})
        </button>
        {SERVICE_CATEGORIES.map(cat => {
          const count = services.filter(s => (s.category || 'uncategorized') === cat.key).length;
          return (
            <button 
              key={cat.key}
              className={`category-pill ${selectedCategory === cat.key ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.key)}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {successMsg && <div className="admin-alert success">{successMsg}</div>}
      {error && <div className="admin-alert error">{error}</div>}

      {loading ? (
        <div className="admin-empty-table">Loading services...</div>
      ) : services.length === 0 ? (
        <div className="admin-empty-table">No services found.</div>
      ) : (
        <div className="admin-grouped-products">
          {SERVICE_CATEGORIES.map(cat => {
            if (selectedCategory !== 'All' && selectedCategory !== cat.key) {
              return null;
            }

            const groupList = services.filter(s => (s.category || 'uncategorized') === cat.key);
            if (selectedCategory === 'All' && groupList.length === 0) {
              return null; // Keep layout clean
            }

            return (
              <div key={cat.key} className="admin-category-group">
                <h3 className="admin-category-title">
                  <span>{cat.name}</span>
                  <span className="admin-category-badge">{groupList.length} services</span>
                </h3>

                {groupList.length === 0 ? (
                  <div className="admin-empty-table" style={{ minHeight: '80px', background: '#fcfdfd' }}>
                    No services in this category.
                  </div>
                ) : (
                  <div className="admin-data-table-wrap">
                    <table className="admin-data-table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>URL Slug</th>
                          <th>Content Preview</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupList.map((service) => (
                          <tr key={service.id}>
                            <td>
                              <div className="admin-product-cell">
                                {service.image && (
                                  <img 
                                    src={formatAssetUrl(service.image)} 
                                    alt="" 
                                    className="admin-thumb" 
                                  />
                                )}
                                <strong>{service.title}</strong>
                              </div>
                            </td>
                            <td><code>{service.url}</code></td>
                            <td className="admin-cell-truncate">
                              {service.content ? service.content.replace(/<[^>]*>/g, '').substring(0, 120) + '...' : '—'}
                            </td>
                            <td>
                              <div className="admin-row-actions">
                                <button className="admin-action-btn edit" onClick={() => handleEdit(service.id)}>Edit</button>
                                <button className="admin-action-btn delete" onClick={() => handleDelete(service.id)}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && editingService && (
        <div className="admin-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="admin-modal admin-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{editingService.id ? 'Edit Service' : 'Create Service'}</h3>
              <button className="admin-modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSave} className="admin-modal-body">
              <div className="admin-form-grid">
                <label className="admin-form-field span-2">
                  <span>Title *</span>
                  <input type="text" value={editingService.title || ''} onChange={(e) => updateField('title', e.target.value)} required maxLength="60" />
                </label>
                <label className="admin-form-field">
                  <span>URL Slug *</span>
                  <input type="text" value={editingService.url || ''} onChange={(e) => updateField('url', e.target.value)} required placeholder="e.g. gene-synthesis" />
                </label>
                <label className="admin-form-field">
                  <span>Category *</span>
                  <select 
                    value={editingService.category || ''} 
                    onChange={(e) => updateField('category', e.target.value)}
                    required
                  >
                    <option value="">-- Select Category --</option>
                    {SERVICE_CATEGORIES.map(cat => (
                      <option key={cat.key} value={cat.key}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="admin-form-field span-3">
                  <span>Service Image</span>
                  <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0] || null)} />
                  {editingService.image && !imageFile && (
                    <div className="admin-current-image">
                      <img src={formatAssetUrl(editingService.image)} alt="Current" />
                      <span>Current image</span>
                    </div>
                  )}
                </label>
                <label className="admin-form-field span-3">
                  <span>Content (HTML) *</span>
                  <textarea rows="14" value={editingService.content || ''} onChange={(e) => updateField('content', e.target.value)} required />
                </label>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="secondary-admin-button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button" disabled={saving}>
                  {saving ? 'Saving...' : (editingService.id ? 'Update Service' : 'Create Service')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminServices;
