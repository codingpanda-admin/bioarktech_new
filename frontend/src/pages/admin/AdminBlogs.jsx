import React, { useEffect, useState, useCallback, useRef } from 'react';
import { apiFetch, API_URL, formatAssetUrl } from '../../utils/api';
import { formatRichText } from '../../utils/richText';

function BlogContentEditor({ value, onChange }) {
  const editorRef = useRef(null);

  useEffect(() => {
    const editorHtml = formatRichText(value || '');
    if (editorRef.current && editorRef.current.innerHTML !== editorHtml) {
      editorRef.current.innerHTML = editorHtml;
    }
    if ((value || '') !== editorHtml) {
      onChange(editorHtml);
    }
  }, [value, onChange]);

  const syncValue = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const runCommand = (command, commandValue = null) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, commandValue);
    syncValue();
  };

  const handleLink = () => {
    const url = window.prompt('Enter link URL');
    if (!url) return;
    runCommand('createLink', url);
  };

  const handleBlockChange = (event) => {
    runCommand('formatBlock', event.target.value);
    event.target.value = 'p';
  };

  const preventFocusLoss = (event) => {
    event.preventDefault();
  };

  return (
    <div className="admin-rich-text">
      <div className="admin-rich-text-toolbar" aria-label="Blog content formatting tools">
        <select aria-label="Text style" defaultValue="p" onChange={handleBlockChange}>
          <option value="p">Paragraph</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="blockquote">Quote</option>
        </select>
        <button type="button" onMouseDown={preventFocusLoss} onClick={() => runCommand('bold')}><strong>B</strong></button>
        <button type="button" onMouseDown={preventFocusLoss} onClick={() => runCommand('italic')}><em>I</em></button>
        <button type="button" onMouseDown={preventFocusLoss} onClick={() => runCommand('underline')}><span className="admin-rich-underline">U</span></button>
        <button type="button" onMouseDown={preventFocusLoss} onClick={() => runCommand('insertUnorderedList')}>Bullet List</button>
        <button type="button" onMouseDown={preventFocusLoss} onClick={() => runCommand('insertOrderedList')}>Numbered List</button>
        <button type="button" onMouseDown={preventFocusLoss} onClick={handleLink}>Link</button>
        <button type="button" onMouseDown={preventFocusLoss} onClick={() => runCommand('unlink')}>Unlink</button>
      </div>
      <div
        ref={editorRef}
        className="admin-rich-text-editor"
        contentEditable
        role="textbox"
        aria-multiline="true"
        aria-label="Blog content"
        onInput={syncValue}
        onBlur={syncValue}
        suppressContentEditableWarning
      />
    </div>
  );
}

function AdminBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingBlog, setEditingBlog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [imageFile, setImageFile] = useState(null);

  const loadBlogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/admin-panel/blogs/');
      setBlogs(data.results || data.blogs || []);
    } catch (err) {
      setError(err.message || 'Failed to load blogs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBlogs(); }, [loadBlogs]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleCreate = () => {
    setEditingBlog({
      title: '',
      description: '',
      author: '',
      content: '',
    });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleEdit = async (blogId) => {
    try {
      const data = await apiFetch(`/api/admin-panel/blogs/${blogId}/`);
      setEditingBlog(data.blog || data);
      setImageFile(null);
      setIsModalOpen(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (blogId) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    try {
      await apiFetch(`/api/admin-panel/blogs/${blogId}/delete/`, { method: 'POST' });
      showSuccess('Blog post deleted.');
      loadBlogs();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const contentText = (editingBlog.content || '')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim();

      if (!contentText) {
        setError('Blog content is required.');
        setSaving(false);
        return;
      }

      const isNew = !editingBlog.id;
      const endpoint = isNew
        ? '/api/admin-panel/blogs/create/'
        : `/api/admin-panel/blogs/${editingBlog.id}/update/`;

      // Use FormData if there's an image file
      if (imageFile) {
        const formData = new FormData();
        formData.append('title', editingBlog.title);
        formData.append('description', editingBlog.description);
        formData.append('author', editingBlog.author);
        formData.append('content', editingBlog.content);
        formData.append('image', imageFile);

        // For FormData, we need to handle CSRF manually and not set Content-Type
        let csrfToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('csrftoken='))
          ?.split('=')[1];

        if (!csrfToken) {
          const csrfRes = await fetch(`${API_URL}/api/csrf/`, { credentials: 'include' });
          const csrfData = await csrfRes.json();
          csrfToken = csrfData.csrftoken;
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'X-CSRFToken': csrfToken },
          body: formData,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.detail || 'Failed to save blog.');
        }
      } else {
        await apiFetch(endpoint, {
          method: 'POST',
          body: {
            title: editingBlog.title,
            description: editingBlog.description,
            author: editingBlog.author,
            content: editingBlog.content,
          },
        });
      }

      showSuccess(isNew ? 'Blog post created!' : 'Blog post updated!');
      setIsModalOpen(false);
      setEditingBlog(null);
      setImageFile(null);
      loadBlogs();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setEditingBlog(prev => ({ ...prev, [field]: value }));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <>
      <div className="admin-section-header">
        <h2 id="admin-content-title">Blog Posts</h2>
        <button className="primary-button" onClick={handleCreate}>+ Add Blog Post</button>
      </div>

      {successMsg && <div className="admin-alert success">{successMsg}</div>}
      {error && <div className="admin-alert error">{error}</div>}

      {loading ? (
        <div className="admin-empty-table">Loading blog posts...</div>
      ) : blogs.length === 0 ? (
        <div className="admin-empty-table">No blog posts found.</div>
      ) : (
        <div className="admin-cards-grid">
          {blogs.map((blog) => (
            <article key={blog.id} className="admin-card">
              {blog.image && (
                <div className="admin-card-image">
                  <img src={formatAssetUrl(blog.image)} alt={blog.title} />
                </div>
              )}
              <div className="admin-card-body">
                <h4>{blog.title}</h4>
                <p className="admin-card-meta">
                  <span>{blog.author}</span> · <span>{formatDate(blog.date_posted)}</span>
                </p>
                <p className="admin-card-desc">{blog.description}</p>
                <div className="admin-row-actions">
                  <button className="admin-action-btn edit" onClick={() => handleEdit(blog.id)}>Edit</button>
                  <button className="admin-action-btn delete" onClick={() => handleDelete(blog.id)}>Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {isModalOpen && editingBlog && (
        <div className="admin-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="admin-modal admin-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{editingBlog.id ? 'Edit Blog Post' : 'Create Blog Post'}</h3>
              <button className="admin-modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSave} className="admin-modal-body">
              <div className="admin-form-grid">
                <label className="admin-form-field span-2">
                  <span>Title *</span>
                  <input type="text" value={editingBlog.title || ''} onChange={(e) => updateField('title', e.target.value)} required maxLength="200" />
                </label>
                <label className="admin-form-field">
                  <span>Author *</span>
                  <input type="text" value={editingBlog.author || ''} onChange={(e) => updateField('author', e.target.value)} required maxLength="30" />
                </label>
                <label className="admin-form-field span-3">
                  <span>Description *</span>
                  <input type="text" value={editingBlog.description || ''} onChange={(e) => updateField('description', e.target.value)} required maxLength="150" />
                </label>
                <label className="admin-form-field span-3">
                  <span>Image</span>
                  <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0] || null)} />
                  {editingBlog.image && !imageFile && (
                    <div className="admin-current-image">
                      <img src={formatAssetUrl(editingBlog.image)} alt="Current" />
                      <span>Current image</span>
                    </div>
                  )}
                </label>
                <div className="admin-form-field span-3">
                  <span>Blog Content *</span>
                  <BlogContentEditor value={editingBlog.content || ''} onChange={(value) => updateField('content', value)} />
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="secondary-admin-button" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-button" disabled={saving}>
                  {saving ? 'Saving...' : (editingBlog.id ? 'Update Post' : 'Create Post')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminBlogs;
