import React, { useState, useEffect } from 'react';
import { logo, apiFetch, formatAssetUrl } from '../utils/api';

function ProductDetailsPage({ navigate, skuOrCatalog, onAddToCart }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('specifications');
  
  // Featured product specific states
  const [mainImage, setMainImage] = useState(logo);
  const [selectedUnitSize, setSelectedUnitSize] = useState(null);
  const [cartAdded, setCartAdded] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError('');
      try {
        const productDetail = await apiFetch(`/api/products/load-product-by-external-id/${encodeURIComponent(skuOrCatalog)}/`);
        
        if (!productDetail) {
          throw new Error('The requested product could not be found.');
        }
        
        setProduct(productDetail);
        if (productDetail && Array.isArray(productDetail.unit_prices) && productDetail.unit_prices.length > 0) {
          setSelectedUnitSize(productDetail.unit_prices[0]);
        } else {
          setSelectedUnitSize(null);
        }
        setMainImage(
          productDetail.image_url
            ? formatAssetUrl(productDetail.image_url)
            : productDetail.images?.[0]
              ? formatAssetUrl(typeof productDetail.images[0] === 'string' ? productDetail.images[0] : productDetail.images[0].image)
              : logo
        );
      } catch (err) {
        console.error(err);
        setError(err.message || 'Unable to load product details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [skuOrCatalog]);

  const handleAddToCart = () => {
    if (onAddToCart && product) {
      onAddToCart(product, quantity, isFeatured ? selectedUnitSize : null);
    }
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 2000);
  };

  if (loading) return <div className="spinner" />;
  if (error) {
    return (
      <main className="search-results-section">
        <h2>Product Details</h2>
        <div className="alert-banner error">{error}</div>
        <a href="/" className="secondary-link" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Back to Home</a>
      </main>
    );
  }

  if (!product) return null;

  const isFeatured = product && Array.isArray(product.unit_prices);
  const name = product.product_name || product.externalId || product.external_id;
  const sku = product.catalog_number || product.externalId || product.external_id;
  
  // Calculate price dynamically for featured products based on selected unit size
  const price = isFeatured ? selectedUnitSize?.unit_price : product.unit_price;
  const listPrice = isFeatured ? selectedUnitSize?.list_price : product.list_price;
  const onDiscount = isFeatured ? selectedUnitSize?.on_discount : false;
  const discountPercent = onDiscount && listPrice && price ? Math.round(((listPrice - price) / listPrice) * 100) : 0;
  const displayPrice = price || product.price_range || product.list_price || 'Contact for Quote';

  return (
    <main className="product-page" style={{ width: 'min(1200px, calc(100% - 48px))', margin: '40px auto' }}>
      <div className="content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', marginBottom: '40px' }}>
        
        {/* Gallery Section */}
        <div className="diagram">
          <img src={mainImage} className="main-image" alt={name} style={{ width: '100%', maxHeight: '380px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--line)', padding: '20px' }} />
          {product.images && product.images.length > 1 && (
            <div className="preview" style={{ display: 'flex', gap: '10px', marginTop: '15px', overflowX: 'auto', paddingBottom: '10px' }}>
              {product.images.map((imgObj, idx) => {
                const imageUrl = typeof imgObj === 'string' ? imgObj : imgObj.image;
                return (
                  <img
                    key={idx}
                    src={formatAssetUrl(imageUrl)}
                    alt="preview"
                    onClick={() => setMainImage(formatAssetUrl(imageUrl))}
                    style={{ width: '70px', height: '70px', objectFit: 'contain', border: '1px solid var(--line)', borderRadius: '6px', cursor: 'pointer', padding: '5px', background: '#fff' }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Info Panel Section */}
        <div className="product-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2>{name}</h2>
          <p>Cat. #: <strong>{sku}</strong></p>
          <p className="availability" style={{ color: 'var(--green)', fontWeight: 500 }}>Availability: In Stock</p>

          {/* Unit Size Selection (Featured only) */}
          {isFeatured && product.unit_prices && product.unit_prices.length > 0 && (
            <div className="spec-container" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="spec-label" style={{ fontWeight: 500, color: 'var(--muted)' }}>Spec:</span>
              <div className="spec-options" style={{ display: 'flex', gap: '8px' }}>
                {product.unit_prices.map((unit) => (
                  <button
                    key={unit.id}
                    type="button"
                    className={`spec-tag ${selectedUnitSize?.id === unit.id ? 'spec-selected' : ''}`}
                    onClick={() => setSelectedUnitSize(unit)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: selectedUnitSize?.id === unit.id ? '2px solid var(--blue)' : '1px solid var(--line)',
                      background: selectedUnitSize?.id === unit.id ? 'rgba(0, 111, 242, 0.05)' : '#fff',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    {unit.unit_size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price display */}
          {onDiscount ? (
            <div>
              <p className="discount-price" style={{ margin: 0, fontSize: '24px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="discount-percent" style={{ background: '#f44336', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '14px' }}>
                  -{discountPercent}%
                </span>
                <span className="price" style={{ color: 'var(--blue)' }}>${price}</span>
              </p>
              <p className="list-price-block" style={{ margin: '5px 0 0', color: 'var(--muted)' }}>
                List Price: <span className="list-price" style={{ textDecoration: 'line-through' }}>${listPrice}</span>
              </p>
            </div>
          ) : (
            <p className="price" style={{ fontSize: '28px', fontWeight: 600, color: 'var(--blue)', margin: 0 }}>
              {typeof displayPrice === 'number' ? `$${displayPrice}` : displayPrice}
            </p>
          )}

          {/* Quantity Selector */}
          <div className="quantity" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
            <label htmlFor="qty" style={{ fontWeight: 500 }}>Qty</label>
            <input 
              id="qty" 
              type="number" 
              min="1" 
              value={quantity} 
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              style={{ width: '60px', padding: '8px', borderRadius: '6px', border: '1px solid var(--line)', textAlign: 'center' }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
            <button 
              type="button" 
              className="primary-button" 
              onClick={handleAddToCart}
              style={{ padding: '12px 28px' }}
            >
              {cartAdded ? 'Added to Cart!' : 'Add to Cart'}
            </button>
            <button 
              type="button" 
              className="secondary-button" 
              onClick={() => navigate('/')}
              style={{ padding: '12px 28px', border: '1px solid var(--line)', background: 'transparent', color: 'var(--ink)' }}
            >
              Back to Products
            </button>
          </div>
        </div>
      </div>

      {/* Tabs / Info Table Section */}
      <div className="product-info-table">
        <div className="product-info-nav">
          <ul className="nav nav-tabs" style={{ display: 'flex', borderBottom: '1px solid var(--line)', padding: 0, listStyle: 'none', gap: '24px' }}>
            <li className="nav-item">
              <a
                className={`nav-link ${activeTab === 'specifications' ? 'active' : ''}`}
                onClick={() => setActiveTab('specifications')}
                style={{ display: 'block', padding: '12px 0', fontWeight: 500, cursor: 'pointer', borderBottom: activeTab === 'specifications' ? '2px solid var(--blue)' : 'none', color: activeTab === 'specifications' ? 'var(--blue)' : 'var(--muted)' }}
              >
                Specifications
              </a>
            </li>
            {isFeatured && product.performance_data && (
              <li className="nav-item">
                <a
                  className={`nav-link ${activeTab === 'performance-data' ? 'active' : ''}`}
                  onClick={() => setActiveTab('performance-data')}
                  style={{ display: 'block', padding: '12px 0', fontWeight: 500, cursor: 'pointer', borderBottom: activeTab === 'performance-data' ? '2px solid var(--blue)' : 'none', color: activeTab === 'performance-data' ? 'var(--blue)' : 'var(--muted)' }}
                >
                  Performance Data
                </a>
              </li>
            )}
            {isFeatured && product.manuals && product.manuals.length > 0 && (
              <li className="nav-item">
                <a
                  className={`nav-link ${activeTab === 'manuals' ? 'active' : ''}`}
                  onClick={() => setActiveTab('manuals')}
                  style={{ display: 'block', padding: '12px 0', fontWeight: 500, cursor: 'pointer', borderBottom: activeTab === 'manuals' ? '2px solid var(--blue)' : 'none', color: activeTab === 'manuals' ? 'var(--blue)' : 'var(--muted)' }}
                >
                  Manuals
                </a>
              </li>
            )}
          </ul>
        </div>

        {/* Specifications Tab */}
        {activeTab === 'specifications' && (
          <div style={{ marginTop: '24px' }}>
            <div className="tab-header" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Product Information</div>
            <table className="product-specifications-table">
              <tbody>
                {isFeatured ? (
                  <>
                    <tr>
                      <td>Description</td>
                      <td dangerouslySetInnerHTML={{ __html: product.description }}></td>
                    </tr>
                    {product.key_features && (
                      <tr>
                        <td>Key Features</td>
                        <td dangerouslySetInnerHTML={{ __html: product.key_features }}></td>
                      </tr>
                    )}
                    {product.storage_info && (
                      <tr>
                        <td>Storage & Stability</td>
                        <td dangerouslySetInnerHTML={{ __html: product.storage_info }}></td>
                      </tr>
                    )}
                    {product.ship_info && (
                      <tr>
                        <td>Shipping Info</td>
                        <td dangerouslySetInnerHTML={{ __html: product.ship_info }}></td>
                      </tr>
                    )}
                  </>
                ) : (
                  <>
                    {product.description && (
                      <tr>
                        <td>Description</td>
                        <td>{product.description}</td>
                      </tr>
                    )}
                    {product.category_external_id && (
                      <tr>
                        <td>Category</td>
                        <td>{product.category_external_id}</td>
                      </tr>
                    )}
                    {product.product_group && (
                      <tr>
                        <td>Product Group</td>
                        <td>{product.product_group}</td>
                      </tr>
                    )}
                    {product.catalog_number && (
                      <tr>
                        <td>Catalog Number</td>
                        <td>{product.catalog_number}</td>
                      </tr>
                    )}
                    {product.key_features && product.key_features.length > 0 && (
                      <tr>
                        <td>Key Features</td>
                        <td>
                          <ul>
                            {product.key_features.map((feature, idx) => (
                              <li key={idx}>{feature}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                    {product.storage_stability && (
                      <tr>
                        <td>Storage & Stability</td>
                        <td>{product.storage_stability}</td>
                      </tr>
                    )}
                    {product.performance_data && (
                      <tr>
                        <td>Performance Data</td>
                        <td>{product.performance_data}</td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Performance Data Tab */}
        {activeTab === 'performance-data' && isFeatured && (
          <div style={{ marginTop: '24px' }}>
            <div className="tab-header" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Performance Data</div>
            <table className="product-specifications-table">
              <tbody>
                <tr>
                  <td dangerouslySetInnerHTML={{ __html: product.performance_data }}></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Manuals Tab */}
        {activeTab === 'manuals' && isFeatured && (
          <div style={{ marginTop: '24px' }}>
            <div className="tab-header" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Manuals</div>
            <div className="manual-table">
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {product.manuals.map((man, idx) => (
                  <li key={idx}>
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href={formatAssetUrl(man.manual)}
                      style={{ color: 'var(--blue)', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}
                    >
                      Document: {man.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default ProductDetailsPage;
