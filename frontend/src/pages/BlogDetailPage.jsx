import React, { useEffect, useState } from 'react';
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

function BlogDetailPage({ blogId, navigate }) {
  const [blog, setBlog] = useState(null);
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

  if (loading) {
    return <div className="spinner" />;
  }

  if (error || !blog) {
    return (
      <main className="blog-detail-page">
        <button className="blog-back-button" type="button" onClick={() => navigate('/resources')}>
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
      <button className="blog-back-button" type="button" onClick={() => navigate('/resources')}>
        Back to Resources & Blogs
      </button>

      <article className="blog-detail-article">
        <header className="blog-detail-header">
          <p className="blog-detail-kicker">BioArkTech Blog</p>
          <h1>{title}</h1>
          <div className="blog-detail-meta">
            <span>{blog.author || 'BioArkTech'}</span>
            <span>{formatBlogDate(blog.date_posted || blog.date)}</span>
            <span>5 min read</span>
          </div>
        </header>

        {imageUrl ? (
          <img className="blog-detail-image" src={imageUrl} alt="" />
        ) : (
          <div className="blog-detail-image blog-detail-fallback" aria-hidden="true">BIOARK</div>
        )}

        <div
          className="blog-detail-content"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </article>
    </main>
  );
}

export default BlogDetailPage;
