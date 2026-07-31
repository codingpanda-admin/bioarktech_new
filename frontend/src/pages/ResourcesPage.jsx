import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch, formatAssetUrl, mockResources } from '../utils/api';

const BLOG_CATEGORIES = ['All', 'BioArk News', 'Biotech Outlook', 'Business News'];

const formatBlogDate = (datePosted) => {
  if (!datePosted) return '';

  const date = new Date(datePosted);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

const inferBlogCategory = (blog) => {
  const text = `${blog.title || ''} ${blog.description || ''} ${blog.tag || ''}`.toLowerCase();

  if (text.includes('bioark') || text.includes('company') || text.includes('growth')) {
    return 'BioArk News';
  }

  if (text.includes('business') || text.includes('market') || text.includes('economics')) {
    return 'Business News';
  }

  return 'Biotech Outlook';
};

function ResourcesPage({ navigate, searchParams }) {
  const [blogs, setBlogs] = useState([]);
  const [resources, setResources] = useState([]);
  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') === 'documents' ? 'documents' : 'blogs');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeFeaturedIndex, setActiveFeaturedIndex] = useState(0);
  const [previewFileUrl, setPreviewFileUrl] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [blogData, resourceData] = await Promise.all([
          apiFetch('/api/blogs/get-all-blogs/').catch(() => mockResources),
          apiFetch('/api/blogs/get-all-resources/').catch(() => [])
        ]);
        setBlogs(blogData.length > 0 ? blogData : mockResources);
        setResources(resourceData);
      } catch (err) {
        setBlogs(mockResources);
        setResources([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const tabParam = searchParams?.get('tab');
    if (tabParam === 'documents') {
      setActiveTab('documents');
    } else if (tabParam === 'blogs') {
      setActiveTab('blogs');
    }
  }, [searchParams]);

  // Reset category and search term when changing tabs
  useEffect(() => {
    setActiveCategory('All');
    setSearchTerm('');
  }, [activeTab]);

  const enrichedBlogs = useMemo(() => (
    blogs.map((blog) => ({
      ...blog,
      category: blog.category || blog.tag || inferBlogCategory(blog),
    }))
  ), [blogs]);

  const categoriesList = useMemo(() => {
    if (activeTab === 'blogs') {
      return BLOG_CATEGORIES;
    } else {
      const cats = new Set(resources.map((r) => r.category));
      return ['All', ...Array.from(cats)];
    }
  }, [activeTab, resources]);

  const categoryCounts = useMemo(() => {
    if (activeTab === 'blogs') {
      return BLOG_CATEGORIES.reduce((counts, category) => ({
        ...counts,
        [category]: category === 'All'
          ? enrichedBlogs.length
          : enrichedBlogs.filter((blog) => blog.category === category).length,
      }), {});
    } else {
      const docCats = ['All', ...Array.from(new Set(resources.map((r) => r.category)))];
      return docCats.reduce((counts, category) => ({
        ...counts,
        [category]: category === 'All'
          ? resources.length
          : resources.filter((r) => r.category === category).length,
      }), {});
    }
  }, [activeTab, enrichedBlogs, resources]);

  const showFeatured = activeTab === 'blogs' && searchTerm === '' && activeCategory === 'All';

  const featuredBlogs = useMemo(() => (
    enrichedBlogs.filter((blog) => blog.is_featured)
  ), [enrichedBlogs]);

  // Reset index if it gets out of bounds when length changes
  useEffect(() => {
    if (activeFeaturedIndex >= featuredBlogs.length && featuredBlogs.length > 0) {
      setActiveFeaturedIndex(0);
    }
  }, [featuredBlogs.length, activeFeaturedIndex]);

  // Auto play featured blogs carousel
  useEffect(() => {
    if (!showFeatured || featuredBlogs.length <= 1) return;
    const timer = setInterval(() => {
      setActiveFeaturedIndex((prev) => (prev + 1) % featuredBlogs.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [showFeatured, featuredBlogs.length]);

  const visibleBlogs = enrichedBlogs.filter((blog) => {
    const matchesCategory = activeCategory === 'All' || blog.category === activeCategory;
    const searchableText = `${blog.title || ''} ${blog.description || ''} ${blog.author || ''}`.toLowerCase();
    const matchesSearch = searchableText.includes(searchTerm.trim().toLowerCase());

    if (showFeatured && blog.is_featured) {
      return false;
    }

    return matchesCategory && matchesSearch;
  });

  const visibleResources = useMemo(() => (
    resources.filter((r) => {
      const matchesCategory = activeCategory === 'All' || r.category === activeCategory;
      const searchableText = `${r.name || ''} ${r.category || ''} ${r.description || ''}`.toLowerCase();
      const matchesSearch = searchableText.includes(searchTerm.trim().toLowerCase());
      return matchesCategory && matchesSearch;
    })
  ), [resources, activeCategory, searchTerm]);

  const featuredSection = useMemo(() => {
    if (!showFeatured || featuredBlogs.length === 0) return null;

    if (featuredBlogs.length === 1) {
      const blog = featuredBlogs[0];
      const title = blog.title || blog.name;
      const imageUrl = blog.image ? formatAssetUrl(blog.image) : null;
      const blogHref = `/blog/${blog.id}`;
      return (
        <section className="featured-blogs-section static">
          <h2 className="featured-blogs-title">Featured Articles</h2>
          <div className="featured-carousel-container">
            <article 
              className="featured-blog-slide active" 
              onClick={() => navigate(blogHref)}
            >
              <div className="featured-blog-image">
                {imageUrl ? (
                  <img src={imageUrl} alt="" />
                ) : (
                  <div className="featured-blog-fallback">BIOARK</div>
                )}
              </div>
              <div className="featured-blog-overlay" />
              <div className="featured-blog-content">
                <span className="featured-blog-tag">{blog.category}</span>
                <h2>{title}</h2>
                <p className="featured-blog-desc">{blog.description}</p>
                <div className="featured-blog-meta">
                  <span>By {blog.author}</span>
                  <span>•</span>
                  <span>{formatBlogDate(blog.date_posted)}</span>
                </div>
              </div>
            </article>
          </div>
        </section>
      );
    }

    const handlePrevFeatured = (e) => {
      e.stopPropagation();
      setActiveFeaturedIndex((prev) => (prev - 1 + featuredBlogs.length) % featuredBlogs.length);
    };

    const handleNextFeatured = (e) => {
      e.stopPropagation();
      setActiveFeaturedIndex((prev) => (prev + 1) % featuredBlogs.length);
    };

    return (
      <section className="featured-blogs-section carousel">
        <h2 className="featured-blogs-title">Featured Articles</h2>
        <div className="featured-carousel-container">
          <button 
            className="featured-carousel-control prev" 
            onClick={handlePrevFeatured}
            aria-label="Previous article"
            type="button"
          >
            ‹
          </button>

          <div className="featured-carousel-viewport">
            {featuredBlogs.map((blog, idx) => {
              const title = blog.title || blog.name;
              const imageUrl = blog.image ? formatAssetUrl(blog.image) : null;
              const blogHref = `/blog/${blog.id}`;
              const isActive = idx === activeFeaturedIndex;

              return (
                <article 
                  key={blog.id}
                  className={`featured-blog-slide ${isActive ? 'active' : ''}`}
                  onClick={() => navigate(blogHref)}
                  style={{ display: isActive ? 'flex' : 'none' }}
                >
                  <div className="featured-blog-image">
                    {imageUrl ? (
                      <img src={imageUrl} alt="" />
                    ) : (
                      <div className="featured-blog-fallback">BIOARK</div>
                    )}
                  </div>
                  <div className="featured-blog-overlay" />
                  <div className="featured-blog-content">
                    <span className="featured-blog-tag">{blog.category}</span>
                    <h2>{title}</h2>
                    <p className="featured-blog-desc">{blog.description}</p>
                    <div className="featured-blog-meta">
                      <span>By {blog.author}</span>
                      <span>•</span>
                      <span>{formatBlogDate(blog.date_posted)}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <button 
            className="featured-carousel-control next" 
            onClick={handleNextFeatured}
            aria-label="Next article"
            type="button"
          >
            ›
          </button>

          <div className="featured-carousel-dots">
            {featuredBlogs.map((_, idx) => (
              <button
                key={idx}
                className={`featured-dot ${idx === activeFeaturedIndex ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setActiveFeaturedIndex(idx); }}
                aria-label={`Go to slide ${idx + 1}`}
                type="button"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }, [showFeatured, featuredBlogs, activeFeaturedIndex, navigate]);

  if (loading) {
    return <div className="spinner" />;
  }

  return (
    <main className="blog-index-page">
      <section className="blog-index-hero">
        <h1>Explore insights on gene editing, delivery technologies, and BioArk news.</h1>
      </section>

      {/* Switcher Tab Pill Container */}
      <div 
        className="resources-tabs" 
        style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '16px', 
          margin: '32px auto 0'
        }}
      >
        <button 
          className={`tab-btn ${activeTab === 'blogs' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('blogs');
            navigate('/blogs');
          }}
          type="button"
          style={{
            padding: '12px 28px',
            borderRadius: '30px',
            border: '1px solid var(--line)',
            background: activeTab === 'blogs' ? 'var(--blue)' : '#fff',
            color: activeTab === 'blogs' ? '#fff' : 'var(--ink)',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: activeTab === 'blogs' ? '0 8px 20px rgba(0, 111, 242, 0.2)' : 'none',
            transition: 'all 0.25s ease'
          }}
        >
          Articles & News
        </button>
        <button 
          className={`tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('documents');
            navigate('/blogs?tab=documents');
          }}
          type="button"
          style={{
            padding: '12px 28px',
            borderRadius: '30px',
            border: '1px solid var(--line)',
            background: activeTab === 'documents' ? 'var(--blue)' : '#fff',
            color: activeTab === 'documents' ? '#fff' : 'var(--ink)',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: activeTab === 'documents' ? '0 8px 20px rgba(0, 111, 242, 0.2)' : 'none',
            transition: 'all 0.25s ease'
          }}
        >
          Technical Library & Documents
        </button>
      </div>

      {featuredSection}

      <div className="blog-index-layout">
        <aside className="blog-sidebar" aria-label="Filters">
          <label htmlFor="blog-search">Search</label>
          <div className="blog-search-box">
            <span aria-hidden="true">⌕</span>
            <input
              id="blog-search"
              type="search"
              placeholder={activeTab === 'blogs' ? "Search blog posts..." : "Search documents..."}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <h2>Categories</h2>
          <nav aria-label="Categories">
            {categoriesList.map((category) => (
              <button
                key={category}
                className={activeCategory === category ? 'is-active' : ''}
                type="button"
                onClick={() => setActiveCategory(category)}
              >
                <span>{category}</span>
                <small>{categoryCounts[category] || 0}</small>
              </button>
            ))}
          </nav>
        </aside>

        <section className="blog-results" aria-label="Results">
          {activeTab === 'blogs' ? (
            visibleBlogs.length > 0 ? (
              <div className="blog-card-grid">
                {visibleBlogs.map((blog, index) => {
                  const title = blog.title || blog.name;
                  const imageUrl = blog.image ? formatAssetUrl(blog.image) : null;
                  const blogHref = blog.id ? `/blog/${blog.id}` : `/blog/mock-${index}`;
                  const publishDateSource = blog.date_posted || blog.date;
                  const publishDate = formatBlogDate(publishDateSource);

                  return (
                    <article
                      className="blog-card"
                      key={`${title}-${index}`}
                      onClick={() => navigate(blogHref)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          navigate(blogHref);
                        }
                      }}
                      role="link"
                      tabIndex={0}
                    >
                      <div className="blog-card-image">
                        {imageUrl ? (
                          <img src={imageUrl} alt="" />
                        ) : (
                          <div className="blog-card-fallback" aria-hidden="true">BIOARK</div>
                        )}
                      </div>
                      <div className="blog-card-body">
                        <p className="blog-card-category">{blog.category}</p>
                        <h2>
                          <a href={blogHref} onClick={(event) => { event.preventDefault(); event.stopPropagation(); navigate(blogHref); }}>
                            {title}
                          </a>
                        </h2>
                        {publishDate && (
                          <time className="blog-card-date" dateTime={publishDateSource}>
                            {publishDate}
                          </time>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="blog-empty-state">
                <h2>No blog posts found</h2>
                <p>Try another category or search term.</p>
              </div>
            )
          ) : (
            visibleResources.length > 0 ? (
              <div className="table-responsive" style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', border: '1px solid var(--line)', boxShadow: '0 4px 12px rgba(6, 23, 60, 0.02)' }}>
                <table className="public-resources-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ background: 'var(--panel)', borderBottom: '1px solid var(--line)' }}>
                      <th style={{ padding: '16px 24px', fontWeight: '600', fontSize: '13px', color: 'var(--muted)', width: '55%' }}>Document</th>
                      <th style={{ padding: '16px 24px', fontWeight: '600', fontSize: '13px', color: 'var(--muted)', width: '20%' }}>Category</th>
                      <th style={{ padding: '16px 24px', fontWeight: '600', fontSize: '13px', color: 'var(--muted)', width: '25%', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleResources.map((res) => {
                      const fileUrl = res.download_url ? formatAssetUrl(res.download_url) : '#';
                      return (
                        <tr 
                          key={res.id} 
                          className="public-resource-row"
                          style={{ borderBottom: '1px solid var(--line)', transition: 'background 0.2s' }}
                        >
                          <td style={{ padding: '20px 24px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                              <span style={{ fontSize: '22px', color: 'var(--blue)', lineHeight: 1, marginTop: '2px' }}>📄</span>
                              <div>
                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: 'var(--ink)' }}>
                                  <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="document-link" style={{ textDecoration: 'none', color: 'var(--ink)' }}>
                                    {res.name}
                                  </a>
                                </h3>
                                {res.description && (
                                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--muted)', lineHeight: '1.45' }}>
                                    {res.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '20px 24px' }}>
                            <span className="document-category-badge" style={{ margin: 0 }}>
                              {res.category}
                            </span>
                          </td>
                          <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <button
                                onClick={() => setPreviewFileUrl(fileUrl)}
                                className="secondary-admin-button"
                                style={{
                                  padding: '8px 14px',
                                  fontSize: '13px',
                                  borderRadius: '6px',
                                  borderColor: 'var(--line)',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  background: '#fff',
                                  fontWeight: '600',
                                  color: 'var(--ink)'
                                }}
                                type="button"
                              >
                                👁️ Preview
                              </button>
                              <a 
                                href={fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="document-download-btn"
                                style={{
                                  padding: '8px 14px',
                                  fontSize: '13px',
                                  borderRadius: '6px',
                                  boxShadow: 'none',
                                  background: 'var(--blue)',
                                  color: '#fff',
                                  textDecoration: 'none',
                                  fontWeight: '600',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                Download <span>↓</span>
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="blog-empty-state">
                <h2>No documents found</h2>
                <p>Try another category or search term.</p>
              </div>
            )
          )}
        </section>

      </div>

      {previewFileUrl && (
        <div 
          className="document-preview-backdrop" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(6, 23, 60, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '24px'
          }}
          onClick={() => setPreviewFileUrl(null)}
        >
          <div 
            className="document-preview-modal" 
            style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              width: 'min(1200px, 100%)',
              height: 'min(85vh, 900px)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 64px rgba(6, 23, 60, 0.25)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 24px',
                borderBottom: '1px solid var(--line)',
                background: 'var(--panel)'
              }}
            >
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--ink)' }}>Document Preview</h3>
              <button 
                onClick={() => setPreviewFileUrl(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'var(--muted)',
                  lineHeight: 1,
                  padding: '4px'
                }}
                aria-label="Close preview"
                type="button"
              >
                &times;
              </button>
            </div>
            <div style={{ flex: 1, position: 'relative', background: '#f1f5f9' }}>
              <iframe 
                src={previewFileUrl ? `${previewFileUrl}?t=${new Date().getTime()}` : ''} 
                title="Document Preview"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default ResourcesPage;
