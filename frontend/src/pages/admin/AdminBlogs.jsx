import React, { useEffect, useState, useCallback, useRef, useImperativeHandle } from 'react';
import { apiFetch, API_URL, formatAssetUrl } from '../../utils/api';
import { formatRichText } from '../../utils/richText';
import { ProductContentEditor as BlogContentEditor } from './AdminProducts';

const BLOG_CATEGORIES = ['BioArk News', 'Biotech Outlook', 'Business News'];

const LegacyBlogContentEditor = React.forwardRef(function LegacyBlogContentEditor({ value, onChange }, ref) {
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

  useImperativeHandle(ref, () => ({
    getHtml: () => editorRef.current?.innerHTML || '',
    sync: () => syncValue(),
  }));

  const focusEditor = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const runCommand = (command, commandValue = null) => {
    focusEditor();
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

  const getSelectedTableCell = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    let node = selection.anchorNode;
    if (node?.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    }

    return node?.closest?.('td, th') || null;
  };

  const insertTable = () => {
    focusEditor();
    const tableHtml = `
      <table>
        <thead>
          <tr><th>Header 1</th><th>Header 2</th><th>Header 3</th></tr>
        </thead>
        <tbody>
          <tr><td>Cell</td><td>Cell</td><td>Cell</td></tr>
          <tr><td>Cell</td><td>Cell</td><td>Cell</td></tr>
        </tbody>
      </table>
      <p><br></p>
    `;
    document.execCommand('insertHTML', false, tableHtml);
    syncValue();
  };

  const addTableRow = () => {
    const cell = getSelectedTableCell();
    const row = cell?.parentElement;
    if (!row) return;

    const newRow = row.cloneNode(true);
    newRow.querySelectorAll('th, td').forEach((item) => {
      item.innerHTML = item.tagName.toLowerCase() === 'th' ? 'Header' : 'Cell';
    });
    row.after(newRow);
    syncValue();
  };

  const addTableColumn = () => {
    const cell = getSelectedTableCell();
    const table = cell?.closest('table');
    if (!cell || !table) return;

    const columnIndex = cell.cellIndex;
    table.querySelectorAll('tr').forEach((row) => {
      const referenceCell = row.children[columnIndex];
      const newCell = referenceCell.cloneNode(false);
      newCell.innerHTML = referenceCell.tagName.toLowerCase() === 'th' ? 'Header' : 'Cell';
      referenceCell.after(newCell);
    });
    syncValue();
  };

  const deleteTableRow = () => {
    const cell = getSelectedTableCell();
    const row = cell?.parentElement;
    const table = cell?.closest('table');
    if (!row || !table) return;

    if (table.querySelectorAll('tr').length <= 1) {
      table.remove();
    } else {
      row.remove();
    }
    syncValue();
  };

  const deleteTableColumn = () => {
    const cell = getSelectedTableCell();
    const table = cell?.closest('table');
    if (!cell || !table) return;

    const columnIndex = cell.cellIndex;
    table.querySelectorAll('tr').forEach((row) => {
      row.children[columnIndex]?.remove();
    });
    if (!table.querySelector('th, td')) {
      table.remove();
    }
    syncValue();
  };

  const mergeCellRight = () => {
    const cell = getSelectedTableCell();
    const nextCell = cell?.nextElementSibling;
    if (!cell || !nextCell || !['TD', 'TH'].includes(nextCell.tagName)) return;

    const currentColSpan = Number(cell.getAttribute('colspan') || 1);
    const nextColSpan = Number(nextCell.getAttribute('colspan') || 1);
    const separator = cell.innerHTML.trim() && nextCell.innerHTML.trim() ? '<br>' : '';
    cell.innerHTML = `${cell.innerHTML}${separator}${nextCell.innerHTML}`;
    cell.setAttribute('colspan', String(currentColSpan + nextColSpan));
    nextCell.remove();
    syncValue();
  };

  const mergeCellDown = () => {
    const cell = getSelectedTableCell();
    const row = cell?.parentElement;
    const nextRow = row?.nextElementSibling;
    if (!cell || !nextRow) return;

    const cellBelow = nextRow.children[cell.cellIndex];
    if (!cellBelow || !['TD', 'TH'].includes(cellBelow.tagName)) return;

    const currentRowSpan = Number(cell.getAttribute('rowspan') || 1);
    const belowRowSpan = Number(cellBelow.getAttribute('rowspan') || 1);
    const separator = cell.innerHTML.trim() && cellBelow.innerHTML.trim() ? '<br>' : '';
    cell.innerHTML = `${cell.innerHTML}${separator}${cellBelow.innerHTML}`;
    cell.setAttribute('rowspan', String(currentRowSpan + belowRowSpan));
    cellBelow.remove();
    syncValue();
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
        <span className="admin-rich-text-divider" aria-hidden="true" />
        <button type="button" onMouseDown={preventFocusLoss} onClick={insertTable}>Insert Table</button>
        <button type="button" onMouseDown={preventFocusLoss} onClick={addTableRow}>Add Row</button>
        <button type="button" onMouseDown={preventFocusLoss} onClick={addTableColumn}>Add Column</button>
        <button type="button" onMouseDown={preventFocusLoss} onClick={mergeCellRight}>Merge Right</button>
        <button type="button" onMouseDown={preventFocusLoss} onClick={mergeCellDown}>Merge Down</button>
        <button type="button" onMouseDown={preventFocusLoss} onClick={deleteTableRow}>Delete Row</button>
        <button type="button" onMouseDown={preventFocusLoss} onClick={deleteTableColumn}>Delete Column</button>
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
});

function AdminBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingBlog, setEditingBlog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const blogContentEditorRef = useRef(null);

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
      category: '',
      description: '',
      author: '',
      content: '',
    });
    setError('');
    setSuccessMsg('');
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = async (blogId) => {
    try {
      setError('');
      setSuccessMsg('');
      const data = await apiFetch(`/api/admin-panel/blogs/${blogId}/`);
      setEditingBlog(data.blog || data);
      setImageFile(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingBlog(null);
    setImageFile(null);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleFeatured = async (blog) => {
    try {
      setError('');
      setSuccessMsg('');
      const updatedFeatured = !blog.is_featured;
      await apiFetch(`/api/admin-panel/blogs/${blog.id}/update/`, {
        method: 'POST',
        body: {
          is_featured: updatedFeatured,
        },
      });
      showSuccess(updatedFeatured ? 'Blog marked as featured!' : 'Blog removed from featured.');
      loadBlogs();
    } catch (err) {
      setError(err.message || 'Failed to update featured status.');
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
      const latestContent = blogContentEditorRef.current?.getHtml?.() ?? editingBlog.content ?? '';
      const contentText = latestContent
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
        formData.append('category', editingBlog.category);
        formData.append('description', editingBlog.description);
        formData.append('author', editingBlog.author);
        formData.append('content', latestContent);
        formData.append('image', imageFile);
        formData.append('is_featured', String(!!editingBlog.is_featured));

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
          throw new Error(errData.error || errData.detail || 'Failed to save blog.');
        }
      } else {
        await apiFetch(endpoint, {
          method: 'POST',
          body: {
            title: editingBlog.title,
            category: editingBlog.category,
            description: editingBlog.description,
            author: editingBlog.author,
            content: latestContent,
            is_featured: !!editingBlog.is_featured,
          },
        });
      }

      showSuccess(isNew ? 'Blog post created!' : 'Blog post updated!');
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

  if (editingBlog) {
    return (
      <div className="admin-blog-editor-page">
        <div className="admin-editor-header">
          <div>
            <button type="button" className="admin-back-button" onClick={handleCancelEdit}>
              Back to Blog Posts
            </button>
            <h2 id="admin-content-title">{editingBlog.id ? 'Edit Blog Post' : 'Create Blog Post'}</h2>
          </div>
          <div className="admin-editor-header-actions">
            <button type="button" className="secondary-admin-button" onClick={handleCancelEdit}>Cancel</button>
            <button type="submit" form="admin-blog-editor-form" className="primary-button" disabled={saving}>
              {saving ? 'Saving...' : (editingBlog.id ? 'Update Post' : 'Create Post')}
            </button>
          </div>
        </div>

        {error && <div className="admin-alert error">{error}</div>}

        <form id="admin-blog-editor-form" onSubmit={handleSave} className="admin-editor-panel">
          <div className="admin-form-grid">
            <label className="admin-form-field span-2">
              <span>Blog Title *</span>
              <input type="text" value={editingBlog.title || ''} onChange={(e) => updateField('title', e.target.value)} required maxLength="200" />
            </label>
            <label className="admin-form-field span-2">
              <span>Blog Category *</span>
              <select value={editingBlog.category || ''} onChange={(e) => updateField('category', e.target.value)} required>
                <option value="" disabled>Select a blog category</option>
                {BLOG_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
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
            <label className="admin-form-field span-3" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '5px 0' }}>
              <input 
                type="checkbox" 
                checked={!!editingBlog.is_featured} 
                onChange={(e) => updateField('is_featured', e.target.checked)} 
                style={{ width: '20px', height: '20px', cursor: 'pointer', margin: 0 }} 
              />
              <span style={{ fontWeight: '600', color: 'var(--ink)' }}>Featured Blog (Destacado)</span>
            </label>
            <div className="admin-form-field span-3">
              <span>Blog Content *</span>
              <BlogContentEditor ref={blogContentEditorRef} value={editingBlog.content || ''} onChange={(value) => updateField('content', value)} />
            </div>
          </div>
          <div className="admin-editor-footer">
            <button type="button" className="secondary-admin-button" onClick={handleCancelEdit}>Cancel</button>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? 'Saving...' : (editingBlog.id ? 'Update Post' : 'Create Post')}
            </button>
          </div>
        </form>
      </div>
    );
  }

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
                <h4 style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  {blog.title}
                  {blog.is_featured && (
                    <span style={{
                      fontSize: '0.65rem',
                      background: 'var(--green)',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Featured
                    </span>
                  )}
                </h4>
                <p className="admin-card-meta">
                  <span>{blog.author}</span> · <span>{formatDate(blog.date_posted)}</span>
                </p>
                <p className="admin-card-desc">{blog.description}</p>
                <div className="admin-row-actions">
                  <button className="admin-action-btn edit" onClick={() => handleEdit(blog.id)}>Edit</button>
                  <button className={`admin-action-btn star ${blog.is_featured ? 'active' : ''}`} onClick={() => handleToggleFeatured(blog)}>
                    {blog.is_featured ? '★ Featured' : '☆ Feature'}
                  </button>
                  <button className="admin-action-btn delete" onClick={() => handleDelete(blog.id)}>Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

    </>
  );
}

export default AdminBlogs;
