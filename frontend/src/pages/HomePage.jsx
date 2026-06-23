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
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featuredStartIndex, setFeaturedStartIndex] = useState(0);
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

        <section className="products-section" aria-labelledby="products-title">
          <h2 id="products-title">Featured Products</h2>
          <p className="section-subtitle">
            High-performance reagents designed to accelerate your research and deliver reliable results.
          </p>
          <div className="products-carousel" aria-label="Featured products carousel">
            <button
              className="product-carousel-control product-carousel-prev"
              type="button"
              aria-label="Previous featured products"
              onClick={() => rollFeaturedProducts('prev')}
              disabled={featuredProducts.length <= 1}
            />
            <div className="product-carousel-viewport">
              <div className="product-grid product-carousel-grid">
            {visibleFeaturedProducts.map(({ product: prod, index }) => {
              const name = prod.product_name;
              const priceStr = prod.unit_price ? `$${prod.unit_price}` : '$29.00 - $129.00';
              const imgUrl = prod.image ? formatAssetUrl(prod.image) : null;
              const productId = prod.externalId || prod.external_id || prod.catalog_number || prod.product_sku;
              const productHref = productId ? `/product/${productId}` : `/search?q=${encodeURIComponent(name)}`;
              
              return (
                <article className="product-card" key={`${prod.catalog_number || prod.product_sku || name}-${index}`}>
                  {imgUrl ? (
                    <div style={{ height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20px 0' }}>
                      <img src={imgUrl} alt={name} style={{ maxHeight: '100%', maxWidth: '100%', borderRadius: '8px' }} />
                    </div>
                  ) : (
                    <ProductVisual type={prod.visual || 'bottle'} />
                  )}
                  <h3>{name}</h3>
                  <p className="rating">★★★★★ <span>({prod.reviews || '45'})</span></p>
                  <p className="price">{priceStr}</p>
                  <a href={productHref} onClick={(e) => { e.preventDefault(); navigate(productHref); }}>View Product <span>→</span></a>
                </article>
              );
            })}
              </div>
            </div>
            <button
              className="product-carousel-control product-carousel-next"
              type="button"
              aria-label="Next featured products"
              onClick={() => rollFeaturedProducts('next')}
              disabled={featuredProducts.length <= 1}
            />
          </div>
          <a className="view-all" href="#" onClick={(e) => { e.preventDefault(); navigate('/search?q='); }}>View All Products <span>→</span></a>
        </section>

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
            {blogs.map((blog, idx) => (
              <article className="resource-card" key={idx}>
                <div className="resource-image">
                  {blog.image && (
                    <img src={formatAssetUrl(blog.image)} alt={blog.title || blog.name || 'Blog post'} />
                  )}
                  <span>{blog.tag || 'Blog'}</span>
                </div>
                <div className="resource-body">
                  <h3>{blog.title || blog.name}</h3>
                  <p>{formatHomeBlogDate(blog)} <span>•</span> {blog.readTime || '3 min read'}</p>
                  <a href="#" onClick={(e) => e.preventDefault()}>Read More <span>→</span></a>
                </div>
              </article>
            ))}
          </div>
          <a className="view-all" href="/resources" onClick={(e) => { e.preventDefault(); navigate('/resources'); }}>View All Resources <span>→</span></a>
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
