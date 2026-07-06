import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch, formatAssetUrl } from '../../utils/api';

const SERVICE_FALLBACK_CATEGORIES = [
  { id: 'genome-editing', name: 'Genome Editing' },
  { id: 'synthesis-cloning', name: 'Synthesis & Cloning' },
  { id: 'ivt-mrna-services', name: 'IVT mRNA Services' },
  { id: 'protein-purification', name: 'Protein Purification' },
  { id: 'virus-packaging', name: 'Virus Packaging' },
  { id: 'cell-line-services', name: 'Cell Line Services' }
];

const UNCATEGORIZED_SERVICE_CATEGORY = { id: 'uncategorized', name: 'Uncategorized' };

function AdminServices() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingService, setEditingService] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogRows, setCatalogRows] = useState([]);
  const [catalogSaving, setCatalogSaving] = useState(false);
  const [draggedCatalogIndex, setDraggedCatalogIndex] = useState(null);

  const loadServices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [servicesData, categoriesData] = await Promise.all([
        apiFetch('/api/admin-panel/services/'),
        apiFetch('/api/admin-panel/product-categories/?product_type=service'),
      ]);
      setServices(servicesData.results || servicesData.services || []);
      setCategories(categoriesData.results || []);
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

  const normalizeCategory = (cat, index = 0) => {
    const id = cat.external_id || cat.externalId || cat.id || cat.key;
    return {
      id,
      name: cat.category_name || cat.name,
      category_id: cat.category_id || null,
      priority: cat.priority || index + 1,
      product_type: cat.product_type || 'service',
      service_count: cat.service_count ?? cat.product_count ?? services.filter(s => (s.category || 'uncategorized') === id).length,
      isFallback: !cat.category_id,
    };
  };

  const categoryMap = new Map(
    categories
      .filter(cat => (cat.product_type || '').toLowerCase() === 'service')
      .map((cat, index) => {
        const normalized = normalizeCategory(cat, index);
        return [normalized.id, normalized];
      })
  );

  SERVICE_FALLBACK_CATEGORIES.forEach((cat, index) => {
    if (!categoryMap.has(cat.id)) {
      categoryMap.set(cat.id, normalizeCategory({ ...cat, priority: index + 1 }, index));
    }
  });

  services.forEach((service) => {
    const serviceCategory = service.category || 'uncategorized';
    if (serviceCategory !== 'uncategorized' && !categoryMap.has(serviceCategory)) {
      categoryMap.set(serviceCategory, normalizeCategory({
        id: serviceCategory,
        name: serviceCategory,
        priority: categoryMap.size + 1,
      }));
    }
  });

  const serviceCategories = Array.from(categoryMap.values())
    .filter(cat => cat.id)
    .sort((a, b) => (a.priority || 0) - (b.priority || 0) || a.name.localeCompare(b.name));

  const displayCategories = [...serviceCategories, UNCATEGORIZED_SERVICE_CATEGORY];

  const handleCreate = () => {
    setEditingService({
      url: '',
      title: '',
      content: '',
      category: selectedCategory !== 'All' ? selectedCategory : 'uncategorized',
      is_featured: false,
      show_on_screen: false,
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

  const handleToggleFeatured = async (serviceId, currentStatus) => {
    try {
      const updatedStatus = !currentStatus;
      
      // Optimistic local state update
      setServices(prevServices => prevServices.map(s => {
        if (s.id === serviceId) {
          return { ...s, is_featured: updatedStatus };
        }
        return s;
      }));

      await apiFetch(`/api/admin-panel/services/${serviceId}/update/`, {
        method: 'POST',
        body: {
          is_featured: updatedStatus
        }
      });
      showSuccess(updatedStatus ? 'Service is now featured.' : 'Service is no longer featured.');

      // Sync silent background reload
      const servicesData = await apiFetch('/api/admin-panel/services/');
      setServices(servicesData.results || servicesData.services || []);
    } catch (err) {
      setError(err.message);
      // Revert status on failure
      const servicesData = await apiFetch('/api/admin-panel/services/');
      setServices(servicesData.results || servicesData.services || []);
    }
  };

  const handleToggleShowOnScreen = async (serviceId, currentStatus) => {
    try {
      const updatedStatus = !currentStatus;
      
      // Optimistic local state update
      setServices(prevServices => prevServices.map(s => {
        if (s.id === serviceId) {
          return { ...s, show_on_screen: updatedStatus };
        }
        return s;
      }));

      await apiFetch(`/api/admin-panel/services/${serviceId}/update/`, {
        method: 'POST',
        body: {
          show_on_screen: updatedStatus
        }
      });
      showSuccess(updatedStatus ? 'Service is now shown on screen.' : 'Service is no longer shown on screen.');

      // Sync silent background reload
      const servicesData = await apiFetch('/api/admin-panel/services/');
      setServices(servicesData.results || servicesData.services || []);
    } catch (err) {
      setError(err.message);
      // Revert status on failure
      const servicesData = await apiFetch('/api/admin-panel/services/');
      setServices(servicesData.results || servicesData.services || []);
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
      formData.append('is_featured', editingService.is_featured ? 'true' : 'false');
      formData.append('show_on_screen', editingService.show_on_screen ? 'true' : 'false');
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

  const openCatalogEditor = () => {
    setCatalogRows(serviceCategories.map((cat, index) => ({
      category_id: cat.isFallback ? null : cat.category_id,
      category_name: cat.name,
      external_id: cat.id,
      priority: cat.priority || index + 1,
      product_type: 'service',
      service_count: services.filter(s => (s.category || 'uncategorized') === cat.id).length,
      isNew: false,
    })));
    setIsCatalogModalOpen(true);
  };

  const updateCatalogRow = (index, field, value) => {
    setCatalogRows((prev) => prev.map((row, rowIndex) => (
      rowIndex === index ? { ...row, [field]: value } : row
    )));
  };

  const moveCatalogRow = (index, direction) => {
    setCatalogRows((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;

      const rows = [...prev];
      [rows[index], rows[nextIndex]] = [rows[nextIndex], rows[index]];
      return rows.map((row, rowIndex) => ({ ...row, priority: rowIndex + 1 }));
    });
  };

  const reorderCatalogRows = (fromIndex, toIndex) => {
    if (fromIndex === null || fromIndex === undefined || fromIndex === toIndex) {
      return;
    }

    setCatalogRows((prev) => {
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= prev.length || toIndex >= prev.length) {
        return prev;
      }

      const rows = [...prev];
      const [movedRow] = rows.splice(fromIndex, 1);
      rows.splice(toIndex, 0, movedRow);
      return rows.map((row, rowIndex) => ({ ...row, priority: rowIndex + 1 }));
    });
  };

  const handleCatalogDragStart = (event, index) => {
    setDraggedCatalogIndex(index);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(index));
  };

  const handleCatalogDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleCatalogDrop = (event, index) => {
    event.preventDefault();
    const fromIndex = Number(event.dataTransfer.getData('text/plain'));
    reorderCatalogRows(Number.isNaN(fromIndex) ? draggedCatalogIndex : fromIndex, index);
    setDraggedCatalogIndex(null);
  };

  const addCatalogRow = () => {
    setCatalogRows((prev) => [
      ...prev,
      {
        temp_id: `new-${Date.now()}`,
        category_name: '',
        external_id: '',
        priority: prev.length + 1,
        product_type: 'service',
        service_count: 0,
        isNew: true,
      },
    ]);
  };

  const deleteCatalogRow = async (index) => {
    const row = catalogRows[index];
    if (row.service_count > 0) {
      alert('This catalog contains services. Move or remove those services before deleting it.');
      return;
    }

    if (!confirm('Are you sure you want to delete this catalog?')) return;

    try {
      if (row.category_id) {
        await apiFetch(`/api/admin-panel/product-categories/${row.category_id}/delete/`, { method: 'POST' });
      }
      setCatalogRows((prev) => prev.filter((_, rowIndex) => rowIndex !== index).map((item, rowIndex) => ({ ...item, priority: rowIndex + 1 })));
      showSuccess('Catalog deleted.');
      loadServices();
    } catch (err) {
      alert(err.message || 'Failed to delete catalog.');
    }
  };

  const saveCatalogRows = async () => {
    setCatalogSaving(true);
    setError('');
    try {
      const savedRows = [];
      for (const row of catalogRows) {
        const payload = {
          category_name: row.category_name,
          external_id: row.external_id,
          priority: row.priority,
          product_type: 'service',
        };

        if (row.isNew || !row.category_id) {
          const created = await apiFetch('/api/admin-panel/product-categories/create/', {
            method: 'POST',
            body: payload,
          });
          savedRows.push(created);
        } else {
          const updated = await apiFetch(`/api/admin-panel/product-categories/${row.category_id}/update/`, {
            method: 'POST',
            body: payload,
          });
          savedRows.push(updated);
        }
      }

      await apiFetch('/api/admin-panel/product-categories/reorder/', {
        method: 'POST',
        body: {
          categories: savedRows.map((row, index) => ({
            category_id: row.category_id,
            priority: index + 1,
          })),
        },
      });

      showSuccess('Catalog updated.');
      setIsCatalogModalOpen(false);
      loadServices();
    } catch (err) {
      setError(err.message || 'Failed to save catalog.');
    } finally {
      setCatalogSaving(false);
    }
  };

  return (
    <>
      <div className="admin-section-header">
        <h2 id="admin-content-title">Services Catalog</h2>
        <div className="admin-section-actions">
          <button className="secondary-admin-button" onClick={openCatalogEditor}>Edit Catalog</button>
          <button className="primary-button" onClick={handleCreate}>+ Add Service</button>
        </div>
      </div>

      <div className="admin-category-pills">
        <button
          className={`category-pill ${selectedCategory === 'All' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('All')}
        >
          All ({services.length})
        </button>
        {displayCategories.map(cat => {
          const count = services.filter(s => (s.category || 'uncategorized') === cat.id).length;
          return (
            <button
              key={cat.id}
              className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
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
          {displayCategories.map(cat => {
            if (selectedCategory !== 'All' && selectedCategory !== cat.id) {
              return null;
            }

            const groupList = services.filter(s => (s.category || 'uncategorized') === cat.id);
            if (selectedCategory === 'All' && groupList.length === 0) {
              return null;
            }

            return (
              <div key={cat.id} className="admin-category-group">
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
                                {service.is_featured && (
                                  <span className="admin-badge badge-accent" style={{ marginLeft: '8px' }}>
                                    Featured
                                  </span>
                                )}
                                {service.show_on_screen && (
                                  <span className="admin-badge badge-info" style={{ background: '#0284c7', color: '#fff', marginLeft: '4px' }}>
                                    On Screen
                                  </span>
                                )}
                              </div>
                            </td>
                            <td><code>{service.url}</code></td>
                            <td className="admin-cell-truncate">
                              {service.content ? service.content.replace(/<[^>]*>/g, '').substring(0, 120) + '...' : '-'}
                            </td>
                            <td>
                              <div className="admin-row-actions">
                                <button
                                  type="button"
                                  className="admin-action-btn"
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleFeatured(service.id, service.is_featured); }}
                                  title={service.is_featured ? "Remove from Featured" : "Mark as Featured"}
                                  style={{
                                    background: service.is_featured ? 'var(--blue)' : '#f1f5f9',
                                    color: service.is_featured ? '#fff' : 'var(--ink-light)',
                                    border: '1px solid ' + (service.is_featured ? 'var(--blue)' : '#cbd5e1'),
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    marginRight: '4px'
                                  }}
                                >
                                  ★
                                </button>
                                <button
                                  type="button"
                                  className="admin-action-btn"
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleShowOnScreen(service.id, service.show_on_screen); }}
                                  title={service.show_on_screen ? "Hide from Screen" : "Show on Screen"}
                                  style={{
                                    background: service.show_on_screen ? '#0284c7' : '#f1f5f9',
                                    color: service.show_on_screen ? '#fff' : 'var(--ink-light)',
                                    border: '1px solid ' + (service.show_on_screen ? '#0284c7' : '#cbd5e1'),
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    marginRight: '4px'
                                  }}
                                >
                                  👁
                                </button>
                                <button type="button" className="admin-action-btn edit" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEdit(service.id); }}>Edit</button>
                                <button type="button" className="admin-action-btn delete" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(service.id); }}>Delete</button>
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
              <button className="admin-modal-close" onClick={() => setIsModalOpen(false)}>x</button>
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
                    {displayCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
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
                <div className="admin-form-field span-3" style={{ margin: '4px 0 12px 0' }}>
                  <label className="checkbox-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={!!editingService.is_featured}
                      onChange={(e) => updateField('is_featured', e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--blue)' }}
                    />
                    <span>Featured Service (display on homepage)</span>
                  </label>
                </div>
                <div className="admin-form-field span-3" style={{ margin: '4px 0 12px 0' }}>
                  <label className="checkbox-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={!!editingService.show_on_screen}
                      onChange={(e) => updateField('show_on_screen', e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--blue)' }}
                    />
                    <span>Show on screen</span>
                  </label>
                </div>
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

      {isCatalogModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsCatalogModalOpen(false)}>
          <div className="admin-modal admin-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Edit Service Catalog</h3>
              <button className="admin-modal-close" onClick={() => setIsCatalogModalOpen(false)}>x</button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-catalog-toolbar">
                <button type="button" className="primary-button" onClick={addCatalogRow}>+ Add Catalog</button>
              </div>
              <div className="admin-data-table-wrap">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Priority</th>
                      <th>Catalog Name</th>
                      <th>External ID</th>
                      <th>Services</th>
                      <th>Reorder</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catalogRows.map((row, index) => (
                      <tr
                        key={row.category_id || row.temp_id || row.external_id || index}
                        className={draggedCatalogIndex === index ? 'is-dragging' : undefined}
                        draggable
                        onDragStart={(event) => handleCatalogDragStart(event, index)}
                        onDragOver={handleCatalogDragOver}
                        onDrop={(event) => handleCatalogDrop(event, index)}
                        onDragEnd={() => setDraggedCatalogIndex(null)}
                      >
                        <td><span className="admin-drag-handle" aria-hidden="true">::</span> {index + 1}</td>
                        <td>
                          <input
                            className="admin-table-input"
                            type="text"
                            value={row.category_name || ''}
                            onChange={(e) => updateCatalogRow(index, 'category_name', e.target.value)}
                            placeholder="Catalog name"
                          />
                        </td>
                        <td><code>{row.external_id || 'Auto-generated on save'}</code></td>
                        <td>{row.service_count || 0}</td>
                        <td>
                          <div className="admin-row-actions">
                            <button className="admin-action-btn edit" type="button" disabled={index === 0} onClick={() => moveCatalogRow(index, -1)}>Up</button>
                            <button className="admin-action-btn edit" type="button" disabled={index === catalogRows.length - 1} onClick={() => moveCatalogRow(index, 1)}>Down</button>
                          </div>
                        </td>
                        <td>
                          <button className="admin-action-btn delete" type="button" onClick={() => deleteCatalogRow(index)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="secondary-admin-button" onClick={() => setIsCatalogModalOpen(false)}>Cancel</button>
              <button type="button" className="primary-button" disabled={catalogSaving} onClick={saveCatalogRows}>
                {catalogSaving ? 'Saving...' : 'Save Catalog'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminServices;
