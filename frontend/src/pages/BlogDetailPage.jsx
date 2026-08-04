import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch, formatAssetUrl, mockResources } from '../utils/api';
import { formatRichText } from '../utils/richText';

const formatBlogDate = (value) => {
  if (!value) return 'BioArkTech';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const getBlogTimestamp = (blog) => {
  const rawDate = blog?.date_posted || blog?.date || '';
  const timestamp = rawDate ? new Date(rawDate).getTime() : 0;
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

function BlogDetailPage({ blogId, navigate }) {
  const [blog, setBlog] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadBlog = async () => {
      setLoading(true);
      setError('');

      if (blogId.startsWith('mock-')) {
        const mockIndex = Number(blogId.replace('mock-', ''));
        setBlog(mockResources[mockIndex] || mockResources[0]);
        setLoading(false);
        return;
      }

      try {
        const blogData = await apiFetch(`/api/blogs/get-blog/${encodeURIComponent(blogId)}/`);
        setBlog(blogData);
      } catch (err) {
        setError('Unable to load this blog post.');
      } finally {
        setLoading(false);
      }
    };

    loadBlog();
  }, [blogId]);

  useEffect(() => {
    const loadRecentBlogs = async () => {
      try {
        const blogData = await apiFetch('/api/blogs/get-all-blogs/');
        setBlogs(Array.isArray(blogData) && blogData.length > 0 ? blogData : mockResources);
      } catch {
        setBlogs(mockResources);
      }
    };

    loadRecentBlogs();
  }, []);

  const recentBlogs = useMemo(() => (
    blogs
      .map((recentBlog, index) => ({ ...recentBlog, sourceIndex: index }))
      .sort((a, b) => getBlogTimestamp(b) - getBlogTimestamp(a))
      .slice(0, 6)
  ), [blogs]);

  if (loading) {
    return <div className="spinner" />;
  }

  if (error || !blog) {
    return (
      <main className="blog-detail-page">
        <button className="blog-back-button" type="button" onClick={() => navigate('/blogs')}>
          Back to Resources & Blogs
        </button>
        <div className="alert-banner error">{error || 'Blog post not found.'}</div>
      </main>
    );
  }

  const imageUrl = blog.image ? formatAssetUrl(blog.image) : null;
  const title = blog.title || blog.name;
  const content = formatRichText(
    blog.content || 'Explore BioArkTech updates, technical guidance, and research workflow insights.'
  );

  return (
    <main className="blog-detail-page">
      <button className="blog-back-button" type="button" onClick={() => navigate('/blogs')}>
        Back to Resources & Blogs
      </button>

      <div className="blog-detail-layout">
        <article className="blog-detail-article">
          {imageUrl ? (
            <img className="blog-detail-image" src={imageUrl} alt="" />
          ) : (
            <div className="blog-detail-image blog-detail-fallback" aria-hidden="true">BIOARK</div>
          )}

          <header className="blog-detail-header">
            <p className="blog-detail-kicker">BioArkTech Blog</p>
            <h1>{title}</h1>
            <div className="blog-detail-meta">
              <span>{blog.author || 'BioArkTech'}</span>
              <span>{formatBlogDate(blog.date_posted || blog.date)}</span>
              <span>5 min read</span>
            </div>
          </header>

          <div
            className="blog-detail-content"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </article>

        {recentBlogs.length > 0 && (
          <aside className="recent-posts-panel" aria-labelledby="recent-posts-title">
            <h2 id="recent-posts-title">Recent Posts</h2>
            <div className="recent-posts-list">
              {recentBlogs.map((recentBlog) => {
                const recentTitle = recentBlog.title || recentBlog.name;
                const recentImageUrl = recentBlog.image ? formatAssetUrl(recentBlog.image) : null;
                const recentBlogHref = recentBlog.id
                  ? `/blog/${recentBlog.id}`
                  : `/blog/mock-${recentBlog.sourceIndex}`;

                return (
                  <a
                    className="recent-post-link"
                    href={recentBlogHref}
                    key={recentBlog.id || `${recentTitle}-${recentBlog.sourceIndex}`}
                    onClick={(event) => {
                      event.preventDefault();
                      navigate(recentBlogHref);
                    }}
                  >
                    <span className="recent-post-thumbnail">
                      {recentImageUrl ? (
                        <img src={recentImageUrl} alt="" />
                      ) : (
                        <span className="recent-post-thumbnail-fallback" aria-hidden="true">BIO</span>
                      )}
                    </span>
                    <span className="recent-post-title">{recentTitle}</span>
                  </a>
                );
              })}
            </div>
          </aside>
        )}
      </div>
    </main>
  );
}

export default BlogDetailPage;
