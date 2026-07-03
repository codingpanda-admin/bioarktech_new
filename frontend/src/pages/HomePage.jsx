import React, { useState, useEffect } from 'react';
import { apiFetch, mockCategories, mockProducts, mockResources, getCategoryIcon, formatAssetUrl } from '../utils/api';
import { logo } from '../utils/api';
import IconMark from '../components/IconMark';
import ProductVisual from '../components/ProductVisual';

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

function HomePage({ navigate, searchParams }) {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredGeneralProducts, setFeaturedGeneralProducts] = useState([]);
  const [featuredServices, setFeaturedServices] = useState([]);
  const [blogs, setBlogs] = useState([]);
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
        const catData = await apiFetch('/api/products/load-product-categories/');
        setCategories(catData.length > 0 ? catData : mockCategories);
      } catch (err) {
        setCategories(mockCategories);
      }

      try {
        const prodData = await apiFetch('/api/products/get-latest-featured-products/');
        setFeaturedProducts(Array.isArray(prodData) && prodData.length > 0 ? prodData : mockProducts);
      } catch (err) {
        setFeaturedProducts(mockProducts);
      }

      try {
        const generalProdData = await apiFetch('/api/products/get-featured-general-products/');
        setFeaturedGeneralProducts(Array.isArray(generalProdData) ? generalProdData : []);
      } catch (err) {
        console.error('Failed to load featured general products:', err);
      }

      try {
        const servicesData = await apiFetch('/api/interface/get-featured-services/');
        setFeaturedServices(Array.isArray(servicesData) ? servicesData : []);
      } catch (err) {
        console.error('Failed to load featured services:', err);
      }

      try {
        const blogData = await apiFetch('/api/blogs/get-latest-blogs/');
        const homeBlogs = Array.isArray(blogData) && blogData.length > 0 ? blogData : mockResources;
        setBlogs(getRecentBlogs(homeBlogs));
      } catch (err) {
        setBlogs(getRecentBlogs(mockResources));
      }

      try {
        const slideData = await apiFetch('/api/interface/get-homepage-slides/');
        if (Array.isArray(slideData) && slideData.length > 0) {
          setSlides(slideData);
        }
      } catch (err) {
        console.error('Failed to load homepage slides:', err);
      }

      setLoading(false);
    };

    loadHomeData();
  }, []);

  const activeSlides = slides.length > 0 ? slides : defaultSlides;
  const currentSlide = activeSlides[activeSlideIndex] || defaultSlides[0];

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
    ? Array.from({ length: Math.min(3, featuredServices.length) }, (_, offset) => {
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
      <main>
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
          <h2 id="categories-title">Explore Popular Categories</h2>
          <div className="category-row">
            {categories.map((cat, idx) => {
              const name = cat.category_name;
              const icon = cat.icon || getCategoryIcon(name);
              return (
                <a className="category-item" href="#" key={idx} onClick={(e) => { e.preventDefault(); navigate(`/search?q=${encodeURIComponent(name)}`); }}>
                  <IconMark type={icon} />
                  <span>{name}<small>{cat.description || 'BioArk Category'}</small></span>
                </a>
              );
            })}
          </div>
        </section>

        {featuredGeneralProducts.length > 0 && (
          <section className="products-section" aria-labelledby="general-products-title" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', padding: '60px 0', borderTop: '1px solid var(--line)' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
              <h2 id="general-products-title" style={{ textAlign: 'center', marginBottom: '10px', fontSize: '2.2rem', color: 'var(--blue-dark)' }}>Products</h2>
              <p className="section-subtitle" style={{ textAlign: 'center', marginBottom: '40px', color: 'var(--ink-light)', maxWidth: '700px', margin: '0 auto 45px auto' }}>
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

                      return (
                        <article className="product-card" key={`${productId}-${index}`} style={{ display: 'flex', flexDirection: 'column', height: '100%', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', border: '1px solid var(--line)', background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)' }}>
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
                            <a href={productHref} className="secondary-button" onClick={(e) => { e.preventDefault(); navigate(productHref); }} style={{ width: '100%', textAlign: 'center', display: 'block', padding: '10px 0', borderRadius: '6px', fontSize: '0.95rem', fontWeight: '600' }}>View Details</a>
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
              
              <div style={{ textAlign: 'center', marginTop: '40px' }}>
                <a className="view-all" href="#" onClick={(e) => { e.preventDefault(); navigate('/search?category=reagents'); }} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: 'var(--blue)' }}>View All Reagents & Materials <span>→</span></a>
              </div>
            </div>
          </section>
        )}

        {featuredServices.length > 0 && (
          <section className="services-section" aria-labelledby="featured-services-title" style={{ background: '#f8fafc', padding: '60px 0', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
              <h2 id="featured-services-title" style={{ textAlign: 'center', marginBottom: '10px', fontSize: '2.2rem', color: 'var(--blue-dark)' }}>Services</h2>
              <p className="section-subtitle" style={{ textAlign: 'center', marginBottom: '45px', color: 'var(--ink-light)', maxWidth: '750px', margin: '0 auto 45px auto' }}>
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
                        ? service.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...'
                        : 'Custom contract research services designed to support your molecular biology workflows.';
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
                            <div style={{ display: 'flex', gap: '12px' }}>
                              <a href={serviceHref} className="primary-button" onClick={(e) => { e.preventDefault(); navigate(serviceHref); }} style={{ flex: 1, textAlign: 'center', padding: '10px 0', fontSize: '0.95rem', fontWeight: '600' }}>Explore Service</a>
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
          <h2 id="resources-title">Resources and Blogs</h2>
          <div className="resource-grid">
            {blogs.map((blog, idx) => {
              const blogHref = getHomeBlogHref(blog, idx);
              return (
              <article className="resource-card" key={blog.id || blog.external_id || idx}>
                <div className="resource-image">
                  {blog.image && (
                    <img src={formatAssetUrl(blog.image)} alt={blog.title || blog.name || 'Blog post'} />
                  )}
                  <span>{blog.tag || 'Blog'}</span>
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
          <a className="view-all" href="/blogs" onClick={(e) => { e.preventDefault(); navigate('/blogs'); }}>View All Resources & Blogs <span>→</span></a>
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
