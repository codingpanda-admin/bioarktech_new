import React, { useState, useEffect } from 'react';
import { apiFetch, mockCategories, mockResources, getCategoryIcon, formatAssetUrl } from '../utils/api';
import { logo } from '../utils/api';
import IconMark from '../components/IconMark';
import ProductVisual from '../components/ProductVisual';

const HOME_BLOG_CATEGORIES = ['All', 'BioArk News', 'Biotech Outlook', 'Business News'];
const HOME_POPULAR_CATEGORY_LIMIT = 7;

const inferHomeBlogCategory = (blog) => {
  const text = `${blog?.title || ''} ${blog?.description || ''} ${blog?.tag || ''}`.toLowerCase();

  if (text.includes('bioark') || text.includes('company') || text.includes('growth')) {
    return 'BioArk News';
  }

  if (text.includes('business') || text.includes('market') || text.includes('economics')) {
    return 'Business News';
  }

  return 'Biotech Outlook';
};

const getHomeBlogCategory = (blog) => {
  if (HOME_BLOG_CATEGORIES.includes(blog?.category)) return blog.category;
  if (HOME_BLOG_CATEGORIES.includes(blog?.tag)) return blog.tag;
  return inferHomeBlogCategory(blog);
};

const getBlogTimestamp = (blog) => {
  const rawDate = blog?.date_posted || blog?.date || '';
  const timestamp = rawDate ? new Date(rawDate).getTime() : 0;
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const getRecentBlogs = (items) => (
  [...items].sort((a, b) => getBlogTimestamp(b) - getBlogTimestamp(a)).slice(0, 3)
);

const formatHomeBlogDate = (blog) => {
  const rawDate = blog?.date_posted || blog?.date || '';
  if (!rawDate) return '';

  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return rawDate;

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

const getHomeBlogHref = (blog, index) => {
  const blogId = blog?.id || blog?.blog_id || blog?.external_id;
  return blogId ? `/blog/${blogId}` : `/blog/mock-${index}`;
};

const defaultSlides = [
  {
    id: 1,
    eyebrow: 'Limited Offer',
    title: '<span>50% Off</span> Precast Agarose Gels',
    description: 'High-resolution, ready-to-use gels for fast and reliable DNA analysis.',
    primary_button_text: 'Shop Now',
    primary_button_link: '/search?q=Agarose',
    secondary_button_text: 'Request a Quote',
    secondary_button_link: '/request-quote',
    image_url: ''
  }
];

const getSlideImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('/images/')) {
    return url;
  }
  return formatAssetUrl(url);
};

const getCategoryImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('/images/') || url.startsWith('/img/')) return url;
  return formatAssetUrl(url);
};

const getCategoryHref = (category) => {
  const categoryId = category?.external_id || category?.externalId || category?.id;
  const categoryName = category?.category_name || category?.name || '';
  if (!categoryId) return `/search?q=${encodeURIComponent(categoryName)}`;

  const productType = String(category?.product_type || 'product').toLowerCase();
  const searchCategory = productType === 'service'
    ? 'services'
    : productType === 'reagent'
      ? 'reagents'
      : productType === 'consumable'
        ? 'consumables'
        : 'products';

  return `/search?category=${searchCategory}&cat=${encodeURIComponent(categoryId)}`;
};

const HomeSectionHeading = ({ id, title, href, linkLabel, navigate }) => (
  <div className="home-section-heading">
    <h2 id={id}>{title}</h2>
    <a
      className="home-section-heading-arrow"
      href={href}
      aria-label={linkLabel}
      title={linkLabel}
      onClick={(event) => {
        event.preventDefault();
        navigate(href);
      }}
    >
      <span aria-hidden="true">→</span>
    </a>
  </div>
);

