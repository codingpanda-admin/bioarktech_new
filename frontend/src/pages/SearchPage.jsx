import React, { useState, useEffect } from 'react';
import { apiFetch, formatAssetUrl } from '../utils/api';
import ProductVisual from '../components/ProductVisual';
import {
  CONSUMABLES_CATEGORIES,
  PRODUCTS_CATEGORIES,
  REAGENTS_CATEGORIES,
  SERVICES_CATEGORIES
} from '../data/catalogCategories';

const ALL_REAGENT_CATEGORIES = [
  ...REAGENTS_CATEGORIES,
  ...CONSUMABLES_CATEGORIES,
];

const getProductGroup = (product) => String(product?.product_group || '').trim();

function SearchPage({ navigate, currentQuery, currentCategory, initialSelectedCategory }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [selectedCategory, setSelectedCategory] = useState(initialSelectedCategory);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);

  useEffect(() => {
    setSelectedCategory(initialSelectedCategory);
    setSelectedSubcategory(null);
  }, [initialSelectedCategory]);

  useEffect(() => {
    setSelectedSubcategory(null);
  }, [currentQuery, currentCategory]);

  useEffect(() => {
    if (currentQuery) {
      const matchedCat = [
        ...PRODUCTS_CATEGORIES,
        ...SERVICES_CATEGORIES,
        ...ALL_REAGENT_CATEGORIES
      ].find(c => c.label.toLowerCase() === currentQuery.trim().toLowerCase());

      if (matchedCat && matchedCat.id !== 'all-products' && matchedCat.id !== 'all-reagents' && matchedCat.id !== 'all-services') {
        navigate(`/search?category=${currentCategory || ''}&cat=${matchedCat.id}`);
      }
    }
  }, [currentQuery, currentCategory, navigate]);

  useEffect(() => {
    const doSearch = async () => {
      setLoading(true);
      setError('');
      try {
        const apiCat = currentCategory === 'consumables' ? 'reagents' : currentCategory;
        const url = `/api/search/?q=${encodeURIComponent(currentQuery)}&category=${encodeURIComponent(apiCat || '')}&page_size=10000`;
        const data = await apiFetch(url);
        setResults(data.products || []);
      } catch (err) {
        setError('Error al realizar la búsqueda. Por favor, intente de nuevo.');
      } finally {
        setLoading(false);
      }
    };
    doSearch();
  }, [currentQuery, currentCategory]);

  const handleTabChange = (categoryVal) => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    navigate(`/search?q=${encodeURIComponent(currentQuery)}&category=${categoryVal}`);
  };

  const getVisualType = (prod) => {
    const name = (prod.product_name || "").toLowerCase();
    if (name.includes('kit')) return 'kit';
    if (name.includes('vector')) return 'dna';
    if (name.includes('lenti')) return 'vial';
    if (name.includes('gel') || name.includes('agarose')) return 'ladder';
    return 'bottle';
  };

  // Filter products by the selected catalog category first so the group chips
  // always reflect groups that are available in the current result set.
  const categoryFilteredResults = results.filter(prod => {
    if (!selectedCategory) return true;

    if (selectedCategory === 'all-products') {
      return prod.category === 'Products & Services';
    }
    if (selectedCategory === 'all-reagents') {
      return prod.category === 'Reagents & Kits' || prod.category === 'Consumables';
    }
    if (selectedCategory === 'all-services') {
      return prod.category === 'Services';
    }

    return prod.category_external_id === selectedCategory;
  });

  const productGroupOptions = Array.from(
    categoryFilteredResults.reduce((groups, product) => {
      const group = getProductGroup(product);
      if (group) groups.set(group, (groups.get(group) || 0) + 1);
      return groups;
    }, new Map())
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const groupFilterLabel = currentCategory === 'services' ? 'Service groups' : 'Product groups';

  const filteredResults = selectedSubcategory
    ? categoryFilteredResults.filter(prod => getProductGroup(prod) === selectedSubcategory)
    : categoryFilteredResults;

  // Sort filtered products
  const sortedResults = [...filteredResults].sort((a, b) => {
    if (sortBy === 'name-asc') {
      return a.product_name.localeCompare(b.product_name);
    }
    if (sortBy === 'name-desc') {
      return b.product_name.localeCompare(a.product_name);
    }
    if (sortBy === 'price-asc') {
      return (a.unit_price || 0) - (b.unit_price || 0);
    }
    if (sortBy === 'price-desc') {
      return (b.unit_price || 0) - (a.unit_price || 0);
    }
    return 0;
  });

  const displayTitle = currentQuery 
    ? `Results for "${currentQuery}"` 
    : (currentCategory === 'consumables' || currentCategory === 'reagents')
      ? 'Reagents & Kits'
      : currentCategory === 'services'
        ? 'Services Catalog'
        : currentCategory === 'products'
          ? 'Products Catalog'
          : currentCategory === 'featured'
            ? 'Featured Products'
          : 'All Products';

  return (
    <main className="search-container">
      {/* Localized Component CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        .search-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 40px 20px;
          font-family: var(--font, 'Inter', sans-serif);
        }

        .search-header-banner {
          background: linear-gradient(135deg, #071936 0%, #0d2c5c 100%);
          border-radius: 20px;
          padding: 50px 40px;
          margin-bottom: 40px;
          color: white;
          position: relative;
          overflow: hidden;
          box-shadow: 0 12px 30px rgba(7, 25, 54, 0.15);
        }

        .search-header-banner::before {
          content: '';
          position: absolute;
          top: -100px;
          right: -100px;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(10, 116, 255, 0.18) 0%, transparent 70%);
          border-radius: 50%;
        }

        .search-header-banner h1 {
          font-size: 2.2rem;
          font-weight: 600;
          margin: 0 0 10px 0;
          letter-spacing: 0;
          color: #ffffff;
        }

        .search-header-banner p {
          color: #a5b4fc;
          font-size: 1.1rem;
          margin: 0;
          max-width: 700px;
          line-height: 1.5;
        }

        .search-tabs {
          display: flex;
          gap: 8px;
          border-bottom: 2px solid #e2e8f0;
          margin-bottom: 30px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        
        .search-tabs::-webkit-scrollbar {
          display: none;
        }

        .search-tab-button {
          background: transparent;
          border: none;
          color: #64748b;
          padding: 14px 28px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
          border-bottom: 3px solid transparent;
          margin-bottom: -2px;
          white-space: nowrap;
        }

        .search-tab-button:hover {
          color: #0f172a;
        }

        .search-tab-button.active {
          color: #0064df;
          border-bottom-color: #0064df;
        }

        /* Sidebar Layout */
        .search-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 40px;
          align-items: start;
        }

        @media (max-width: 992px) {
          .search-layout {
            grid-template-columns: 1fr;
            gap: 30px;
          }
        }

        .search-sidebar {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
          position: sticky;
          top: 20px;
        }

        .sidebar-title {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 20px 0;
          padding-bottom: 10px;
          border-bottom: 1px solid #e2e8f0;
        }

        .sidebar-group {
          margin-bottom: 24px;
        }

        .sidebar-group-title {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          margin-bottom: 12px;
        }

        .sidebar-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sidebar-item-btn {
          width: 100%;
          text-align: left;
          background: transparent;
          border: none;
          color: #475569;
          font-size: 14px;
          font-weight: 500;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .sidebar-item-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .sidebar-item-btn.active {
          background: #e0f2fe;
          color: #0369a1;
          font-weight: 600;
        }

        .sidebar-sublist {
          list-style: none;
          padding-left: 16px;
          margin-top: 4px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sidebar-subitem-btn {
          width: 100%;
          text-align: left;
          background: transparent;
          border: none;
          color: #64748b;
          font-size: 13px;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .sidebar-subitem-btn:hover {
          background: #f8fafc;
          color: #0f172a;
        }

        .sidebar-subitem-btn.active {
          color: #0284c7;
          font-weight: 600;
        }

        /* Controls row */
        .search-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .search-stats {
          font-size: 15px;
          color: #475569;
          font-weight: 500;
        }

        .search-filter-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .product-group-filters {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin: -10px 0 30px;
        }

        .product-group-filter-label {
          flex: 0 0 auto;
          padding-top: 8px;
          color: #64748b;
          font-size: 13px;
          font-weight: 600;
        }

        .product-group-bubbles {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .product-group-bubble {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          min-height: 34px;
          border: 1px solid #cbd5e1;
          border-radius: 999px;
          padding: 6px 12px;
          color: #475569;
          background: #fff;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
        }

        .product-group-bubble:hover,
        .product-group-bubble:focus-visible {
          border-color: #0064df;
          color: #0064df;
        }

        .product-group-bubble:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(0, 100, 223, 0.15);
        }

        .product-group-bubble.active {
          border-color: #0064df;
          color: #fff;
          background: #0064df;
        }

        .product-group-bubble-count {
          min-width: 20px;
          border-radius: 999px;
          padding: 2px 6px;
          color: #64748b;
          background: #f1f5f9;
          font-size: 10px;
          text-align: center;
        }

        .product-group-bubble.active .product-group-bubble-count {
          color: #0052b8;
          background: #fff;
        }

        .product-group-bubble-remove {
          font-size: 15px;
          line-height: 1;
        }

        @media (max-width: 640px) {
          .product-group-filters {
            flex-direction: column;
            gap: 8px;
          }

          .product-group-filter-label {
            padding-top: 0;
          }
        }

        .search-sort-select {
          padding: 10px 16px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background-color: white;
          color: #1e293b;
          font-size: 14px;
          font-weight: 500;
          outline: none;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 180px;
        }

        .search-sort-select:focus {
          border-color: #0064df;
          box-shadow: 0 0 0 3px rgba(0, 100, 223, 0.15);
        }

        /* Grid layout */
        .modern-product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 30px;
          margin-bottom: 40px;
        }

        .modern-product-card {
          border: 1px solid rgba(10, 116, 255, 0.08);
          border-radius: 16px;
          background: white;
          box-shadow: 0 8px 24px rgba(7, 25, 54, 0.02);
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
          padding: 16px;
          min-height: 400px;
        }

        .modern-product-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 36px rgba(10, 116, 255, 0.08);
          border-color: rgba(10, 116, 255, 0.25);
        }

        .card-badges {
          position: absolute;
          top: 12px;
          left: 12px;
          right: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 10;
          pointer-events: none;
        }

        .badge-category {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0;
        }

        .badge-category.reagent {
          background: #eceffd;
          color: #4f46e5;
          border: 1px solid #c7d2fe;
        }

        .badge-category.product {
          background: #fef3c7;
          color: #d97706;
          border: 1px solid #fde68a;
        }

        .badge-shipping {
          background: rgba(255, 255, 255, 0.95);
          color: #475569;
          border: 1px solid #e2e8f0;
          font-size: 11px;
          font-weight: 500;
          padding: 4px 10px;
          border-radius: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
        }

        .card-image-container {
          height: 180px;
          background: radial-gradient(circle, #f8fafc 0%, #ffffff 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 24px;
          margin-bottom: 16px;
          overflow: hidden;
          position: relative;
        }

        .card-image-container img {
          max-height: 90%;
          max-width: 90%;
          object-fit: contain;
          transition: transform 0.4s ease;
        }

        .modern-product-card:hover .card-image-container img {
          transform: scale(1.08);
        }

        .card-details {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }

        .card-sku {
          font-size: 11px;
          font-weight: 500;
          color: #94a3b8;
          letter-spacing: 0;
          margin-bottom: 6px;
          text-transform: uppercase;
        }

        .card-product-group {
          width: fit-content;
          margin-bottom: 8px;
          border-radius: 999px;
          padding: 3px 8px;
          color: #175cd3;
          background: #eff8ff;
          font-size: 10px;
          font-weight: 600;
          line-height: 1.3;
        }

        .card-title {
          font-size: 15px;
          font-weight: 600;
          color: #1e293b;
          line-height: 1.4;
          margin: 0 0 12px 0;
          height: 42px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .card-price-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-top: auto;
          margin-bottom: 16px;
        }

        .card-price {
          font-size: 18px;
          font-weight: 600;
          color: #0f172a;
        }

        .card-list-price {
          font-size: 14px;
          color: #94a3b8;
          text-decoration: line-through;
        }

        .card-action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background-color: transparent;
          border: 2px solid #0064df;
          color: #0064df;
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 500;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          width: 100%;
          box-sizing: border-box;
        }

        .card-action-btn:hover {
          background-color: #0064df;
          color: white;
        }

        .card-action-btn svg {
          transition: transform 0.2s ease;
        }

        .card-action-btn:hover svg {
          transform: translateX(4px);
        }

        /* Empty State */
        .search-empty {
          text-align: center;
          padding: 60px 20px;
          background-color: #f8fafc;
          border-radius: 20px;
          border: 1px dashed #cbd5e1;
          margin: 40px 0;
        }

        .search-empty h3 {
          font-size: 1.25rem;
          color: #334155;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .search-empty p {
          color: #64748b;
          margin-bottom: 24px;
        }

        .btn-reset {
          background-color: #0064df;
          color: white;
          border: none;
          padding: 12px 24px;
          font-weight: 500;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .btn-reset:hover {
          background-color: #004fb0;
        }

        .spinner-container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 80px 0;
        }
      `}} />

      {/* Header Banner */}
      <div className="search-header-banner">
        <h1>{displayTitle}</h1>
        <p>
          {(currentCategory === 'consumables' || currentCategory === 'reagents')
            ? 'Discover our biological reagents, enzymes, transfection kits, and premium laboratory consumables, including cryogenic storage, cell culture supplies, serological pipettes, and PCR plates.'
            : currentCategory === 'services'
              ? 'Empowering scientific workflows with our custom cloning, stable cell line generation, lentivirus packaging, and molecular biology support services.'
              : currentCategory === 'products'
                ? 'Empowering molecular biology, genomics, and cellular research with high-performance reagents, kits, and laboratory supplies.'
                : 'Explore BioArk Tech\'s comprehensive selection of genetic tools, high-performance reagents, and premium lab supplies.'}
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="search-tabs">
        <button 
          className={`search-tab-button ${!currentCategory ? 'active' : ''}`}
          onClick={() => handleTabChange('')}
        >
          All
        </button>
        <button 
          className={`search-tab-button ${currentCategory === 'products' ? 'active' : ''}`}
          onClick={() => handleTabChange('products')}
        >
          Products
        </button>
        <button 
          className={`search-tab-button ${currentCategory === 'services' ? 'active' : ''}`}
          onClick={() => handleTabChange('services')}
        >
          Services
        </button>
        <button 
          className={`search-tab-button ${(currentCategory === 'reagents' || currentCategory === 'consumables') ? 'active' : ''}`}
          onClick={() => handleTabChange('reagents')}
        >
          Reagents & Kits
        </button>
        <button 
          className={`search-tab-button ${currentCategory === 'featured' ? 'active' : ''}`}
          onClick={() => handleTabChange('featured')}
        >
          Featured
        </button>
      </div>

      <div className="search-layout">
        {/* Sidebar Filters */}
        <aside className="search-sidebar">
          <h3 className="sidebar-title">Filters</h3>

          {/* Products Categories */}
          {(!currentCategory || currentCategory === 'products' || currentCategory === 'featured') && (
            <div className="sidebar-group">
              <h4 className="sidebar-group-title">Products</h4>
              <ul className="sidebar-list">
                {PRODUCTS_CATEGORIES.map(cat => (
                  <li key={cat.id}>
                    <button
                      className={`sidebar-item-btn ${selectedCategory === cat.id && !selectedSubcategory ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedCategory(selectedCategory === cat.id && !selectedSubcategory ? null : cat.id);
                        setSelectedSubcategory(null);
                      }}
                    >
                      {cat.label}
                    </button>
                    {cat.subcategories && selectedCategory === cat.id && (
                      <ul className="sidebar-sublist">
                        {cat.subcategories.map(sub => (
                          <li key={sub}>
                            <button
                              className={`sidebar-subitem-btn ${selectedSubcategory === sub ? 'active' : ''}`}
                              onClick={() => setSelectedSubcategory(selectedSubcategory === sub ? null : sub)}
                            >
                              {sub}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Services Categories */}
          {(!currentCategory || currentCategory === 'services') && (
            <div className="sidebar-group">
              <h4 className="sidebar-group-title">Services</h4>
              <ul className="sidebar-list">
                {SERVICES_CATEGORIES.map(cat => (
                  <li key={cat.id}>
                    <button
                      className={`sidebar-item-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedCategory(selectedCategory === cat.id ? null : cat.id);
                        setSelectedSubcategory(null);
                      }}
                    >
                      {cat.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Reagents Categories */}
          {(!currentCategory || currentCategory === 'reagents' || currentCategory === 'consumables' || currentCategory === 'featured') && (
            <div className="sidebar-group">
              <h4 className="sidebar-group-title">Reagents & Kits</h4>
              <ul className="sidebar-list">
                {ALL_REAGENT_CATEGORIES.map(cat => (
                  <li key={cat.id}>
                    <button
                      className={`sidebar-item-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedCategory(selectedCategory === cat.id ? null : cat.id);
                        setSelectedSubcategory(null);
                      }}
                    >
                      {cat.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>

        {/* Results section */}
        <div className="search-results-main">
          {/* Stats and Sorting Controls */}
          <div className="search-controls">
            <div className="search-stats">
              {!loading && `Showing ${sortedResults.length} ${sortedResults.length === 1 ? 'product' : 'products'}`}
            </div>
            <div className="search-filter-actions">
              <select 
                className="search-sort-select" 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort products"
              >
                <option value="name-asc">Alphabetical (A-Z)</option>
                <option value="name-desc">Alphabetical (Z-A)</option>
                <option value="price-asc">Price (Low to High)</option>
                <option value="price-desc">Price (High to Low)</option>
              </select>
            </div>
          </div>

          {!loading && productGroupOptions.length > 0 && (
            <div className="product-group-filters" aria-label={`Filter by ${groupFilterLabel.toLowerCase()}`}>
              <span className="product-group-filter-label">{groupFilterLabel}</span>
              <div className="product-group-bubbles">
                {productGroupOptions.map(({ name, count }) => {
                  const isActive = selectedSubcategory === name;
                  return (
                    <button
                      className={`product-group-bubble ${isActive ? 'active' : ''}`}
                      key={name}
                      type="button"
                      aria-pressed={isActive}
                      aria-label={isActive ? `Remove ${name} group filter` : `Filter by ${name}`}
                      onClick={() => setSelectedSubcategory(isActive ? null : name)}
                    >
                      <span>{name}</span>
                      <span className="product-group-bubble-count">{count}</span>
                      {isActive && <span className="product-group-bubble-remove" aria-hidden="true">×</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="spinner-container">
              <div className="spinner" />
            </div>
          )}

          {/* Error state */}
          {error && <div className="alert-banner error" style={{ marginBottom: '30px' }}>{error}</div>}
          
          {/* Empty State */}
          {!loading && !error && sortedResults.length === 0 && (
            <div className="search-empty">
              <h3>No products found</h3>
              <p>We couldn't find any products matching your current search criteria or category filter.</p>
              {(currentQuery || currentCategory || selectedCategory) && (
                <button className="btn-reset" onClick={() => { handleTabChange(''); setSelectedCategory(null); setSelectedSubcategory(null); }}>
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Products Grid */}
          {!loading && !error && sortedResults.length > 0 && (
            <div className="modern-product-grid">
              {sortedResults.map((prod, idx) => {
                const imgUrl = prod.image ? formatAssetUrl(prod.image) : null;
                const isConsumable = prod.category === 'Consumables';
                const isReagent = prod.category === 'Reagents & Kits' || isConsumable;
                const shippingCost = prod.shipping_cost || (isConsumable ? 100 : 40);

                return (
                  <article className="modern-product-card" key={idx}>
                    {/* Floating Badges */}
                    <div className="card-badges" style={{ flexWrap: 'wrap', gap: '4px' }}>
                      {prod.is_featured && (
                        <span className="badge-featured" style={{
                          background: 'linear-gradient(135deg, #ff9900 0%, #ff5500 100%)',
                          color: 'white',
                          fontSize: '10px',
                          fontWeight: '700',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          textTransform: 'uppercase',
                          boxShadow: '0 2px 4px rgba(255, 85, 0, 0.2)',
                          border: 'none'
                        }}>
                          ★ Featured
                        </span>
                      )}
                      <span className={`badge-category ${isReagent ? 'reagent' : 'product'}`}>
                        {isReagent ? 'Reagent / Kit' : 'Product / Service'}
                      </span>
                      <span className="badge-shipping">
                        ${shippingCost} Shipping
                      </span>
                    </div>

                    {/* Product Image / Visual fallback */}
                    <div className="card-image-container">
                      {imgUrl ? (
                        <img src={imgUrl} alt={prod.product_name} />
                      ) : (
                        <ProductVisual type={getVisualType(prod)} />
                      )}
                    </div>

                    {/* Details */}
                    <div className="card-details">
                      <span className="card-sku">SKU / Catalog: {prod.product_sku}</span>
                      {prod.product_group && (
                        <span className="card-product-group">{prod.product_group}</span>
                      )}
                      <h3 className="card-title" title={prod.product_name}>{prod.product_name}</h3>
                      
                      <div className="card-price-row">
                        <span className="card-price">
                          {prod.unit_price && Number(prod.unit_price) > 0 
                            ? `$${Number(prod.unit_price).toFixed(2)}` 
                            : (prod.list_price || 'Contact for Quote')}
                        </span>
                        {prod.list_price && Number(prod.list_price) > Number(prod.unit_price) && Number(prod.unit_price) > 0 && (
                          <span className="card-list-price">
                            ${Number(prod.list_price).toFixed(2)}
                          </span>
                        )}
                      </div>

                      <a 
                        href="#" 
                        className="card-action-btn"
                        onClick={(e) => { e.preventDefault(); navigate(`/product/${prod.externalId || prod.external_id || prod.product_sku}`); }}
                      >
                        View Details
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="5" y1="12" x2="19" y2="12"></line>
                          <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <a href="/" className="secondary-link" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
          ← Back to homepage
        </a>
      </div>
    </main>
  );
}

export default SearchPage;
