import React, { useEffect, useState, useCallback, useRef } from 'react';
import { apiFetch, API_URL, formatAssetUrl } from '../../utils/api';
import { ProductContentEditor } from './AdminProducts';

const SERVICE_FALLBACK_CATEGORIES = [
  { id: 'genome-editing-services', name: 'Genome Editing Services' },
  { id: 'synthesis-cloning-services', name: 'Custom Cloning Services' },
  { id: 'cell-line-services', name: 'Stable Cell Line Services' },
  { id: 'virus-packaging-services', name: 'Lentivirus Package Services' },
  { id: 'vector-construction-services', name: 'Vector Construction Support' },
  { id: 'functional-testing-services', name: 'Functional Testing' },
  { id: 'experiment-services', name: 'Experiment Services' },
  { id: 'lab-supplies-services', name: 'Lab Supplies' },
  { id: 'project-consultation-services', name: 'Project Consultation' },
  { id: 'protein-purification-services', name: 'Protein Purification' }
];

const UNCATEGORIZED_SERVICE_CATEGORY = { id: 'uncategorized', name: 'Uncategorized' };

const FilledHomeIcon = () => (
  <svg className="admin-home-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M3 10.5 12 3l9 7.5v9A1.5 1.5 0 0 1 19.5 21H15v-6h-6v6H4.5A1.5 1.5 0 0 1 3 19.5v-9Z" />
  </svg>
);

