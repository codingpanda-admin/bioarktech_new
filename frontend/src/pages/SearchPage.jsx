import React, { useState, useEffect } from 'react';
import { apiFetch, formatAssetUrl } from '../utils/api';
import ProductVisual from '../components/ProductVisual';

function SearchPage({ navigate, currentQuery, currentCategory }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');

  useEffect(() => {
    const doSearch = async () => {
      setLoading(true);
      setError('');
      try {
        const url = `/api/search/?q=${encodeURIComponent(currentQuery)}&category=${encodeURIComponent(currentCategory)}`;
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

  // Sort products
  const sortedResults = [...results].sort((a, b) => {
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
    : currentCategory === 'consumables' 
      ? 'Consumables & Laboratory Supplies' 
      : currentCategory === 'reagents' 
        ? 'Reagents & Kits Catalog' 
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

        .badge-category.consumable {
          background: #ecfdf5;
          color: #059669;
          border: 1px solid #a7f3d0;
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
          {currentCategory === 'consumables' 
            ? 'Browse our complete catalog of high-quality laboratory consumables, including cryogenic storage, cell culture flasks, serological pipettes, centrifuge tubes, qPCR plates, and personal protective equipment (PPE).'
            : currentCategory === 'reagents'
              ? 'Discover our state-of-the-art biological reagents, enzymes, protein ladders, DNA markers, transfection reagents, and qPCR master mixes designed for maximum accuracy and reproducibility.'
              : 'Empowering molecular biology, genomics, and cellular research with high-performance reagents, kits, and laboratory supplies.'}
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="search-tabs">
        <button 
          className={`search-tab-button ${!currentCategory ? 'active' : ''}`}
          onClick={() => handleTabChange('')}
        >
          All Products
        </button>
        <button 
          className={`search-tab-button ${currentCategory === 'reagents' ? 'active' : ''}`}
          onClick={() => handleTabChange('reagents')}
        >
          Reagents & Kits
        </button>
        <button 
          className={`search-tab-button ${currentCategory === 'consumables' ? 'active' : ''}`}
          onClick={() => handleTabChange('consumables')}
        >
          Consumables & Supplies
        </button>
      </div>

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
          {(currentQuery || currentCategory) && (
            <button className="btn-reset" onClick={() => navigate('/search')}>
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
            const shippingCost = prod.shipping_cost || (isConsumable ? 100 : 40);

            return (
              <article className="modern-product-card" key={idx}>
                {/* Floating Badges */}
                <div className="card-badges">
                  <span className={`badge-category ${isConsumable ? 'consumable' : 'reagent'}`}>
                    {isConsumable ? 'Consumable' : 'Reagent / Kit'}
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
                  <h3 className="card-title" title={prod.product_name}>{prod.product_name}</h3>
                  
                  <div className="card-price-row">
                    <span className="card-price">
                      ${prod.unit_price ? Number(prod.unit_price).toFixed(2) : '0.00'}
                    </span>
                    {prod.list_price && Number(prod.list_price) > Number(prod.unit_price) && (
                      <span className="card-list-price">
                        ${Number(prod.list_price).toFixed(2)}
                      </span>
                    )}
                  </div>

                  <a 
                    href="#" 
                    className="card-action-btn"
                    onClick={(e) => { e.preventDefault(); navigate(`/product/${prod.product_sku}`); }}
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

      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <a href="/" className="secondary-link" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
          ← Back to homepage
        </a>
      </div>
    </main>
  );
}

export default SearchPage;
