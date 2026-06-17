import React, { useState, useEffect } from 'react';
import { apiFetch, mockCategories, mockProducts, mockResources, getCategoryIcon, formatAssetUrl } from '../utils/api';
import { logo } from '../utils/api';
import IconMark from '../components/IconMark';
import ProductVisual from '../components/ProductVisual';

function HomePage({ navigate, searchParams }) {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featuredStartIndex, setFeaturedStartIndex] = useState(0);

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
        setBlogs(blogData.length > 0 ? blogData : mockResources);
      } catch (err) {
        setBlogs(mockResources);
      }

      setLoading(false);
    };

    loadHomeData();
  }, []);

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
          <button className="carousel-control prev" type="button" aria-label="Previous promotion">‹</button>
          <div className="hero-content">
            <p className="eyebrow">Limited Offer</p>
            <h1><span>50% Off</span> Precast Agarose Gels</h1>
            <p>High-resolution, ready-to-use gels for fast and reliable DNA analysis.</p>
            <div className="hero-actions">
              <a href="#" className="primary-button" onClick={(e) => e.preventDefault()}>Shop Now</a>
              <a href="/request-quote" className="secondary-button" onClick={(e) => { e.preventDefault(); navigate('/request-quote'); }}>Request a Quote</a>
            </div>
          </div>

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
          <button className="carousel-control next" type="button" aria-label="Next promotion">›</button>
          <div className="hero-dots" aria-hidden="true"><span /><span /><span /><span /></div>
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
              const productId = prod.catalog_number || prod.product_sku;
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
          <h2 id="resources-title">Resources & Blog</h2>
          <div className="resource-grid">
            {blogs.map((blog, idx) => (
              <article className="resource-card" key={idx}>
                <div className="resource-image"><span>{blog.tag || 'Blog'}</span></div>
                <div className="resource-body">
                  <h3>{blog.title || blog.name}</h3>
                  <p>{blog.date} <span>•</span> {blog.readTime || '3 min read'}</p>
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
