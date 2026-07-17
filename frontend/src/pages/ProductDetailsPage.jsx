import React, { useState, useEffect, useRef } from 'react';
import { logo, apiFetch, formatAssetUrl } from '../utils/api';
import { formatRichText } from '../utils/richText';
import QuoteRequestForm from '../components/QuoteRequestForm';
import { SERVICES_CATEGORIES } from '../data/catalogCategories';

const SERVICE_CATEGORY_ALIASES = {
  'genome-editing-service': 'Genome Editing Services',
  'genome-editing': 'Genome Editing Services',
  'synthesis-cloning': 'Custom Cloning Services',
  'custom-cloning': 'Custom Cloning Services',
  'dna-cloning-service': 'Custom Cloning Services',
  'cell-line-generation': 'Stable Cell Line Services',
  'stable-cell-line': 'Stable Cell Line Services',
  'virus-packaging': 'Lentivirus Package Services',
  'lentivirus-package': 'Lentivirus Package Services',
  'lentivirus-packaging-services': 'Lentivirus Package Services',
  'vector-construction': 'Vector Construction Support',
  'functional-testing': 'Functional Testing',
  'lab-supplies': 'Lab Supplies',
  'project-consultation': 'Project Consultation'
};

function ProductDetailsPage({ navigate, skuOrCatalog, onAddToCart, currentUser, currentUserProfile }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('details');
  
  // Featured product specific states
  const [mainImage, setMainImage] = useState(logo);
  const [selectedUnitSize, setSelectedUnitSize] = useState(null);
  const [cartAdded, setCartAdded] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showQuoteConfirmation, setShowQuoteConfirmation] = useState(false);
  const thumbnailStripRef = useRef(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError('');
      setActiveTab('details');
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
    if (product?.quote_only || product?.quoteOnly) {
      return;
    }

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
  const isReagent = String(product.source_type || '').toLowerCase() === 'reagent';
  const reagentKeyFeatures = isReagent && Array.isArray(product.key_features)
    ? (product.key_features.length === 1
      ? product.key_features[0]
      : product.key_features.map((feature) => `- ${feature}`).join('\n'))
    : '';
  const name = product.product_name || product.externalId || product.external_id;
  const categoryLabel = product.category_name || product.categoryName || product.product_category || product.category_external_id;
  const serviceGroupLabel = product.product_group || product.productGroup;
  const serviceCategoryValues = [
    product.category_external_id,
    product.categoryExternalId,
    product.product_category,
    product.category_name,
    product.categoryName,
  ].filter(Boolean).map(value => String(value).toLowerCase());
  const isService = String(product.source_type || '').toLowerCase() === 'service'
    || String(product.product_id || '').startsWith('svc-')
    || SERVICES_CATEGORIES.some(category => (
      serviceCategoryValues.includes(category.id.toLowerCase())
      || serviceCategoryValues.includes(category.label.toLowerCase())
    ));
  const availabilityLabel = product.availability;
  const quoteOnly = Boolean(product.quote_only || product.quoteOnly);
  const productCode = product.catalog_number || product.product_sku || product.external_id || product.externalId || '';
  const detailsContent = formatRichText(
    product.content_text || product.contentText || product.raw_detail?.contentText || ''
  );
  const documentFileName = (value) => {
    const cleanValue = String(value || '').split('?')[0].split('#')[0];
    const fileName = cleanValue.split('/').filter(Boolean).pop();
    try {
      return decodeURIComponent(fileName || 'Product document');
    } catch {
      return fileName || 'Product document';
    }
  };
  const normalizeDocument = (document, index) => {
    if (typeof document === 'string') {
      return {
        name: documentFileName(document),
        url: document,
        type: 'Product Document',
        key: `${document}-${index}`,
      };
    }

    const url = document?.url || document?.manual || document?.download_url || document?.file || '';
    return {
      name: document?.name || document?.title || documentFileName(url),
      url,
      type: document?.type || 'Product Document',
      key: document?.id || `${url || document?.name || 'document'}-${index}`,
    };
  };
  const apiDocuments = Array.isArray(product.documents)
    ? product.documents.map(normalizeDocument)
    : [];
  const legacyDocuments = (() => {
    const manuals = Array.isArray(product.manuals) ? product.manuals : [];
    const manualUrls = Array.isArray(product.manual_urls) ? product.manual_urls : [];
    return Array.from({ length: Math.max(manuals.length, manualUrls.length) }, (_, index) => {
      const manual = manuals[index];
      const storedUrl = manualUrls[index];
      if (manual && typeof manual === 'object') {
        return normalizeDocument({
          ...manual,
          url: manual.url || manual.manual || storedUrl,
        }, index);
      }
      const url = storedUrl || manual || '';
      return normalizeDocument({
        name: storedUrl && manual && storedUrl !== manual ? manual : documentFileName(url),
        url,
        type: 'Product Document',
      }, index);
    });
  })();
  const productDocuments = apiDocuments.length > 0 ? apiDocuments : legacyDocuments;
  const getImageUrl = (image) => {
    if (!image) return '';
    if (typeof image === 'string') return image;
    return image.image || image.url || image.image_url || '';
  };
  const productImages = Array.from(new Set([
    product.image_url,
    ...(Array.isArray(product.images) ? product.images.map(getImageUrl) : []),
  ].filter(Boolean)));
  const showThumbnailNav = productImages.length > 4;

  const scrollThumbnails = (direction) => {
    if (!thumbnailStripRef.current) return;
    thumbnailStripRef.current.scrollBy({
      left: direction * 260,
      behavior: 'smooth',
    });
  };

  const getProductQuoteDescription = () => (
    isService
      ? [
          `Service Name: ${name || 'N/A'}`,
          `Service Code: ${productCode || 'N/A'}`,
          `Service Category: ${categoryLabel || 'N/A'}`,
        ].join('\n')
      : [
          `Product Name: ${name || 'N/A'}`,
          `Product Code: ${productCode || 'N/A'}`,
          `Product Group: ${product.product_group || product.productGroup || 'N/A'}`,
          `Product Category: ${categoryLabel || 'N/A'}`,
        ].join('\n')
  );

  const getQuoteServiceType = () => {
    const categoryValues = [
      product.category_external_id,
      product.categoryExternalId,
      product.product_category,
      product.category_name,
      product.categoryName,
      categoryLabel
    ].filter(Boolean);

    const aliasedCategory = categoryValues
      .map(value => SERVICE_CATEGORY_ALIASES[String(value).toLowerCase()])
      .find(Boolean);

    if (aliasedCategory) {
      return aliasedCategory;
    }

    const serviceCategoryMatch = SERVICES_CATEGORIES.find(category => (
      categoryValues.some(value => String(value).toLowerCase() === category.id.toLowerCase() || String(value).toLowerCase() === category.label.toLowerCase())
    ));

    return serviceCategoryMatch?.label || 'Products';
  };

  const handleRequestQuote = () => {
    setShowQuoteModal(true);
    setShowQuoteConfirmation(false);
  };
  
  // Calculate price dynamically for featured products based on selected unit size
  const price = isFeatured ? selectedUnitSize?.unit_price : product.unit_price;
  const listPrice = isFeatured ? selectedUnitSize?.list_price : product.list_price;
  const onDiscount = isFeatured ? selectedUnitSize?.on_discount : false;
  const discountPercent = onDiscount && listPrice && price ? Math.round(((listPrice - price) / listPrice) * 100) : 0;
  const displayPrice = price || product.price_range || product.list_price || 'Contact for Quote';

  const quoteModal = showQuoteModal && (
    <div
      className="modal-overlay product-quote-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={showQuoteConfirmation ? 'quote-confirmation-title' : 'quote-form-title'}
      onClick={() => setShowQuoteModal(false)}
    >
      {showQuoteConfirmation ? (
        <div className="quote-confirmation-modal" onClick={(e) => e.stopPropagation()}>
          <h2 id="quote-confirmation-title">Quote Request Submitted</h2>
          <p>Your quote request has been submitted successfully. Our team will review the details and contact you shortly.</p>
          <button type="button" className="primary-button" onClick={() => setShowQuoteModal(false)}>
            Close
          </button>
        </div>
      ) : (
        <div className="quote-panel product-quote-modal" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="product-quote-modal-close"
            aria-label="Close quote form"
            onClick={() => setShowQuoteModal(false)}
          >
            x
          </button>
          <QuoteRequestForm
            currentUser={currentUser}
            currentUserProfile={currentUserProfile}
            initialProjectDescription={getProductQuoteDescription()}
            initialServiceType={getQuoteServiceType()}
            onSubmitted={() => setShowQuoteConfirmation(true)}
          />
        </div>
      )}
    </div>
  );

  if (isService) {
    const hasServiceImage = Boolean(product.image_url || productImages.length > 0);

    return (
      <main className="service-detail-page">
        <div className={`service-detail-banner ${hasServiceImage ? '' : 'is-fallback'}`}>
          <img src={mainImage} alt={name} />
        </div>

        <div className="service-detail-layout">
          <section className="service-detail-copy" aria-labelledby="service-details-heading">
            <h2 id="service-details-heading">Details</h2>
            {detailsContent ? (
              <div
                className="blog-detail-content product-detail-content"
                dangerouslySetInnerHTML={{ __html: detailsContent }}
              />
            ) : (
              <div className="admin-empty-table service-detail-empty">
                No additional details available.
              </div>
            )}
          </section>

          <aside className="service-detail-summary">
            {(categoryLabel || serviceGroupLabel) && (
              <nav className="product-breadcrumb" aria-label="Breadcrumb">
                {categoryLabel && <span>{categoryLabel}</span>}
                {categoryLabel && serviceGroupLabel && <span aria-hidden="true">/</span>}
                {serviceGroupLabel && <span>{serviceGroupLabel}</span>}
              </nav>
            )}
            <h1>{name}</h1>
            <div className="product-detail-labels" aria-label="Service labels">
              {categoryLabel && <span className="product-detail-pill category">{categoryLabel}</span>}
              {availabilityLabel && <span className="product-detail-pill availability">{availabilityLabel}</span>}
            </div>
            <div className="service-detail-actions">
              <button type="button" className="primary-button" onClick={handleRequestQuote}>
                Request for Quote
              </button>
              <button type="button" className="secondary-button" onClick={() => navigate('/search?category=services')}>
                Back to Services
              </button>
            </div>
          </aside>
        </div>

        <section className="service-specifications" aria-labelledby="service-specifications-heading">
          <h2 id="service-specifications-heading">Specifications</h2>
          <table className="product-specifications-table">
            <tbody>
              {categoryLabel && (
                <tr>
                  <td>Service Category</td>
                  <td>{categoryLabel}</td>
                </tr>
              )}
              {productCode && (
                <tr>
                  <td>Service Code</td>
                  <td>{productCode}</td>
                </tr>
              )}
              {availabilityLabel && (
                <tr>
                  <td>Availability</td>
                  <td>{availabilityLabel}</td>
                </tr>
              )}
              {(product.product_group || product.productGroup) && (
                <tr>
                  <td>Service Group</td>
                  <td>{product.product_group || product.productGroup}</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        {quoteModal}
      </main>
    );
  }

  return (
    <main className="product-page" style={{ width: 'min(1200px, calc(100% - 48px))', margin: '40px auto' }}>
      <div className="content" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: '48px', marginBottom: '40px' }}>
        
        {/* Gallery Section */}
        <div className="product-detail-gallery">
          <div className="product-main-image-frame">
            <img src={mainImage} className="product-main-image" alt={name} />
          </div>
          {productImages.length > 1 && (
            <div className={`product-thumbnail-carousel ${showThumbnailNav ? 'has-nav' : 'no-nav'}`}>
              {showThumbnailNav && (
                <button
                  type="button"
                  className="product-thumbnail-nav"
                  aria-label="Previous product images"
                  onClick={() => scrollThumbnails(-1)}
                >
                  <span className="product-thumbnail-chevron prev" aria-hidden="true" />
                </button>
              )}
              <div className="product-thumbnail-strip" ref={thumbnailStripRef}>
                {productImages.map((imageUrl, idx) => {
                  const thumbnailUrl = formatAssetUrl(imageUrl);
                  return (
                    <button
                      key={`${imageUrl}-${idx}`}
                      type="button"
                      className={`product-thumbnail-button ${mainImage === thumbnailUrl ? 'active' : ''}`}
                      onClick={() => setMainImage(thumbnailUrl)}
                      aria-label={`View product image ${idx + 1}`}
                    >
                      <img src={thumbnailUrl} alt="" />
                    </button>
                  );
                })}
              </div>
              {showThumbnailNav && (
                <button
                  type="button"
                  className="product-thumbnail-nav"
                  aria-label="Next product images"
                  onClick={() => scrollThumbnails(1)}
                >
                  <span className="product-thumbnail-chevron next" aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Info Panel Section */}
        <div className="product-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {categoryLabel && (
            <nav className="product-breadcrumb" aria-label="Breadcrumb">
              <span>{categoryLabel}</span>
              <span aria-hidden="true">/</span>
              <span>{name}</span>
            </nav>
          )}
          <h2>{name}</h2>
          <div className="product-detail-labels" aria-label="Product labels">
            {categoryLabel && <span className="product-detail-pill category">{categoryLabel}</span>}
            {availabilityLabel && <span className="product-detail-pill availability">{availabilityLabel}</span>}
          </div>

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
          {!quoteOnly && (
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
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
            {quoteOnly ? (
              <button
                type="button"
                className="primary-button"
                onClick={handleRequestQuote}
                style={{ padding: '12px 28px' }}
              >
                Request for Quote
              </button>
            ) : (
              <button 
                type="button" 
                className="primary-button" 
                onClick={handleAddToCart}
                style={{ padding: '12px 28px' }}
              >
                {cartAdded ? 'Added to Cart!' : 'Add to Cart'}
              </button>
            )}
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

      {quoteModal}

      {/* Tabs / Info Table Section */}
      <div className="product-info-table">
        <div className="product-info-nav">
          <ul className="nav nav-tabs" style={{ display: 'flex', borderBottom: '1px solid var(--line)', padding: 0, listStyle: 'none', gap: '24px' }}>
            <li className="nav-item">
              <a
                className={`nav-link ${activeTab === 'details' ? 'active' : ''}`}
                onClick={() => setActiveTab('details')}
                style={{ display: 'block', padding: '12px 0', fontWeight: 500, cursor: 'pointer', borderBottom: activeTab === 'details' ? '2px solid var(--blue)' : 'none', color: activeTab === 'details' ? 'var(--blue)' : 'var(--muted)' }}
              >
                Details
              </a>
            </li>
            <li className="nav-item">
              <a
                className={`nav-link ${activeTab === 'specifications' ? 'active' : ''}`}
                onClick={() => setActiveTab('specifications')}
                style={{ display: 'block', padding: '12px 0', fontWeight: 500, cursor: 'pointer', borderBottom: activeTab === 'specifications' ? '2px solid var(--blue)' : 'none', color: activeTab === 'specifications' ? 'var(--blue)' : 'var(--muted)' }}
              >
                Specifications
              </a>
            </li>
            <li className="nav-item">
              <a
                className={`nav-link ${activeTab === 'performance' ? 'active' : ''}`}
                onClick={() => setActiveTab('performance')}
                style={{ display: 'block', padding: '12px 0', fontWeight: 500, cursor: 'pointer', borderBottom: activeTab === 'performance' ? '2px solid var(--blue)' : 'none', color: activeTab === 'performance' ? 'var(--blue)' : 'var(--muted)' }}
              >
                Performance
              </a>
            </li>
            <li className="nav-item">
              <a
                className={`nav-link ${activeTab === 'documents' ? 'active' : ''}`}
                onClick={() => setActiveTab('documents')}
                style={{ display: 'block', padding: '12px 0', fontWeight: 500, cursor: 'pointer', borderBottom: activeTab === 'documents' ? '2px solid var(--blue)' : 'none', color: activeTab === 'documents' ? 'var(--blue)' : 'var(--muted)' }}
              >
                Documents
              </a>
            </li>
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
                        {isReagent ? (
                          <td dangerouslySetInnerHTML={{ __html: formatRichText(product.description) }} />
                        ) : (
                          <td>{product.description}</td>
                        )}
                      </tr>
                    )}
                    {categoryLabel && (
                      <tr>
                        <td>Product Category</td>
                        <td>{categoryLabel}</td>
                      </tr>
                    )}
                    {(product.product_group || product.productGroup) && (
                      <tr>
                        <td>Product Group</td>
                        <td>{product.product_group || product.productGroup}</td>
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
                        {isReagent ? (
                          <td dangerouslySetInnerHTML={{ __html: formatRichText(reagentKeyFeatures) }} />
                        ) : (
                          <td>
                            <ul>
                              {product.key_features.map((feature, idx) => (
                                <li key={idx}>{feature}</li>
                              ))}
                            </ul>
                          </td>
                        )}
                      </tr>
                    )}
                    {product.storage_stability && (
                      <tr>
                        <td>Storage & Stability</td>
                        {isReagent ? (
                          <td dangerouslySetInnerHTML={{ __html: formatRichText(product.storage_stability) }} />
                        ) : (
                          <td>{product.storage_stability}</td>
                        )}
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div style={{ marginTop: '24px' }}>
            <div className="tab-header" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Details</div>
            {detailsContent ? (
              <div
                className="blog-detail-content product-detail-content"
                dangerouslySetInnerHTML={{ __html: detailsContent }}
              />
            ) : (
              <div className="admin-empty-table" style={{ minHeight: '80px', background: '#fcfdfd' }}>
                No additional details available.
              </div>
            )}
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div style={{ marginTop: '24px' }}>
            <div className="tab-header" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Performance</div>
            {product.performance_data ? (
              <div
                className="blog-detail-content product-detail-content"
                dangerouslySetInnerHTML={{ __html: formatRichText(product.performance_data) }}
              />
            ) : (
              <div className="admin-empty-table" style={{ minHeight: '80px', background: '#fcfdfd' }}>
                No performance information available.
              </div>
            )}
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div style={{ marginTop: '24px' }}>
            <div className="tab-header" style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Documents</div>
            {productDocuments.length > 0 ? (
              <div className="document-list">
                {productDocuments.map((document) => {
                  const fileUrl = document.url ? formatAssetUrl(document.url) : '';
                  return (
                    <article className="document-item-card" key={document.key}>
                      <div className="document-card-main-info">
                        <div className="document-icon-wrapper" aria-hidden="true" style={{ fontSize: '12px', fontWeight: 800 }}>
                          DOC
                        </div>
                        <div className="document-text-wrapper">
                          <span className="document-category-badge">{document.type}</span>
                          <h3>
                            {fileUrl ? (
                              <a className="document-link" href={fileUrl} target="_blank" rel="noopener noreferrer">
                                {document.name}
                              </a>
                            ) : document.name}
                          </h3>
                        </div>
                      </div>
                      <div className="document-download-action">
                        {fileUrl ? (
                          <a className="document-download-btn" href={fileUrl} target="_blank" rel="noopener noreferrer">
                            Open document
                          </a>
                        ) : (
                          <span style={{ color: 'var(--muted)', fontSize: '14px' }}>File unavailable</span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="admin-empty-table" style={{ minHeight: '80px', background: '#fcfdfd' }}>
                No product documents available.
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default ProductDetailsPage;