function AdminServices() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingService, setEditingService] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [catalogStatus, setCatalogStatus] = useState('active');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [removeImage, setRemoveImage] = useState(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogRows, setCatalogRows] = useState([]);
  const [catalogSaving, setCatalogSaving] = useState(false);
  const [catalogImageUploading, setCatalogImageUploading] = useState({});
  const [draggedCatalogIndex, setDraggedCatalogIndex] = useState(null);
  const [collapsedCatalogs, setCollapsedCatalogs] = useState(() => new Set());
  const serviceContentEditorRef = useRef(null);
  const performanceDataEditorRef = useRef(null);
  const imagePreviewRequestRef = useRef(0);

  const loadServices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [servicesData, categoriesData] = await Promise.all([
        apiFetch(`/api/admin-panel/services/?hidden=${catalogStatus === 'deactivated' ? 'true' : 'false'}`),
        apiFetch('/api/admin-panel/product-categories/?product_type=service'),
      ]);
      setServices(servicesData.results || servicesData.services || []);
      setCategories(categoriesData.results || []);
    } catch (err) {
      setError(err.message || 'Failed to load services.');
    } finally {
      setLoading(false);
    }
  }, [catalogStatus]);

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
      show_on_homepage: !!cat.show_on_homepage,
      homepage_image: cat.homepage_image || '',
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

  const fallbackCategoryNames = new Map(
    SERVICE_FALLBACK_CATEGORIES.map((cat) => [cat.id, cat.name])
  );

  services.forEach((service) => {
    const serviceCategory = service.category || 'uncategorized';
    if (serviceCategory !== 'uncategorized' && !categoryMap.has(serviceCategory)) {
      categoryMap.set(serviceCategory, normalizeCategory({
        id: serviceCategory,
        name: fallbackCategoryNames.get(serviceCategory) || serviceCategory,
        priority: categoryMap.size + 1,
      }));
    }
  });

  const serviceCategories = Array.from(categoryMap.values())
    .filter(cat => cat.id)
    .sort((a, b) => (a.priority || 0) - (b.priority || 0) || a.name.localeCompare(b.name));

  const displayCategories = [...serviceCategories, UNCATEGORIZED_SERVICE_CATEGORY];

  const handleCreate = () => {
    setError('');
    setSuccessMsg('');
    setEditingService({
      url: '',
      title: '',
      catalog_number: '',
      content: '',
      performance_data: '',
      manuals: [],
      category: selectedCategory !== 'All' ? selectedCategory : 'uncategorized',
      service_group: '',
      is_featured: false,
      show_on_screen: false,
      hidden: false,
    });
    setImageFile(null);
    setImagePreviewUrl('');
    imagePreviewRequestRef.current += 1;
    setRemoveImage(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = async (serviceId) => {
    try {
      setError('');
      setSuccessMsg('');
      const data = await apiFetch(`/api/admin-panel/services/${serviceId}/`);
      setEditingService(data.service || data);
      setImageFile(null);
      setImagePreviewUrl('');
      imagePreviewRequestRef.current += 1;
      setRemoveImage(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingService(null);
    setImageFile(null);
    setImagePreviewUrl('');
    imagePreviewRequestRef.current += 1;
    setRemoveImage(false);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeactivate = async (serviceId) => {
    if (!confirm('Are you sure you want to deactivate this service?')) return;
    try {
      await apiFetch(`/api/admin-panel/services/${serviceId}/delete/`, { method: 'POST' });
      showSuccess('Service deactivated successfully.');
      loadServices();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleActivate = async (serviceId) => {
    if (!confirm('Are you sure you want to activate this service?')) return;
    try {
      await apiFetch(`/api/admin-panel/services/${serviceId}/update/`, {
        method: 'POST',
        body: { hidden: false },
      });
      showSuccess('Service activated successfully.');
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
      await loadServices();
    } catch (err) {
      setError(err.message);
      // Revert status on failure
      await loadServices();
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
      showSuccess(updatedStatus ? 'Service will display on homepage.' : 'Service will not display on homepage.');

      // Sync silent background reload
      await loadServices();
    } catch (err) {
      setError(err.message);
      // Revert status on failure
      await loadServices();
    }
  };

  const handleSave = async (e, { closeAfterSave = true } = {}) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const latestContent = serviceContentEditorRef.current?.getHtml?.() ?? editingService.content ?? '';
      const latestPerformanceData = performanceDataEditorRef.current?.getHtml?.() ?? editingService.performance_data ?? '';
      const serviceManuals = (editingService.manuals || []).filter((document) => (
        document?.name && document?.manual
      ));
      const isNew = !editingService.id;
      const endpoint = isNew
        ? '/api/admin-panel/services/create/'
        : `/api/admin-panel/services/${editingService.id}/update/`;

      const formData = new FormData();
      formData.append('url', editingService.url);
      formData.append('title', editingService.title);
      formData.append('catalog_number', editingService.catalog_number || '');
      formData.append('content', latestContent);
      formData.append('performance_data', latestPerformanceData);
      formData.append('manuals', JSON.stringify(serviceManuals));
      formData.append('category', editingService.category || 'uncategorized');
      formData.append('service_group', editingService.service_group || '');
      formData.append('is_featured', editingService.is_featured ? 'true' : 'false');
      formData.append('show_on_screen', editingService.show_on_screen ? 'true' : 'false');
      formData.append('hidden', editingService.hidden ? 'true' : 'false');
      if (imageFile) {
        formData.append('image', imageFile);
      }
      if (removeImage) {
        formData.append('remove_image', 'true');
      }

      const saveResponse = await apiFetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      showSuccess(isNew ? 'Service created!' : 'Service updated!');
      setImageFile(null);
      setImagePreviewUrl('');
      imagePreviewRequestRef.current += 1;
      setRemoveImage(false);
      if (closeAfterSave) {
        setEditingService(null);
      } else {
        setEditingService((prev) => ({
          ...prev,
          content: latestContent,
          performance_data: latestPerformanceData,
          manuals: serviceManuals,
          id: prev?.id || saveResponse?.id || saveResponse?.service?.id,
          image: saveResponse?.image ?? saveResponse?.service?.image ?? (removeImage ? null : prev?.image),
        }));
      }
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

  const handleServiceImageChange = (event) => {
    const file = event.target.files?.[0] || null;
    const previewRequest = imagePreviewRequestRef.current + 1;
    imagePreviewRequestRef.current = previewRequest;
    setImageFile(file);
    setImagePreviewUrl('');
    setRemoveImage(false);

    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (imagePreviewRequestRef.current === previewRequest) {
        setImagePreviewUrl(typeof reader.result === 'string' ? reader.result : '');
      }
    };
    reader.onerror = () => {
      if (imagePreviewRequestRef.current === previewRequest) {
        setImagePreviewUrl('');
        setError('The selected service image could not be previewed. Please choose another image.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveServiceImage = () => {
    if (!window.confirm('Delete the current service image when this service is saved?')) return;
    setImageFile(null);
    setImagePreviewUrl('');
    imagePreviewRequestRef.current += 1;
    setRemoveImage(true);
    setEditingService((prev) => ({ ...prev, image: null }));
  };

  const handleServiceDocumentUpload = async (event, index) => {
    const fileInput = event.currentTarget;
    const file = fileInput.files?.[0];
    if (!file) return;

    setError('');
    try {
      const formData = new FormData();
      formData.append('document', file);

      let csrfToken = document.cookie
        .split('; ')
        .find((row) => row.startsWith('csrftoken='))
        ?.split('=')[1];

      if (!csrfToken) {
        const csrfResponse = await fetch(`${API_URL}/api/csrf/`, { credentials: 'include' });
        const csrfData = await csrfResponse.json();
        csrfToken = csrfData.csrftoken;
      }

      const response = await fetch(`${API_URL}/api/admin-panel/services/upload-document/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRFToken': csrfToken },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload service document.');
      }

      const data = await response.json();
      const defaultName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      const documents = [...(editingService.manuals || [])];
      documents[index] = {
        ...documents[index],
        name: documents[index]?.name || defaultName,
        manual: data.document_path,
      };
      updateField('manuals', documents);
      showSuccess('Service document uploaded successfully.');
    } catch (err) {
      setError(err.message || 'Service document upload failed.');
    } finally {
      fileInput.value = '';
    }
  };

  const openCatalogEditor = () => {
    setCatalogRows(serviceCategories.map((cat, index) => ({
      category_id: cat.isFallback ? null : cat.category_id,
      category_name: cat.name,
      external_id: cat.id,
      priority: cat.priority || index + 1,
      product_type: 'service',
      show_on_homepage: !!cat.show_on_homepage,
      homepage_image: cat.homepage_image || '',
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

  const handleCatalogImageUpload = async (event, index) => {
    const fileInput = event.currentTarget;
    const file = fileInput.files?.[0];
    if (!file) return;

    setError('');
    setCatalogImageUploading((current) => ({ ...current, [index]: true }));
    try {
      const formData = new FormData();
      formData.append('image', file);

      let csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];

      if (!csrfToken) {
        const csrfResponse = await fetch(`${API_URL}/api/csrf/`, { credentials: 'include' });
        const csrfData = await csrfResponse.json();
        csrfToken = csrfData.csrftoken;
      }

      const response = await fetch(`${API_URL}/api/admin-panel/products/upload-image/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRFToken': csrfToken },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload homepage image.');
      }

      const data = await response.json();
      updateCatalogRow(index, 'homepage_image', data.image_path || data.url || '');
      showSuccess('Homepage category image uploaded. Save the catalog to apply it.');
    } catch (err) {
      setError(err.message || 'Homepage image upload failed.');
    } finally {
      setCatalogImageUploading((current) => ({ ...current, [index]: false }));
      fileInput.value = '';
    }
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
        show_on_homepage: false,
        homepage_image: '',
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
          show_on_homepage: !!row.show_on_homepage,
          homepage_image: row.homepage_image || '',
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

  const toggleCatalogCollapse = (catalogId) => {
    setCollapsedCatalogs((prev) => {
      const next = new Set(prev);
      if (next.has(catalogId)) {
        next.delete(catalogId);
      } else {
        next.add(catalogId);
      }
      return next;
    });
  };

  if (editingService) {
    const isEditingExistingService = Boolean(editingService.id);

    return (
      <div className="admin-blog-editor-page">
        <div className="admin-editor-header">
          <div>
            <button type="button" className="admin-back-button" onClick={handleCancelEdit}>
              Back to Services Catalog
            </button>
            <h2 id="admin-content-title">
              {isEditingExistingService ? 'Edit Service' : 'Create Service'}
            </h2>
          </div>
          <div className="admin-editor-header-actions">
            <button type="button" className="secondary-admin-button" onClick={handleCancelEdit}>Cancel</button>
            <button type="button" className="secondary-admin-button" disabled={saving} onClick={(e) => handleSave(e, { closeAfterSave: false })}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type="submit" form="admin-service-editor-form" className="primary-button" disabled={saving}>
              {saving ? 'Saving...' : (isEditingExistingService ? 'Save & Close' : 'Create & Close')}
            </button>
          </div>
        </div>

        {error && <div className="admin-alert error">{error}</div>}

        <form id="admin-service-editor-form" onSubmit={handleSave} className="admin-editor-panel">
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
              <span>Catalog #</span>
              <input
                type="text"
                value={editingService.catalog_number || ''}
                onChange={(e) => updateField('catalog_number', e.target.value)}
                placeholder="e.g. GEDT-012"
              />
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
            <label className="admin-form-field">
              <span>Service Group</span>
              <input
                type="text"
                value={editingService.service_group || ''}
                onChange={(e) => updateField('service_group', e.target.value)}
                placeholder="e.g. Gene Engineering"
              />
            </label>
            <div className="admin-form-field span-3">
              <span>Service Image</span>
              <input
                key={editingService.image || 'empty-service-image'}
                type="file"
                accept="image/*"
                onChange={handleServiceImageChange}
              />
              {imageFile && imagePreviewUrl && (
                <div className="admin-service-current-image">
                  <span className="admin-service-current-image-label">Selected Image Preview</span>
                  <img src={imagePreviewUrl} alt={`${editingService.title || 'Service'} selected preview`} />
                </div>
              )}
              {editingService.image && !imageFile && (
                <div className="admin-service-current-image">
                  <span className="admin-service-current-image-label">Current Image</span>
                  <img src={formatAssetUrl(editingService.image)} alt={`${editingService.title || 'Service'} current`} />
                  <button type="button" className="admin-action-btn delete admin-service-image-delete" onClick={handleRemoveServiceImage}>
                    Delete Service Image
                  </button>
                </div>
              )}
              {removeImage && (
                <span className="admin-service-image-removal-note" role="status">
                  The current image will be deleted when you save this service.
                </span>
              )}
            </div>
            <div className="admin-form-field span-3" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--line)', paddingTop: '15px', marginTop: '10px' }}>
              <span style={{ fontWeight: '600', color: 'var(--ink)' }}>Service Documents</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px', marginTop: '5px' }}>
                {(editingService.manuals || []).map((document, index) => (
                  <div key={index} style={{ position: 'relative', border: '1px solid var(--line)', borderRadius: '6px', padding: '10px', background: '#fff', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      type="text"
                      value={document.name || ''}
                      onChange={(event) => {
                        const documents = [...(editingService.manuals || [])];
                        documents[index] = { ...documents[index], name: event.target.value };
                        updateField('manuals', documents);
                      }}
                      placeholder="Document name (e.g. Protocol Guide)"
                      style={{ fontSize: '12px', padding: '6px', border: '1px solid var(--line)', borderRadius: '4px' }}
                    />
                    <input
                      type="text"
                      value={document.manual || ''}
                      onChange={(event) => {
                        const documents = [...(editingService.manuals || [])];
                        documents[index] = { ...documents[index], manual: event.target.value };
                        updateField('manuals', documents);
                      }}
                      placeholder="File path (e.g. manual_files/...)"
                      style={{ fontSize: '12px', padding: '6px', border: '1px solid var(--line)', borderRadius: '4px' }}
                    />
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
                      <label className="secondary-admin-button" style={{ fontSize: '11px', padding: '4px 8px', cursor: 'pointer', margin: 0, display: 'inline-block' }}>
                        Upload File
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.xls,.xlsx"
                          onChange={(event) => handleServiceDocumentUpload(event, index)}
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const documents = (editingService.manuals || []).filter((_, documentIndex) => documentIndex !== index);
                        updateField('manuals', documents);
                      }}
                      style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(244, 67, 54, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                      title="Remove document"
                      aria-label={`Remove ${document.name || 'service document'}`}
                    >
                      x
                    </button>
                  </div>
                ))}

                <div style={{ minHeight: '110px', border: '1px dashed var(--line)', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#fcfdfd', padding: '10px' }}>
                  <button
                    type="button"
                    className="secondary-admin-button"
                    onClick={() => {
                      const documents = [...(editingService.manuals || []), { name: '', manual: '' }];
                      updateField('manuals', documents);
                    }}
                    style={{ fontSize: '12px', padding: '6px 10px', width: '100%' }}
                  >
                    + Add Document
                  </button>
                </div>
              </div>
            </div>
            <div className="admin-form-toggles span-3">
              <label className="admin-toggle">
                <input
                  type="checkbox"
                  checked={!!editingService.hidden}
                  onChange={(e) => updateField('hidden', e.target.checked)}
                />
                <span>Deactivated</span>
              </label>
              <label className="admin-toggle">
                <input
                  type="checkbox"
                  checked={!!editingService.is_featured}
                  onChange={(e) => updateField('is_featured', e.target.checked)}
                />
                <span>Featured Service</span>
              </label>
              <label className="admin-toggle">
                <input
                  type="checkbox"
                  checked={!!editingService.show_on_screen}
                  onChange={(e) => updateField('show_on_screen', e.target.checked)}
                />
                <span>Display on homepage</span>
              </label>
            </div>
            <div className="admin-form-field span-3">
              <span>Service Detail</span>
              <ProductContentEditor
                ref={serviceContentEditorRef}
                value={editingService.content || ''}
                onChange={(value) => updateField('content', value)}
                ariaLabel="Service content text"
              />
            </div>
            <div className="admin-form-field span-3">
              <span>Performance Data</span>
              <ProductContentEditor
                ref={performanceDataEditorRef}
                value={editingService.performance_data || ''}
                onChange={(value) => updateField('performance_data', value)}
                ariaLabel="Service performance data"
              />
            </div>
          </div>

          <div className="admin-editor-footer">
            <button type="button" className="secondary-admin-button" onClick={handleCancelEdit}>Cancel</button>
            <button type="button" className="secondary-admin-button" disabled={saving} onClick={(e) => handleSave(e, { closeAfterSave: false })}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? 'Saving...' : (isEditingExistingService ? 'Save & Close' : 'Create & Close')}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <>
      <div className="admin-section-header">
        <h2 id="admin-content-title">Services Catalog</h2>
        <div className="admin-section-actions">
          <button className="secondary-admin-button" onClick={openCatalogEditor}>Edit Catalog</button>
          <button className="primary-button" onClick={handleCreate}>+ Add Service</button>
        </div>
      </div>

      <div className="admin-tabs" role="tablist" aria-label="Service status">
        <button
          type="button"
          role="tab"
          aria-selected={catalogStatus === 'active'}
          className={catalogStatus === 'active' ? 'is-active' : ''}
          onClick={() => setCatalogStatus('active')}
        >
          Active Services
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={catalogStatus === 'deactivated'}
          className={catalogStatus === 'deactivated' ? 'is-active' : ''}
          onClick={() => setCatalogStatus('deactivated')}
        >
          Deactivated Services
        </button>
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

            const groupList = services
              .filter(s => (s.category || 'uncategorized') === cat.id)
              .map((service, index) => ({ service, index }))
              .sort((left, right) => {
                const leftCatalog = String(left.service.catalog_number || '').trim();
                const rightCatalog = String(right.service.catalog_number || '').trim();
                if (!leftCatalog && rightCatalog) return 1;
                if (leftCatalog && !rightCatalog) return -1;

                const catalogComparison = leftCatalog.localeCompare(rightCatalog, undefined, {
                  numeric: true,
                  sensitivity: 'base',
                });
                if (catalogComparison !== 0) return catalogComparison;

                const titleComparison = String(left.service.title || '').localeCompare(
                  String(right.service.title || ''),
                  undefined,
                  { numeric: true, sensitivity: 'base' },
                );
                return titleComparison || left.index - right.index;
              })
              .map(({ service }) => service);
            if (selectedCategory === 'All' && groupList.length === 0) {
              return null;
            }

            const isCollapsed = collapsedCatalogs.has(cat.id);

            return (
              <div key={cat.id} className={`admin-category-group ${isCollapsed ? 'is-collapsed' : ''}`}>
                <h3 className="admin-category-title">
                  <button
                    className="admin-category-toggle"
                    type="button"
                    aria-expanded={!isCollapsed}
                    aria-controls={`service-catalog-panel-${cat.id}`}
                    onClick={() => toggleCatalogCollapse(cat.id)}
                  >
                    <span className="admin-category-toggle-icon" aria-hidden="true">
                      {isCollapsed ? '+' : '-'}
                    </span>
                    <span>{cat.name}</span>
                  </button>
                  <span className="admin-category-badge">{groupList.length} services</span>
                </h3>

                {!isCollapsed && (
                  <div id={`service-catalog-panel-${cat.id}`} className="admin-category-panel">
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
                          <th>Catalog #</th>
                          <th>External ID</th>
                          <th>Service Group</th>
                          <th>Content Preview</th>
                          {catalogStatus === 'deactivated' && <th>Status</th>}
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
                                    Homepage
                                  </span>
                                )}
                              </div>
                            </td>
                            <td><code>{service.catalog_number || '—'}</code></td>
                            <td><code>{service.external_id || service.url}</code></td>
                            <td>{service.service_group || '-'}</td>
                            <td className="admin-cell-truncate">
                              {service.content ? service.content.replace(/<[^>]*>/g, '').substring(0, 120) + '...' : '-'}
                            </td>
                            {catalogStatus === 'deactivated' && (
                              <td><span className="admin-badge badge-muted">Deactivated</span></td>
                            )}
                            <td>
                              <div className="admin-row-actions">
                                {catalogStatus !== 'deactivated' && (
                                  <>
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
                                  className="admin-action-btn admin-homepage-action-btn"
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleShowOnScreen(service.id, service.show_on_screen); }}
                                  title="Display on homepage"
                                  aria-label="Display on homepage"
                                  style={{
                                    background: service.show_on_screen ? 'var(--blue)' : '#f1f5f9',
                                    color: service.show_on_screen ? '#fff' : 'var(--ink-light)',
                                    border: '1px solid ' + (service.show_on_screen ? 'var(--blue)' : '#cbd5e1'),
                                    minWidth: '34px',
                                    width: '34px',
                                    height: '30px',
                                    padding: '0',
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
                                  <FilledHomeIcon />
                                </button>
                                  </>
                                )}
                                <button type="button" className="admin-action-btn edit" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEdit(service.id); }}>Edit</button>
                                {service.hidden ? (
                                  <button type="button" className="admin-action-btn edit" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleActivate(service.id); }}>Activate</button>
                                ) : (
                                  <button type="button" className="admin-action-btn delete" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeactivate(service.id); }}>Deactivate</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isCatalogModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsCatalogModalOpen(false)}>
          <div className="admin-modal admin-modal-lg admin-catalog-modal" onClick={(e) => e.stopPropagation()}>
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
                      <th>Popular</th>
                      <th>Homepage Image</th>
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
                        <td>
                          <label className="admin-toggle" style={{ justifyContent: 'center' }}>
                            <input
                              type="checkbox"
                              checked={!!row.show_on_homepage}
                              onChange={(e) => updateCatalogRow(index, 'show_on_homepage', e.target.checked)}
                              aria-label={`Display ${row.category_name || 'category'} on homepage`}
                            />
                            <span>Show</span>
                          </label>
                        </td>
                        <td>
                          <div className="admin-catalog-image-editor">
                            <div className="admin-catalog-image-thumbnail">
                              {row.homepage_image ? (
                                <img src={formatAssetUrl(row.homepage_image)} alt={`${row.category_name || 'Category'} homepage`} />
                              ) : (
                                <span>No image</span>
                              )}
                            </div>
                            <div className="admin-catalog-image-actions">
                              <label className="admin-action-btn edit">
                                {catalogImageUploading[index]
                                  ? 'Uploading...'
                                  : row.homepage_image ? 'Replace' : 'Upload'}
                                <input
                                  type="file"
                                  accept="image/*"
                                  disabled={!!catalogImageUploading[index]}
                                  onChange={(event) => handleCatalogImageUpload(event, index)}
                                />
                              </label>
                              {row.homepage_image && (
                                <button
                                  type="button"
                                  className="admin-action-btn delete"
                                  onClick={() => updateCatalogRow(index, 'homepage_image', '')}
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
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