function HomePage({ navigate, searchParams }) {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredGeneralProducts, setFeaturedGeneralProducts] = useState([]);
  const [featuredServices, setFeaturedServices] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [activeBlogCategory, setActiveBlogCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [featuredStartIndex, setFeaturedStartIndex] = useState(0);
  const [generalProductsStartIndex, setGeneralProductsStartIndex] = useState(0);
  const [servicesStartIndex, setServicesStartIndex] = useState(0);
  const [slides, setSlides] = useState([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // Smooth scroll logic
  useEffect(() => {
    if (searchParams) {
      const scrollTarget = searchParams.get('scroll');
      if (scrollTarget) {
        setTimeout(() => {
          const element = document.getElementById(scrollTarget === 'categories' ? 'categories-title' : 'resources-title');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 200);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [
          catData,
          prodData,
          generalProdData,
          servicesData,
          blogData,
          slideData
        ] = await Promise.all([
          apiFetch('/api/products/load-product-categories/').catch(() => mockCategories),
          apiFetch('/api/products/get-latest-featured-products/').catch(() => []),
          apiFetch('/api/products/get-featured-general-products/').catch(() => []),
          apiFetch('/api/interface/get-homepage-services/').catch(() => []),
          apiFetch('/api/blogs/get-all-blogs/').catch(() => mockResources),
          apiFetch('/api/interface/get-homepage-slides/').catch(() => [])
        ]);

        setCategories(Array.isArray(catData) && catData.length > 0 ? catData : mockCategories);
        setFeaturedProducts(Array.isArray(prodData) ? prodData : []);
        setFeaturedGeneralProducts(Array.isArray(generalProdData) ? generalProdData : []);
        setFeaturedServices(Array.isArray(servicesData) ? servicesData : []);
        setBlogs(Array.isArray(blogData) && blogData.length > 0 ? blogData : mockResources);
        if (Array.isArray(slideData) && slideData.length > 0) {
          setSlides(slideData);
        }
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const activeSlides = slides.length > 0 ? slides : defaultSlides;
  const currentSlide = activeSlides[activeSlideIndex] || defaultSlides[0];
  const categorizedBlogs = blogs.map((blog, index) => ({
    ...blog,
    homeCategory: getHomeBlogCategory(blog),
    homeIndex: index,
  }));
  const visibleHomeBlogs = getRecentBlogs(
    categorizedBlogs.filter((blog) => (
      activeBlogCategory === 'All' || blog.homeCategory === activeBlogCategory
    ))
  );
  const selectedPopularCategories = categories.filter((category) => category.show_on_homepage);
  const remainingCategories = categories.filter((category) => !category.show_on_homepage);
  const popularCategories = [
    ...selectedPopularCategories,
    ...remainingCategories,
  ].slice(0, HOME_POPULAR_CATEGORY_LIMIT);

  const handlePrevSlide = () => {
    setActiveSlideIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  const handleNextSlide = () => {
    setActiveSlideIndex((prev) => (prev + 1) % activeSlides.length);
  };

  // Auto play carousel
  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % activeSlides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [activeSlides.length]);

  useEffect(() => {
    setFeaturedStartIndex(0);
  }, [featuredProducts.length]);

  const visibleFeaturedProducts = featuredProducts.length
    ? Array.from({ length: Math.min(4, featuredProducts.length) }, (_, offset) => {
        const index = (featuredStartIndex + offset) % featuredProducts.length;
        return { product: featuredProducts[index], index };
      })
    : [];

  const rollFeaturedProducts = (direction) => {
    if (featuredProducts.length <= 1) return;

    setFeaturedStartIndex((currentIndex) => (
      direction === 'next'
        ? (currentIndex + 1) % featuredProducts.length
        : (currentIndex - 1 + featuredProducts.length) % featuredProducts.length
    ));
  };

  useEffect(() => {
    setGeneralProductsStartIndex(0);
  }, [featuredGeneralProducts.length]);

  const visibleFeaturedGeneralProducts = featuredGeneralProducts.length
    ? Array.from({ length: Math.min(4, featuredGeneralProducts.length) }, (_, offset) => {
        const index = (generalProductsStartIndex + offset) % featuredGeneralProducts.length;
        return { product: featuredGeneralProducts[index], index };
      })
    : [];

  const rollGeneralProducts = (direction) => {
    if (featuredGeneralProducts.length <= 1) return;

    setGeneralProductsStartIndex((currentIndex) => (
      direction === 'next'
        ? (currentIndex + 1) % featuredGeneralProducts.length
        : (currentIndex - 1 + featuredGeneralProducts.length) % featuredGeneralProducts.length
    ));
  };

  useEffect(() => {
    setServicesStartIndex(0);
  }, [featuredServices.length]);

  const visibleFeaturedServices = featuredServices.length
    ? Array.from({ length: Math.min(4, featuredServices.length) }, (_, offset) => {
        const index = (servicesStartIndex + offset) % featuredServices.length;
        return { service: featuredServices[index], index };
      })
    : [];

  const rollFeaturedServices = (direction) => {
    if (featuredServices.length <= 1) return;

    setServicesStartIndex((currentIndex) => (
      direction === 'next'
        ? (currentIndex + 1) % featuredServices.length
        : (currentIndex - 1 + featuredServices.length) % featuredServices.length
    ));
  };

  if (loading) {
    return <div className="spinner" />;
  }

  return (
    <>
      <main className="home-page">
        <section className="hero-section">
          {currentSlide.image_url && (
            <div
              className="hero-background-image"
              style={{
                backgroundImage: `url("${getSlideImageUrl(currentSlide.image_url)}")`
              }}
            />
          )}
          <div className="hero-light-overlay" />

          <button 
            className="carousel-control prev" 
            type="button" 
            aria-label="Previous promotion"
            onClick={handlePrevSlide}
          >
            ‹
          </button>
          
          <div className="hero-content">
            {currentSlide.eyebrow && <p className="eyebrow">{currentSlide.eyebrow}</p>}
            <h1 dangerouslySetInnerHTML={{ __html: currentSlide.title }} />
            <p>{currentSlide.description}</p>
            <div className="hero-actions">
              {currentSlide.primary_button_text && (
                <a 
                  href={currentSlide.primary_button_link || '#'} 
                  className="primary-button"
                  onClick={(e) => {
                    if (currentSlide.primary_button_link?.startsWith('/')) {
                      e.preventDefault();
                      navigate(currentSlide.primary_button_link);
                    }
                  }}
                >
                  {currentSlide.primary_button_text}
                </a>
              )}
              {currentSlide.secondary_button_text && (
                <a 
                  href={currentSlide.secondary_button_link || '#'} 
                  className="secondary-button"
                  onClick={(e) => {
                    if (currentSlide.secondary_button_link?.startsWith('/')) {
                      e.preventDefault();
                      navigate(currentSlide.secondary_button_link);
                    }
                  }}
                >
                  {currentSlide.secondary_button_text}
                </a>
              )}
            </div>
          </div>

          {currentSlide.image_url ? (
            <div className="hero-slide-empty-right-column" style={{ width: '100%', height: '100%', pointerEvents: 'none' }} />
          ) : (
            <div className="hero-art" aria-label="BioArk agarose gel promotion">
              <div className="dna-ribbon" />
              <div className="glow-platform" />
              <div className="gel-pack">
                <div className="pack-logo">BIOARK TECH</div>
                <div className="pack-lines" />
              </div>
              <div className="gel-tray">
                {Array.from({ length: 12 }).map((_, index) => (
                  <span key={index} />
                ))}
              </div>
              <div className="sample-box">
                {Array.from({ length: 8 }).map((_, index) => (
                  <span key={index} />
                ))}
              </div>
            </div>
          )}

          <button 
            className="carousel-control next" 
            type="button" 
            aria-label="Next promotion"
            onClick={handleNextSlide}
          >
            ›
          </button>
          
          <div className="hero-dots" aria-hidden="true">
            {activeSlides.map((_, idx) => (
              <span 
                key={idx}
                className={activeSlideIndex === idx ? 'is-active' : ''}
                onClick={() => setActiveSlideIndex(idx)}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </div>
        </section>


        <section className="categories-section" aria-labelledby="categories-title">
          <HomeSectionHeading
            id="categories-title"
            title="Explore Popular Categories"
            href="/search?q="
            linkLabel="View all product categories"
            navigate={navigate}
          />
          <div className="category-row">
            {popularCategories.map((cat, idx) => {
              const name = cat.category_name;
              const icon = cat.icon || getCategoryIcon(name);
              const imageUrl = getCategoryImageUrl(cat.homepage_image);
              const categoryHref = getCategoryHref(cat);
              return (
                <a
                  className="category-item"
                  href={categoryHref}
                  key={cat.category_id || cat.external_id || `${name}-${idx}`}
                  onClick={(e) => { e.preventDefault(); navigate(categoryHref); }}
                >
                  {imageUrl ? (
                    <span className="category-home-image">
                      <img src={imageUrl} alt="" />
                    </span>
                  ) : (
                    <IconMark type={icon} />
                  )}
                  <span>{name}<small>{cat.description || 'BioArk Category'}</small></span>
                </a>
              );
            })}
          </div>
        </section>

        <section className="products-section featured-solutions-section" aria-labelledby="products-title">
          <HomeSectionHeading
            id="products-title"
            title="Featured Solutions"
            href="/search?category=featured"
            linkLabel="View all featured items"
            navigate={navigate}
          />
          <p className="section-subtitle">
            Featured products, reagents, and scientific services selected to accelerate your research.
          </p>
          <div className="products-carousel" aria-label="Featured products, reagents, and services carousel">
            <button
              className="product-carousel-control product-carousel-prev"
              type="button"
              aria-label="Previous featured item"
              onClick={() => rollFeaturedProducts('prev')}
              disabled={featuredProducts.length <= 1}
            />
            <div className="product-carousel-viewport">
              <div className="product-grid product-carousel-grid">
                {visibleFeaturedProducts.map(({ product: prod, index }) => {
                  const name = prod.product_name;
                  const itemType = prod.item_type || (prod.source_type === 'reagent' ? 'reagent' : 'product');
                  const itemLabel = itemType === 'service'
                    ? 'Service'
                    : itemType === 'reagent'
                      ? 'Reagent'
                      : 'Product';
                  const rawPrice = prod.unit_price;
                  const priceStr = itemType === 'service'
                    ? 'Contact for Quote'
                    : rawPrice
                      ? (String(rawPrice).startsWith('$') || /^contact/i.test(String(rawPrice))
                        ? rawPrice
                        : `$${rawPrice}`)
                      : '$29.00 - $129.00';
                  const imgUrl = prod.image ? formatAssetUrl(prod.image) : null;
                  const productId = prod.externalId || prod.external_id || prod.catalog_number || prod.product_sku;
                  const productHref = productId ? `/product/${productId}` : `/search?q=${encodeURIComponent(name)}`;
                  
                  return (
                    <article className="product-card" key={`${prod.catalog_number || prod.product_sku || name}-${index}`}>
                      <span className={`featured-item-type-badge ${itemType}`}>{itemLabel}</span>
                      {imgUrl ? (
                        <div style={{ height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20px 0' }}>
                          <img src={imgUrl} alt={name} style={{ maxHeight: '100%', maxWidth: '100%', borderRadius: '8px' }} />
                        </div>
                      ) : (
                        <ProductVisual type={prod.visual || 'bottle'} />
                      )}
                      <h3>{name}</h3>
                      {itemType !== 'service' && (
                        <p className="rating">★★★★★ <span>({prod.reviews || '45'})</span></p>
                      )}
                      <p className="price">{priceStr}</p>
                      <a className="product-card-action" href={productHref} onClick={(e) => { e.preventDefault(); navigate(productHref); }}>View {itemLabel} <span>→</span></a>
                    </article>
                  );
                })}
              </div>
            </div>
            <button
              className="product-carousel-control product-carousel-next"
              type="button"
              aria-label="Next featured item"
              onClick={() => rollFeaturedProducts('next')}
              disabled={featuredProducts.length <= 1}
            />
          </div>
        </section>

        {featuredGeneralProducts.length > 0 && (
          <section className="products-section" aria-labelledby="general-products-title" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', borderTop: '1px solid var(--line)' }}>
            <div className="home-section-inner" style={{ margin: '0 auto', padding: '0 20px' }}>
              <HomeSectionHeading
                id="general-products-title"
                title="Products"
                href="/search?category=reagents"
                linkLabel="View all products"
                navigate={navigate}
              />
              <p className="section-subtitle" style={{ textAlign: 'center', marginBottom: '40px', color: 'var(--ink-light)', maxWidth: '1100px', margin: '0 auto 45px auto' }}>
                High-quality reagents, kits, and ladders selected to ensure precision and reproducibility in your experiments.
              </p>
              
              <div className="products-carousel" aria-label="Featured products carousel">
                <button
                  className="product-carousel-control product-carousel-prev"
                  type="button"
                  aria-label="Previous featured products"
                  onClick={() => rollGeneralProducts('prev')}
                  disabled={featuredGeneralProducts.length <= 1}
                />
                
                <div className="product-carousel-viewport">
                  <div className="product-grid product-carousel-grid">
                    {visibleFeaturedGeneralProducts.map(({ product: prod, index }) => {
                      const name = prod.product_name;
                      const priceStr = prod.unit_price ? `${prod.unit_price}` : (prod.list_price || 'Contact for Quote');
                      const imgUrl = prod.image ? formatAssetUrl(prod.image) : null;
                      const productId = prod.externalId || prod.external_id || prod.catalog_number;
                      const productHref = productId ? `/product/${productId}` : `/search?q=${encodeURIComponent(name)}`;
                      const openProduct = () => navigate(productHref);

                      return (
                        <article
                          className="product-card"
                          key={`${productId}-${index}`}
                          role="link"
                          tabIndex={0}
                          onClick={openProduct}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              openProduct();
                            }
                          }}
                          style={{ display: 'flex', flexDirection: 'column', height: '100%', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', border: '1px solid var(--line)', background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)', cursor: 'pointer' }}
                        >
                          {imgUrl ? (
                            <div style={{ height: '150px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '10px 0 20px 0' }}>
                              <img src={imgUrl} alt={name} style={{ maxHeight: '100%', maxWidth: '100%', borderRadius: '8px', objectFit: 'contain' }} />
                            </div>
                          ) : (
                            <ProductVisual type={prod.visual || 'bottle'} />
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                            <div>
                              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: '0 0 10px 0', minHeight: '48px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: 'var(--ink)' }}>{name}</h3>
                              <p className="rating" style={{ margin: '0 0 12px 0' }}>★★★★★ <span style={{ color: 'var(--ink-light)', fontSize: '0.85rem' }}>(4.8)</span></p>
                              <p className="price" style={{ margin: '0 0 20px 0', fontSize: '1.2rem', fontWeight: '700', color: 'var(--blue)' }}>{priceStr}</p>
                            </div>
                            <a className="product-card-action" href={productHref} onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(productHref); }}>View Details <span>→</span></a>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>

                <button
                  className="product-carousel-control product-carousel-next"
                  type="button"
                  aria-label="Next featured products"
                  onClick={() => rollGeneralProducts('next')}
                  disabled={featuredGeneralProducts.length <= 1}
                />
              </div>
            </div>
          </section>
        )}

        {featuredServices.length > 0 && (
          <section className="services-section" aria-labelledby="featured-services-title" style={{ background: '#f8fafc', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
            <div className="home-section-inner" style={{ margin: '0 auto', padding: '0 20px' }}>
              <HomeSectionHeading
                id="featured-services-title"
                title="Services"
                href="/search?category=services"
                linkLabel="View all services"
                navigate={navigate}
              />
              <p className="section-subtitle" style={{ textAlign: 'center', marginBottom: '45px', color: 'var(--ink-light)', maxWidth: '1100px', margin: '0 auto 45px auto' }}>
                Partner with our expert scientific team for custom cloning, high-titer virus packaging, and cell line engineering.
              </p>
              
              <div className="products-carousel" aria-label="Featured services carousel">
                <button
                  className="product-carousel-control product-carousel-prev"
                  type="button"
                  aria-label="Previous featured services"
                  onClick={() => rollFeaturedServices('prev')}
                  disabled={featuredServices.length <= 1}
                />
                <div className="product-carousel-viewport">
                  <div className="services-carousel-grid">
                    {visibleFeaturedServices.map(({ service, index }) => {
                      const name = service.title;
                      const cleanText = service.content
                        ? service.content.replace(/<[^>]*>/g, '').substring(0, 75) + '...'
                        : 'Custom research services for your workflows.';
                      const imgUrl = service.image ? formatAssetUrl(service.image) : null;
                      const serviceHref = `/product/${service.url}`;

                      return (
                        <article key={`${service.id}-${index}`} className="service-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', border: '1px solid var(--line)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(5, 31, 78, 0.04)', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}>
                          {imgUrl ? (
                            <div style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
                              <img src={imgUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} />
                              <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0, 111, 242, 0.9)', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600' }}>
                                {service.category ? service.category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Service'}
                              </div>
                            </div>
                          ) : (
                            <div style={{ height: '180px', background: 'linear-gradient(135deg, var(--blue) 0%, #1e40af 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '20px', color: '#fff', position: 'relative' }}>
                              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🧬</div>
                              <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(255, 255, 255, 0.2)', color: '#fff', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', backdropFilter: 'blur(4px)' }}>
                                {service.category ? service.category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Service'}
                              </div>
                            </div>
                          )}
                          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                            <div>
                              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0 0 12px 0', color: 'var(--blue-dark)', lineHeight: '1.4' }}>{name}</h3>
                              <p style={{ fontSize: '0.95rem', color: 'var(--ink-light)', lineHeight: '1.6', margin: '0 0 24px 0' }}>{cleanText}</p>
                            </div>
                            <div className="service-card-actions">
                              <a href={serviceHref} className="product-card-action" onClick={(e) => { e.preventDefault(); navigate(serviceHref); }}>Explore Service <span>→</span></a>
                              <a href="/request-quote" className="secondary-button" onClick={(e) => { e.preventDefault(); navigate(`/request-quote?service=${encodeURIComponent(name)}`); }} style={{ flex: 1, textAlign: 'center', padding: '10px 0', fontSize: '0.95rem', fontWeight: '600' }}>Get Quote</a>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
                <button
                  className="product-carousel-control product-carousel-next"
                  type="button"
                  aria-label="Next featured services"
                  onClick={() => rollFeaturedServices('next')}
                  disabled={featuredServices.length <= 1}
                />
              </div>
            </div>
          </section>
        )}

        <section className="about-section" aria-labelledby="about-title">
          <div className="about-copy">
            <h2 id="about-title">About BioArkTech</h2>
            <p>
              BioArkTech is dedicated to empowering life science research with innovative,
              high-quality products. From molecular biology reagents to advanced instruments,
              we provide reliable solutions that drive discovery and accelerate breakthroughs.
            </p>
            <div className="trust-row">
              <span>Premium Quality</span>
              <span>Reliable Results</span>
              <span>Fast Shipping</span>
              <span>Expert Support</span>
            </div>
          </div>
          <div className="video-card" aria-label="Bio Ark Tech video preview">
            <img src={logo} alt="" />
            <div className="video-line" />
            <div className="video-controls"><span /> 0:00 / 1:25 <b /></div>
          </div>
        </section>

        <section className="resources-section" aria-labelledby="resources-title">
          <HomeSectionHeading
            id="resources-title"
            title="Resources and Blogs"
            href="/blogs"
            linkLabel="View all resources and blogs"
            navigate={navigate}
          />
          <div className="home-blog-tabs" role="tablist" aria-label="Blog categories">
            {HOME_BLOG_CATEGORIES.map((category) => (
              <button
                className={`home-blog-tab ${activeBlogCategory === category ? 'is-active' : ''}`}
                key={category}
                type="button"
                role="tab"
                aria-selected={activeBlogCategory === category}
                onClick={() => setActiveBlogCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
          {visibleHomeBlogs.length > 0 ? (
            <div className="resource-grid">
              {visibleHomeBlogs.map((blog) => {
                const blogHref = getHomeBlogHref(blog, blog.homeIndex);
                return (
                  <article className="resource-card" key={blog.id || blog.external_id || blog.homeIndex}>
                    <div className="resource-image">
                      {blog.image && (
                        <img src={formatAssetUrl(blog.image)} alt={blog.title || blog.name || 'Blog post'} />
                      )}
                      <span>{blog.homeCategory}</span>
                    </div>
                    <div className="resource-body">
                      <h3>{blog.title || blog.name}</h3>
                      <p>{formatHomeBlogDate(blog)} <span>•</span> {blog.readTime || '3 min read'}</p>
                      <a href={blogHref} onClick={(e) => { e.preventDefault(); navigate(blogHref); }}>Read More <span>→</span></a>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="home-blog-empty">No blog posts are available in this category yet.</p>
          )}
        </section>

        <section className="bulk-cta">
          <h2>Looking for Bulk Pricing?</h2>
          <p>Get exclusive discounts on large orders and custom solutions tailored to your needs.</p>
          <div>
            <a className="primary-button" href="/request-quote" onClick={(e) => { e.preventDefault(); navigate('/request-quote'); }}>Request a Quote</a>
            <a className="secondary-button" href="#" onClick={(e) => e.preventDefault()}>Contact Us <span>→</span></a>
          </div>
        </section>
      </main>
    </>
  );
}

export default HomePage;
