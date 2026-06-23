import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch, API_URL, formatAssetUrl } from '../../utils/api';

const PRODUCTS_CATEGORIES = [
  { id: 'genome-editing', name: 'Genome Editing' },
  { id: 'vector-clones', name: 'Vector Stock' },
  { id: 'category-1764975611348', name: 'IVT mRNA' },
  { id: 'category-1764975769330', name: 'Purified Protein' },
  { id: 'lentivirus', name: 'Virus Product' },
  { id: 'stable-cell-lines', name: 'Cell Lines' }
];

const REAGENTS_CATEGORIES = [
  { id: 'category-1765063995229', name: 'DNA Reagents' },
  { id: 'category-1766675380397', name: 'RNA Reagents' },
  { id: 'category-1766675365489', name: 'Protein Reagents' },
  { id: 'category-1765995504911', name: 'Cell Reagents' },
  { id: 'category-1780539818236', name: 'Consumables' }
];

function AdminProducts({ categoryFilter = null }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [catalogRows, setCatalogRows] = useState([]);
  const [catalogSaving, setCatalogSaving] = useState(false);
  const [draggedCatalogIndex, setDraggedCatalogIndex] = useState(null);
  const [collapsedCatalogs, setCollapsedCatalogs] = useState(() => new Set());

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch categories
      const catsData = await apiFetch('/api/products/load-product-categories/');
      setCategories(catsData || []);

      // 2. Fetch products
      const sourceType = categoryFilter === 'products' ? 'product' : 'reagent';
      const url = `/api/admin-panel/products/?page_number=1&page_size=250&source_type=${sourceType}`;
      const data = await apiFetch(url);
      
      const rawList = data.results || data.products || [];
      setProducts(rawList);
    } catch (err) {
      setError(err.message || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    loadProducts();
    setSelectedCategory('All'); // Reset filter when categoryFilter tab changes
  }, [loadProducts]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleCreate = () => {
    setEditingProduct({
      product_name: '',
      external_id: '',
      catalog_number: '',
      description: '',
      image_url: '',
      category_external_id: selectedCategory !== 'All' && selectedCategory !== 'uncategorized' ? selectedCategory : '',
      product_group: '',
      source_type: categoryFilter === 'products' ? 'quote' : 'reagent',
      list_price: '',
      price_range: '',
      availability: '',
      hidden: false,
      is_featured: false,
      quote_only: false,
      key_features: [],
      content_text: '',
    });
    setIsModalOpen(true);
  };

  const handleEdit = async (productId) => {
    try {
      const data = await apiFetch(`/api/admin-panel/products/${productId}/`);
      const productData = data.product || data;
      setEditingProduct({
        ...productData,
        product_id: productData.product_id || productData.id || productId
      });
      setIsModalOpen(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to hide this product?')) return;
    try {
      await apiFetch(`/api/admin-panel/products/${productId}/delete/`, { method: 'POST' });
      showSuccess('Product hidden successfully.');
      loadProducts();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isNew = !editingProduct.product_id;
      const endpoint = isNew
        ? '/api/admin-panel/products/create/'
        : `/api/admin-panel/products/${editingProduct.product_id}/update/`;
      
      // Map 'uncategorized' option back to null or empty string for DB submission
      const payload = {
        ...editingProduct,
        category_external_id: editingProduct.category_external_id === 'uncategorized' ? '' : editingProduct.category_external_id
      };

      await apiFetch(endpoint, {
        method: 'POST',
        body: payload,
      });
      showSuccess(isNew ? 'Product created!' : 'Product updated!');
      setIsModalOpen(false);
      setEditingProduct(null);
      loadProducts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setEditingProduct(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e, targetField) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);

      // CSRF token retrieval helper
      let csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];

      if (!csrfToken) {
        const csrfRes = await fetch(`${API_URL}/api/csrf/`, { credentials: 'include' });
        const csrfData = await csrfRes.json();
        csrfToken = csrfData.csrftoken;
      }

      const response = await fetch(`${API_URL}/api/admin-panel/products/upload-image/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRFToken': csrfToken },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to upload image.');
      }

      const data = await response.json();
      const newPath = data.image_path;

      if (targetField === 'image_url') {
        updateField('image_url', newPath);
      } else if (targetField === 'images') {
        const newImages = [...(editingProduct.images || []), newPath];
        updateField('images', newImages);
      }
      showSuccess('Image uploaded successfully.');
    } catch (err) {
      setError(err.message || 'Image upload failed.');
    }
  };

  const fallbackCategories = categoryFilter === 'products' ? PRODUCTS_CATEGORIES : REAGENTS_CATEGORIES;
  const fallbackCategoryIds = fallbackCategories.map((cat) => cat.id);
  const currentProductType = categoryFilter === 'products' ? 'product' : 'reagent';
  const normalizeCategory = (cat) => ({
    id: cat.external_id || cat.externalId || cat.id,
    name: cat.category_name || cat.name,
    category_id: cat.category_id || cat.id,
    priority: cat.priority || 1,
    product_type: cat.product_type || currentProductType,
    product_count: cat.product_count ?? products.filter(p => p.category_external_id === (cat.external_id || cat.externalId || cat.id)).length,
    isFallback: !cat.category_id,
  });
  const dbMatchedCategories = categories
    .filter((cat) => {
      const type = (cat.product_type || '').toLowerCase();
      return type === currentProductType || (!type && fallbackCategoryIds.includes(cat.external_id));
    })
    .map(normalizeCategory);
  const categoryMap = new Map(dbMatchedCategories.map((cat) => [cat.id, cat]));
  fallbackCategories.forEach((cat, index) => {
    if (!categoryMap.has(cat.id)) {
      categoryMap.set(cat.id, normalizeCategory({ ...cat, priority: index + 1, product_type: currentProductType }));
    }
  });
  const matchedCategories = Array.from(categoryMap.values())
    .filter((cat) => cat.id)
    .sort((a, b) => (a.priority || 0) - (b.priority || 0) || a.name.localeCompare(b.name));

  const openCatalogEditor = () => {
    setCatalogRows(matchedCategories.map((cat, index) => ({
      category_id: cat.isFallback ? null : cat.category_id,
      category_name: cat.name,
      external_id: cat.id,
      priority: cat.priority || index + 1,
      product_type: currentProductType,
      product_count: products.filter(p => p.category_external_id === cat.id).length,
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
        product_type: currentProductType,
        product_count: 0,
        isNew: true,
      },
    ]);
  };

  const deleteCatalogRow = async (index) => {
    const row = catalogRows[index];
    if (row.product_count > 0) {
      alert('This catalog contains products. Move or remove those products before deleting it.');
      return;
    }

    if (!confirm('Are you sure you want to delete this catalog?')) return;

    try {
      if (row.category_id) {
        await apiFetch(`/api/admin-panel/product-categories/${row.category_id}/delete/`, { method: 'POST' });
      }
      setCatalogRows((prev) => prev.filter((_, rowIndex) => rowIndex !== index).map((item, rowIndex) => ({ ...item, priority: rowIndex + 1 })));
      showSuccess('Catalog deleted.');
      loadProducts();
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
          product_type: currentProductType,
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
      loadProducts();
    } catch (err) {
      setError(err.message || 'Failed to save catalog.');
    } finally {
      setCatalogSaving(false);
    }
  };

  // Grouping logic
  const getGroupedData = () => {
    const query = searchQuery.trim().toLowerCase();
    const searched = products.filter(p =>
      !query || 
      p.product_name?.toLowerCase().includes(query) ||
      p.external_id?.toLowerCase().includes(query) ||
      p.catalog_number?.toLowerCase().includes(query)
    );

    const groups = [];

    // Category routing
    matchedCategories.forEach(cat => {
      if (selectedCategory !== 'All' && selectedCategory !== cat.id) {
        return;
      }

      const catProducts = searched.filter(p => p.category_external_id === cat.id);
      
      const subGroupMap = {};
      catProducts.forEach(p => {
        const groupName = p.product_group || '';
        if (!subGroupMap[groupName]) {
          subGroupMap[groupName] = [];
        }
        subGroupMap[groupName].push(p);
      });

      groups.push({
        category: {
          category_id: cat.id,
          category_name: cat.name,
          external_id: cat.id
        },
        subgroups: subGroupMap,
        totalCount: catProducts.length
      });
    });

    // Uncategorized route
    if (selectedCategory === 'All' || selectedCategory === 'uncategorized') {
      const activeCatIds = matchedCategories.map(c => c.id);
      const uncategorizedProducts = searched.filter(p => 
        !p.category_external_id || !activeCatIds.includes(p.category_external_id)
      );

      if (uncategorizedProducts.length > 0 || selectedCategory === 'uncategorized') {
        const subGroupMap = {};
        uncategorizedProducts.forEach(p => {
          const groupName = p.product_group || '';
          if (!subGroupMap[groupName]) {
            subGroupMap[groupName] = [];
          }
          subGroupMap[groupName].push(p);
        });

        groups.push({
          category: {
            category_id: 'uncategorized',
            category_name: 'Uncategorized / Custom Products',
            external_id: 'uncategorized'
          },
          subgroups: subGroupMap,
          totalCount: uncategorizedProducts.length
        });
      }
    }

    return groups;
  };

  const groupedData = getGroupedData();

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

  return (
    <>
      <div className="admin-section-header">
        <h2 id="admin-content-title">
          {categoryFilter === 'products' ? 'Products Catalog' : 'Reagents Catalog'}
        </h2>
        <div className="admin-section-actions">
          <div className="admin-search-box">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="secondary-admin-button" onClick={openCatalogEditor}>
            Edit Catalog
          </button>
          <button className="primary-button" onClick={handleCreate}>
            + Add {categoryFilter === 'products' ? 'Product' : 'Reagent'}
          </button>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="admin-category-pills">
        <button 
          className={`category-pill ${selectedCategory === 'All' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('All')}
        >
          All ({products.length})
        </button>
        {matchedCategories.map(cat => {
          const count = products.filter(p => p.category_external_id === cat.id).length;
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
        <button 
          className={`category-pill ${selectedCategory === 'uncategorized' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('uncategorized')}
        >
          Uncategorized ({products.filter(p => !p.category_external_id || !matchedCategories.map(c => c.id).includes(p.category_external_id)).length})
        </button>
      </div>

      {successMsg && <div className="admin-alert success">{successMsg}</div>}
      {error && <div className="admin-alert error">{error}</div>}

      {loading ? (
        <div className="admin-empty-table">Loading...</div>
      ) : groupedData.length === 0 ? (
        <div className="admin-empty-table">No items found.</div>
      ) : (
        <div className="admin-grouped-products">
          {groupedData.map((groupObj) => {
            const cat = groupObj.category;
            const subGroups = groupObj.subgroups;
            const catalogId = cat.category_id;
            const isCollapsed = collapsedCatalogs.has(catalogId);
            
            if (selectedCategory === 'All' && groupObj.totalCount === 0) {
              return null;
            }

            return (
              <div key={catalogId} className={`admin-category-group ${isCollapsed ? 'is-collapsed' : ''}`}>
                <h3 className="admin-category-title">
                  <button
                    className="admin-category-toggle"
                    type="button"
                    aria-expanded={!isCollapsed}
                    aria-controls={`catalog-panel-${catalogId}`}
                    onClick={() => toggleCatalogCollapse(catalogId)}
                  >
                    <span className="admin-category-toggle-icon" aria-hidden="true">
                      {isCollapsed ? '+' : '-'}
                    </span>
                    <span>{cat.category_name}</span>
                  </button>
                  <span className="admin-category-badge">{groupObj.totalCount} items</span>
                </h3>

                {!isCollapsed && (
                  <div id={`catalog-panel-${catalogId}`} className="admin-category-panel">
                    {groupObj.totalCount === 0 ? (
                      <div className="admin-empty-table" style={{ minHeight: '80px', background: '#fcfdfd' }}>
                        No items in this category.
                      </div>
                    ) : (
                      Object.keys(subGroups).map((subGroupName) => {
                        const productsList = subGroups[subGroupName];
                        return (
                          <div key={subGroupName} className="admin-subgroup-group">
                        <h4 className="admin-subgroup-title">
                          {subGroupName || 'General'} ({productsList.length})
                        </h4>
                        <div className="admin-data-table-wrap">
                          <table className="admin-data-table">
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>External ID</th>
                                <th>Catalog #</th>
                                <th>Category ID</th>
                                <th>Group</th>
                                <th>Price</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {productsList.map((product) => {
                                const pId = product.id || product.product_id;
                                return (
                                  <tr key={pId}>
                                    <td>
                                      <div className="admin-product-cell">
                                        {product.image_url && (
                                          <img 
                                            src={formatAssetUrl(product.image_url)} 
                                            alt="" 
                                            className="admin-thumb" 
                                          />
                                        )}
                                        <span style={{ fontWeight: 500 }}>{product.product_name}</span>
                                      </div>
                                    </td>
                                    <td><code>{product.external_id}</code></td>
                                    <td>{product.catalog_number || '—'}</td>
                                    <td>{product.category_external_id || '—'}</td>
                                    <td>{product.product_group || '—'}</td>
                                    <td>{product.list_price || '—'}</td>
                                    <td>
                                      <span className={`admin-badge ${product.hidden ? 'badge-muted' : 'badge-success'}`}>
                                        {product.hidden ? 'Hidden' : 'Visible'}
                                      </span>
                                      {product.is_featured && <span className="admin-badge badge-accent">Featured</span>}
                                    </td>
                                    <td>
                                      <div className="admin-row-actions">
                                        <button className="admin-action-btn edit" onClick={() => handleEdit(pId)}>Edit</button>
                                        <button className="admin-action-btn delete" onClick={() => handleDelete(pId)}>Hide</button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && editingProduct && (
        <div className="admin-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="admin-modal admin-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{(editingProduct.product_id || editingProduct.id) ? 'Edit Product' : 'Create Product'}</h3>
              <button className="admin-modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSave} className="admin-modal-body">
              <div className="admin-form-grid">
                <label className="admin-form-field span-2">
                  <span>Product Name *</span>
                  <input type="text" value={editingProduct.product_name || ''} onChange={(e) => updateField('product_name', e.target.value)} required />
                </label>
                <label className="admin-form-field">
                  <span>External ID *</span>
                  <input type="text" value={editingProduct.external_id || ''} onChange={(e) => updateField('external_id', e.target.value)} required />
                </label>
                <label className="admin-form-field">
                  <span>Catalog Number</span>
                  <input type="text" value={editingProduct.catalog_number || ''} onChange={(e) => updateField('catalog_number', e.target.value)} />
                </label>
                <label className="admin-form-field">
                  <span>Category *</span>
                  <select 
                    value={editingProduct.category_external_id || ''} 
                    onChange={(e) => updateField('category_external_id', e.target.value)}
                    required
                  >
                    <option value="">-- Select Category --</option>
                    {matchedCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.id})
                      </option>
                    ))}
                    <option value="uncategorized">Uncategorized / Custom</option>
                  </select>
                </label>
                <label className="admin-form-field">
                  <span>Product Group (Subcategory)</span>
                  <input type="text" value={editingProduct.product_group || ''} onChange={(e) => updateField('product_group', e.target.value)} placeholder="e.g. DNA, RNA, Non-Viral" />
                </label>
                <label className="admin-form-field">
                  <span>List Price</span>
                  <input type="text" value={editingProduct.list_price || ''} onChange={(e) => updateField('list_price', e.target.value)} />
                </label>
                <div className="admin-form-field span-2" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontWeight: '500', color: 'var(--ink)' }}>Main Image</span>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    {editingProduct.image_url ? (
                      <div className="admin-image-preview-wrapper" style={{ position: 'relative', width: '100px', height: '100px', border: '1px solid var(--line)', borderRadius: '6px', overflow: 'hidden', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img 
                          src={formatAssetUrl(editingProduct.image_url)} 
                          alt="Main Preview" 
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                        <button
                          type="button"
                          onClick={() => updateField('image_url', '')}
                          style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(244, 67, 54, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div style={{ width: '100px', height: '100px', border: '1px dashed var(--line)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '12px', background: '#fcfdfd', textAlign: 'center', padding: '5px' }}>
                        No Image
                      </div>
                    )}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <input 
                        type="text" 
                        placeholder="Image URL or Path (e.g. media/product_images/...)" 
                        value={editingProduct.image_url || ''} 
                        onChange={(e) => updateField('image_url', e.target.value)} 
                        style={{ width: '100%', padding: '8px', border: '1px solid var(--line)', borderRadius: '6px' }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label className="secondary-admin-button" style={{ fontSize: '12px', padding: '6px 12px', cursor: 'pointer', margin: 0, display: 'inline-block' }}>
                          Upload File
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => handleImageUpload(e, 'image_url')} 
                            style={{ display: 'none' }}
                          />
                        </label>
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>or type route above</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="admin-form-field span-3" style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--line)', paddingTop: '15px', marginTop: '10px' }}>
                  <span style={{ fontWeight: '600', color: 'var(--ink)' }}>Additional Gallery Images</span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '15px', marginTop: '5px' }}>
                    {(editingProduct.images || []).map((imgUrl, idx) => (
                      <div key={idx} className="admin-image-preview-wrapper" style={{ position: 'relative', height: '150px', border: '1px solid var(--line)', borderRadius: '6px', overflow: 'hidden', background: '#fff', display: 'flex', flexDirection: 'column', padding: '5px', gap: '5px' }}>
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', minHeight: '80px', position: 'relative' }}>
                          {imgUrl ? (
                            <img 
                              src={formatAssetUrl(imgUrl)} 
                              alt={`Preview ${idx + 1}`} 
                              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                            />
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Empty Path</span>
                          )}
                        </div>
                        <input
                          type="text"
                          value={imgUrl || ''}
                          onChange={(e) => {
                            const newImages = [...(editingProduct.images || [])];
                            newImages[idx] = e.target.value;
                            updateField('images', newImages);
                          }}
                          placeholder="Image path"
                          style={{ fontSize: '11px', padding: '4px', width: '100%', border: '1px solid var(--line)', borderRadius: '4px' }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = (editingProduct.images || []).filter((_, i) => i !== idx);
                            updateField('images', newImages);
                          }}
                          style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(244, 67, 54, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    
                    {/* Add Image Option Card */}
                    <div style={{ height: '150px', border: '1px dashed var(--line)', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#fcfdfd', padding: '10px' }}>
                      <button 
                        type="button" 
                        className="secondary-admin-button" 
                        onClick={() => {
                          const newImages = [...(editingProduct.images || []), ''];
                          updateField('images', newImages);
                        }}
                        style={{ fontSize: '12px', padding: '6px 10px', width: '100%' }}
                      >
                        + Add Path
                      </button>
                      <label className="primary-button" style={{ fontSize: '12px', padding: '6px 10px', width: '100%', textAlign: 'center', cursor: 'pointer', display: 'inline-block', margin: 0 }}>
                        + Upload File
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleImageUpload(e, 'images')} 
                          style={{ display: 'none' }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
                <label className="admin-form-field span-3">
                  <span>Description</span>
                  <textarea rows="4" value={editingProduct.description || ''} onChange={(e) => updateField('description', e.target.value)} />
                </label>
                <label className="admin-form-field span-3">
                  <span>Content Text</span>
                  <textarea rows="3" value={editingProduct.content_text || ''} onChange={(e) => updateField('content_text', e.target.value)} />
                </label>
                <label className="admin-form-field">
                  <span>Availability</span>
                  <input type="text" value={editingProduct.availability || ''} onChange={(e) => updateField('availability', e.target.value)} />
                </label>
                <label className="admin-form-field">
                  <span>Source Type</span>
                  <input type="text" value={editingProduct.source_type || ''} onChange={(e) => updateField('source_type', e.target.value)} />
                </label>
                <label className="admin-form-field">
                  <span>Display Order</span>
                  <input type="number" value={editingProduct.display_order || ''} onChange={(e) => updateField('display_order', e.target.value ? parseInt(e.target.value) : null)} />
                </label>
              </div>
              <div className="admin-form-toggles">
                <label className="admin-toggle">
                  <input type="checkbox" checked={!!editingProduct.hidden} onChange={(e) => updateField('hidden', e.target.checked)} />
                  <span>Hidden</span>
                </label>
                <label className="admin-toggle">
                  <input type="checkbox" checked={!!editingProduct.is_featured} onChange={(e) => updateField('is_featured', e.target.checked)} />
                  <span>Featured</span>
                </label>
                <label className="admin-toggle">
                  <input type="checkbox" checked={!!editingProduct.quote_only} onChange={(e) => updateField('quote_only', e.target.checked)} />
                  <span>Quote Only</span>
                </label>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="secondary-admin-button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button" disabled={saving}>
                  {saving ? 'Saving...' : ((editingProduct.product_id || editingProduct.id) ? 'Update Product' : 'Create Product')}
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
              <h3>Edit Catalog</h3>
              <button className="admin-modal-close" onClick={() => setIsCatalogModalOpen(false)}>×</button>
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
                      <th>Products</th>
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
                        <td>{row.product_count || 0}</td>
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

export default AdminProducts;
