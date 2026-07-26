import React, { useState, useEffect, useRef } from 'react';
import { logo, apiFetch, formatAssetUrl } from '../utils/api';
import { formatRichText } from '../utils/richText';
import QuoteRequestForm from '../components/QuoteRequestForm';
import {
  CONSUMABLES_CATEGORIES,
  REAGENTS_CATEGORIES,
  SERVICES_CATEGORIES,
} from '../data/catalogCategories';

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

const REAGENT_CATEGORY_IDS = new Set(
  [...REAGENTS_CATEGORIES, ...CONSUMABLES_CATEGORIES]
    .map((category) => category.id)
    .filter((categoryId) => !categoryId.startsWith('all-'))
);

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
  const [featuredServices, setFeaturedServices] = useState([]);
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

  useEffect(() => {
    let isCurrent = true;

    apiFetch('/api/interface/get-featured-services/')
      .then((services) => {
        if (isCurrent) {
          setFeaturedServices(Array.isArray(services) ? services : []);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setFeaturedServices([]);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

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
  const categoryExternalId = product.category_external_id || product.categoryExternalId || '';
  const normalizedCategoryLabel = String(
    product.category_name || product.categoryName || product.product_category || ''
  ).toLowerCase();
  const isReagent = String(product.source_type || '').toLowerCase() === 'reagent'
    || REAGENT_CATEGORY_IDS.has(categoryExternalId)
    || normalizedCategoryLabel.includes('reagent')
    || normalizedCategoryLabel.includes('consumable');
  const reagentKeyFeatures = isReagent && Array.isArray(product.key_features)
    ? (product.key_features.length === 1
      ? product.key_features[0]
      : product.key_features.map((feature) => `- ${feature}`).join('\n'))
    : '';
  const name = product.product_name || product.externalId || product.external_id;
  const breadcrumbSection = isReagent
    ? { label: 'Reagents', href: '/search?category=reagents' }
    : { label: 'Products', href: '/search?category=products' };
  const categoryLabel = product.category_name || product.categoryName || product.product_category || product.category_external_id;
  const productGroupLabel = product.service_group
    || product.serviceGroup
    || product.product_group
    || product.productGroup
    || product.group_name
    || product.groupName;
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
        <nav className="product-breadcrumb service-page-breadcrumb" aria-label="Breadcrumb">
          <a href="/" onClick={(event) => { event.preventDefault(); navigate('/'); }}>
            Home
          </a>
          <span aria-hidden="true">/</span>
          <a
            href="/search?category=services"
            onClick={(event) => {
              event.preventDefault();
              navigate('/search?category=services');
            }}
          >
            Services
          </a>
          <span aria-hidden="true">/</span>
          <span>{categoryLabel || productGroupLabel || 'Service'}</span>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{name}</span>
        </nav>

        <div className="service-detail-layout">
          <aside className="service-detail-navigation" aria-labelledby="featured-services-heading">
            <h2 id="featured-services-heading">Featured Services</h2>
            {featuredServices.length > 0 ? (
              <nav aria-label="Featured Services">
                {featuredServices.map((service) => {
                  const serviceHref = `/product/${service.url}`;
                  const isActiveService = String(service.url) === String(skuOrCatalog);

                  return (
                    <a
                      key={service.id || service.url}
                      href={serviceHref}
                      className={`service-detail-nav-link ${isActiveService ? 'is-active' : ''}`}
                      aria-current={isActiveService ? 'page' : undefined}
                      onClick={(event) => {
                        event.preventDefault();
                        navigate(serviceHref);
                      }}
                    >
                      {service.title}
                    </a>
                  );
                })}
              </nav>
            ) : (
              <p className="service-detail-nav-empty">No featured services are available.</p>
            )}
          </aside>

          <div className="service-detail-main">
            <div className={`service-detail-banner ${hasServiceImage ? '' : 'is-fallback'}`}>
              <img src={mainImage} alt={name} />
              <button
                type="button"
                className="primary-button service-banner-quote-button"
                onClick={handleRequestQuote}
              >
                Request for Quote
              </button>
            </div>

            <header className="service-detail-heading">
              <h1>{name}</h1>
              <div className="product-detail-labels" aria-label="Service labels">
                {categoryLabel && <span className="product-detail-pill category">{categoryLabel}</span>}
                {productGroupLabel && <span className="product-detail-pill subgroup">{productGroupLabel}</span>}
                {availabilityLabel && <span className="product-detail-pill availability">{availabilityLabel}</span>}
              </div>
            </header>

            <section className="service-detail-copy" aria-label="Service information">
            <div className="service-detail-tabs" role="tablist" aria-label="Service information">
              <button
                type="button"
                id="service-details-tab"
                className={activeTab === 'details' ? 'is-active' : ''}
                role="tab"
                aria-selected={activeTab === 'details'}
                aria-controls="service-details-panel"
                onClick={() => setActiveTab('details')}
              >
                Detail
              </button>
              <button
                type="button"
                id="service-performance-tab"
                className={activeTab === 'performance' ? 'is-active' : ''}
                role="tab"
                aria-selected={activeTab === 'performance'}
                aria-controls="service-performance-panel"
                onClick={() => setActiveTab('performance')}
              >
                Performance
              </button>
              <button
                type="button"
                id="service-documents-tab"
                className={activeTab === 'documents' ? 'is-active' : ''}
                role="tab"
                aria-selected={activeTab === 'documents'}
                aria-controls="service-documents-panel"
                onClick={() => setActiveTab('documents')}
              >
                Documents
              </button>
            </div>

            {activeTab === 'details' && (
              <div
                id="service-details-panel"
                className="service-detail-tab-panel"
                role="tabpanel"
                aria-labelledby="service-details-tab"
              >
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
              </div>
            )}

            {activeTab === 'performance' && (
              <div
                id="service-performance-panel"
                className="service-detail-tab-panel"
                role="tabpanel"
                aria-labelledby="service-performance-tab"
              >
                {product.performance_data ? (
                  <div
                    className="blog-detail-content product-detail-content"
                    dangerouslySetInnerHTML={{ __html: formatRichText(product.performance_data) }}
                  />
                ) : (
                  <div className="admin-empty-table service-detail-empty">
                    No performance information available.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'documents' && (
              <div
                id="service-documents-panel"
                className="service-detail-tab-panel"
                role="tabpanel"
                aria-labelledby="service-documents-tab"
              >
                {productDocuments.length > 0 ? (
                  <div className="document-list">
                    {productDocuments.map((document) => {
                      const fileUrl = document.url ? formatAssetUrl(document.url) : '';

                      return (
                        <article className="document-item-card" key={document.key}>
                          <div className="document-card-main-info">
                            <div className="document-icon-wrapper" aria-hidden="true">DOC</div>
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
                              <span className="service-document-unavailable">File unavailable</span>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="admin-empty-table service-detail-empty">
                    No service documents available.
                  </div>
                )}
              </div>
            )}
            </section>
          </div>
        </div>

        {quoteModal}
      </main>
    );
  }

  return (
    <main className="product-page" style={{ width: 'min(1200px, calc(100% - 48px))', margin: '40px auto' }}>
      <nav className="product-breadcrumb product-page-breadcrumb" aria-label="Breadcrumb">
        <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Home</a>
        <span aria-hidden="true">/</span>
        <a
          href={breadcrumbSection.href}
          onClick={(e) => {
            e.preventDefault();
            navigate(breadcrumbSection.href);
          }}
        >
          {breadcrumbSection.label}
        </a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{name}</span>
      </nav>

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
          <h2>{name}</h2>
          <div className="product-detail-labels" aria-label="Product labels">
            {categoryLabel && <span className="product-detail-pill category">{categoryLabel}</span>}
            {isReagent && productGroupLabel && (
              <span className="product-detail-pill subgroup">{productGroupLabel}</span>
            )}
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
