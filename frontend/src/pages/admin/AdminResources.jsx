import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { apiFetch, API_URL, formatAssetUrl } from '../../utils/api';

function AdminResources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingResource, setEditingResource] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [fileObject, setFileObject] = useState(null);

  // Search, Filter, Sort and Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('date_created');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [previewFileUrl, setPreviewFileUrl] = useState(null);

  const loadResources = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/admin-panel/resources/');
      setResources(data.results || data.resources || []);
    } catch (err) {
      setError(err.message || 'Failed to load resources.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleCreate = () => {
    setEditingResource({
      name: '',
      category: '',
      description: '',
      download_url: '',
    });
    setError('');
    setSuccessMsg('');
    setFileObject(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = async (resourceId) => {
    try {
      setError('');
      setSuccessMsg('');
      const data = await apiFetch(`/api/admin-panel/resources/${resourceId}/`);
      setEditingResource(data);
      setFileObject(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingResource(null);
    setFileObject(null);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (resourceId) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await apiFetch(`/api/admin-panel/resources/${resourceId}/delete/`, { method: 'POST' });
      showSuccess('Document deleted.');
      loadResources();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const isNew = !editingResource.id;
      const endpoint = isNew
        ? '/api/admin-panel/resources/create/'
        : `/api/admin-panel/resources/${editingResource.id}/update/`;

      // Use FormData if there is a file to upload
      if (fileObject) {
        const formData = new FormData();
        formData.append('name', editingResource.name);
        formData.append('category', editingResource.category);
        formData.append('description', editingResource.description || '');
        formData.append('download_url', editingResource.download_url || '');
        formData.append('file', fileObject);

        let csrfToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('csrftoken='))
          ?.split('=')[1];

        if (!csrfToken) {
          const csrfRes = await fetch(`${API_URL}/api/csrf/`, { credentials: 'include' });
          const csrfData = await csrfRes.json();
          csrfToken = csrfData.csrftoken;
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'X-CSRFToken': csrfToken },
          body: formData,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.detail || 'Failed to save document.');
        }
      } else {
        await apiFetch(endpoint, {
          method: 'POST',
          body: {
            name: editingResource.name,
            category: editingResource.category,
            description: editingResource.description,
            download_url: editingResource.download_url,
          },
        });
      }

      showSuccess(isNew ? 'Document created!' : 'Document updated!');
      setEditingResource(null);
      setFileObject(null);
      loadResources();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setEditingResource(prev => ({ ...prev, [field]: value }));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Search & Filtering logic
  const uniqueCategories = useMemo(() => {
    const cats = new Set(resources.map(r => r.category));
    return ['All', ...Array.from(cats)];
  }, [resources]);

  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
      const searchableText = `${r.name || ''} ${r.category || ''} ${r.description || ''}`.toLowerCase();
      const matchesSearch = searchableText.includes(searchTerm.trim().toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [resources, selectedCategory, searchTerm]);

  // Sorting logic
  const sortedResources = useMemo(() => {
    const sorted = [...filteredResources];
    sorted.sort((a, b) => {
      let valA = a[sortBy] || '';
      let valB = b[sortBy] || '';

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredResources, sortBy, sortOrder]);

  // Pagination logic
  const totalItems = sortedResources.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedResources = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return sortedResources.slice(startIdx, startIdx + itemsPerPage);
  }, [sortedResources, currentPage, itemsPerPage]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, sortBy, sortOrder, itemsPerPage]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const renderSortIndicator = (field) => {
    if (sortBy !== field) return <span style={{ color: '#ccc', marginLeft: '6px' }}>↕</span>;
    return sortOrder === 'asc' 
      ? <span style={{ color: 'var(--blue)', marginLeft: '6px', fontWeight: 'bold' }}>↑</span> 
      : <span style={{ color: 'var(--blue)', marginLeft: '6px', fontWeight: 'bold' }}>↓</span>;
  };

  if (editingResource) {
    return (
      <div className="admin-blog-editor-page">
        <div className="admin-editor-header">
          <div>
            <button type="button" className="admin-back-button" onClick={handleCancelEdit}>
              Back to Documents
            </button>
            <h2 id="admin-content-title">{editingResource.id ? 'Edit Document' : 'Create Document'}</h2>
          </div>
          <div className="admin-editor-header-actions">
            <button type="button" className="secondary-admin-button" onClick={handleCancelEdit}>Cancel</button>
            <button type="submit" form="admin-resource-editor-form" className="primary-button" disabled={saving}>
              {saving ? 'Saving...' : (editingResource.id ? 'Update Document' : 'Create Document')}
            </button>
          </div>
        </div>

        {error && <div className="admin-alert error">{error}</div>}

        <form id="admin-resource-editor-form" onSubmit={handleSave} className="admin-editor-panel">
          <div className="admin-form-grid">
            <label className="admin-form-field span-2">
              <span>Document Name *</span>
              <input type="text" value={editingResource.name || ''} onChange={(e) => updateField('name', e.target.value)} required maxLength="200" />
            </label>
            <label className="admin-form-field">
              <span>Category / Tag *</span>
              <input type="text" value={editingResource.category || ''} onChange={(e) => updateField('category', e.target.value)} required maxLength="100" placeholder="e.g. Product Manuals, Protocols" />
            </label>
            <label className="admin-form-field span-3">
              <span>Description</span>
              <input type="text" value={editingResource.description || ''} onChange={(e) => updateField('description', e.target.value)} maxLength="400" placeholder="Brief description of the document contents" />
            </label>
            <label className="admin-form-field span-3">
              <span>Download URL (Optional if uploading a file)</span>
              <input type="text" value={editingResource.download_url || ''} onChange={(e) => updateField('download_url', e.target.value)} maxLength="500" placeholder="e.g. /media/manual_files/file.pdf or external URL" />
            </label>
            <label className="admin-form-field span-3">
              <span>Upload File (Will override/populate Download URL if empty)</span>
              <input type="file" onChange={(e) => setFileObject(e.target.files[0] || null)} />
              {editingResource.download_url && !fileObject && (
                <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--muted)' }}>
                  Current Link: <a href={formatAssetUrl(editingResource.download_url)} target="_blank" rel="noopener noreferrer">{editingResource.download_url}</a>
                </div>
              )}
            </label>
          </div>
          <div className="admin-editor-footer">
            <button type="button" className="secondary-admin-button" onClick={handleCancelEdit}>Cancel</button>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? 'Saving...' : (editingResource.id ? 'Update Document' : 'Create Document')}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <>
      <div className="admin-section-header">
        <h2 id="admin-content-title">Resource Documents</h2>
        <button className="primary-button" onClick={handleCreate}>+ Add Document</button>
      </div>

      {successMsg && <div className="admin-alert success">{successMsg}</div>}
      {error && <div className="admin-alert error">{error}</div>}

      {/* Advanced Filter, Search, and Show entries controls */}
      <div 
        className="admin-controls-row" 
        style={{ 
          display: 'flex', 
          gap: '16px', 
          marginBottom: '20px', 
          flexWrap: 'wrap', 
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--panel)',
          padding: '16px',
          borderRadius: '10px',
          border: '1px solid var(--line)'
        }}
      >
        <div style={{ flex: '1', minWidth: '260px', display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Search documents by name or description..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid var(--line)',
              fontSize: '14px',
              background: '#fff',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                fontSize: '14px',
                background: '#fff',
                outline: 'none',
                cursor: 'pointer',
                minWidth: '180px'
              }}
            >
              <option value="All">All Categories</option>
              {uniqueCategories.filter(c => c !== 'All').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--line)',
                fontSize: '13px',
                background: '#fff',
                cursor: 'pointer'
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="admin-empty-table">Loading documents...</div>
      ) : resources.length === 0 ? (
        <div className="admin-empty-table">No documents found in database.</div>
      ) : paginatedResources.length === 0 ? (
        <div className="admin-empty-table">No matching documents found. Try resetting filters.</div>
      ) : (
        <>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th 
                    onClick={() => toggleSort('name')} 
                    style={{ cursor: 'pointer', userSelect: 'none', width: '25%' }}
                  >
                    Name {renderSortIndicator('name')}
                  </th>
                  <th 
                    onClick={() => toggleSort('category')} 
                    style={{ cursor: 'pointer', userSelect: 'none', width: '20%' }}
                  >
                    Category {renderSortIndicator('category')}
                  </th>
                  <th 
                    onClick={() => toggleSort('description')} 
                    style={{ cursor: 'pointer', userSelect: 'none', width: '35%' }}
                  >
                    Description {renderSortIndicator('description')}
                  </th>
                  <th 
                    onClick={() => toggleSort('date_created')} 
                    style={{ cursor: 'pointer', userSelect: 'none', width: '10%' }}
                  >
                    Date Added {renderSortIndicator('date_created')}
                  </th>
                  <th style={{ width: '10%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedResources.map((r) => {
                  const docUrl = r.download_url ? formatAssetUrl(r.download_url) : '#';
                  return (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.name}</strong>
                        {r.download_url && (
                          <div style={{ marginTop: '4px' }}>
                            <button
                              onClick={() => setPreviewFileUrl(docUrl)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--blue)',
                                fontSize: '12px',
                                padding: 0,
                                cursor: 'pointer',
                                fontWeight: '600'
                              }}
                              type="button"
                            >
                              👁️ Preview Document
                            </button>
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{
                          background: 'var(--panel)',
                          border: '1px solid var(--line)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          color: 'var(--muted)'
                        }}>{r.category}</span>
                      </td>
                      <td>{r.description || '—'}</td>
                      <td style={{ fontSize: '13px' }}>{formatDate(r.date_created)}</td>
                      <td>
                        <div className="admin-row-actions" style={{ display: 'flex', gap: '8px' }}>
                          <button className="admin-action-btn edit" onClick={() => handleEdit(r.id)}>Edit</button>
                          <button className="admin-action-btn delete" onClick={() => handleDelete(r.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Premium Pagination Controls */}
          {totalPages > 1 && (
            <div 
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '20px',
                padding: '16px',
                background: '#fff',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <span style={{ fontSize: '14px', color: 'var(--muted)' }}>
                Showing {Math.min(totalItems, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(totalItems, currentPage * itemsPerPage)} of {totalItems} entries
              </span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="secondary-admin-button"
                  type="button"
                  style={{ padding: '6px 12px', fontSize: '13px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? 'primary-button' : 'secondary-admin-button'}
                    type="button"
                    style={{
                      padding: '6px 12px',
                      fontSize: '13px',
                      background: currentPage === page ? 'var(--blue)' : '#fff',
                      color: currentPage === page ? '#fff' : 'var(--ink)',
                      borderColor: currentPage === page ? 'var(--blue)' : 'var(--line)',
                      cursor: 'pointer'
                    }}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="secondary-admin-button"
                  type="button"
                  style={{ padding: '6px 12px', fontSize: '13px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {previewFileUrl && (
        <div 
          className="document-preview-backdrop" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(6, 23, 60, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '24px'
          }}
          onClick={() => setPreviewFileUrl(null)}
        >
          <div 
            className="document-preview-modal" 
            style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              width: 'min(1200px, 100%)',
              height: 'min(85vh, 900px)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 64px rgba(6, 23, 60, 0.25)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 24px',
                borderBottom: '1px solid var(--line)',
                background: 'var(--panel)'
              }}
            >
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--ink)' }}>Document Preview</h3>
              <button 
                onClick={() => setPreviewFileUrl(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'var(--muted)',
                  lineHeight: 1,
                  padding: '4px'
                }}
                aria-label="Close preview"
                type="button"
              >
                &times;
              </button>
            </div>
            <div style={{ flex: 1, position: 'relative', background: '#f1f5f9' }}>
              <iframe 
                src={previewFileUrl} 
                title="Document Preview"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminResources;
