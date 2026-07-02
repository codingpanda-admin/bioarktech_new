import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch, formatAssetUrl, mockResources } from '../utils/api';

const BLOG_CATEGORIES = ['All', 'BioArk News', 'Biotech Outlook', 'Business News'];

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

function ResourcesPage({ navigate }) {
  const [blogs, setBlogs] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBlogs = async () => {
      try {
        const blogData = await apiFetch('/api/blogs/get-all-blogs/');
        setBlogs(blogData.length > 0 ? blogData : mockResources);
      } catch (err) {
        setBlogs(mockResources);
      } finally {
        setLoading(false);
      }
    };

    loadBlogs();
  }, []);

  const enrichedBlogs = useMemo(() => (
    blogs.map((blog) => ({
      ...blog,
      category: blog.category || blog.tag || inferBlogCategory(blog),
    }))
  ), [blogs]);

  const categoryCounts = useMemo(() => (
    BLOG_CATEGORIES.reduce((counts, category) => ({
      ...counts,
      [category]: category === 'All'
        ? enrichedBlogs.length
        : enrichedBlogs.filter((blog) => blog.category === category).length,
    }), {})
  ), [enrichedBlogs]);

  const visibleBlogs = enrichedBlogs.filter((blog) => {
    const matchesCategory = activeCategory === 'All' || blog.category === activeCategory;
    const searchableText = `${blog.title || ''} ${blog.description || ''} ${blog.author || ''}`.toLowerCase();
    const matchesSearch = searchableText.includes(searchTerm.trim().toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return <div className="spinner" />;
  }

  return (
    <main className="blog-index-page">
      <section className="blog-index-hero">
        <h1>Explore insights on gene editing, delivery technologies, and BioArk news.</h1>
      </section>

      <div className="blog-index-layout">
        <aside className="blog-sidebar" aria-label="Blog filters">
          <label htmlFor="blog-search">Search</label>
          <div className="blog-search-box">
            <span aria-hidden="true">⌕</span>
            <input
              id="blog-search"
              type="search"
              placeholder="Search blog posts..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <h2>Categories</h2>
          <nav aria-label="Blog categories">
            {BLOG_CATEGORIES.map((category) => (
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

        <section className="blog-results" aria-label="Blog posts">
          {visibleBlogs.length > 0 ? (
            <div className="blog-card-grid">
              {visibleBlogs.map((blog, index) => {
                const title = blog.title || blog.name;
                const imageUrl = blog.image ? formatAssetUrl(blog.image) : null;
                const blogHref = blog.id ? `/blog/${blog.id}` : `/blog/mock-${index}`;

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
          )}
        </section>
      </div>
    </main>
  );
}

export default ResourcesPage;
