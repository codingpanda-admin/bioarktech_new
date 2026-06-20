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

  const matchedCategories = categoryFilter === 'products' ? PRODUCTS_CATEGORIES : REAGENTS_CATEGORIES;

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
            
            if (selectedCategory === 'All' && groupObj.totalCount === 0) {
              return null;
            }

            return (
              <div key={cat.category_id} className="admin-category-group">
                <h3 className="admin-category-title">
                  <span>{cat.category_name}</span>
                  <span className="admin-category-badge">{groupObj.totalCount} items</span>
                </h3>

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
            );
          })}
        </div>
      )}

      {isModalOpen && editingProduct && (
        <div className="admin-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
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
                <label className="admin-form-field">
                  <span>Image URL</span>
                  <input type="text" value={editingProduct.image_url || ''} onChange={(e) => updateField('image_url', e.target.value)} />
                </label>
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
    </>
  );
}

export default AdminProducts;
