import React, { useEffect, useState, useCallback, useMemo, useRef, useImperativeHandle } from 'react';
import { apiFetch, API_URL, formatAssetUrl } from '../../utils/api';
import { formatRichText } from '../../utils/richText';
import { ProductContentEditor as BlogContentEditor } from './AdminProducts';

const formatAttachmentSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

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
  const [blogCategories, setBlogCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingBlog, setEditingBlog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categorySaving, setCategorySaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [removedAttachmentIds, setRemovedAttachmentIds] = useState([]);
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

  const loadBlogCategories = useCallback(async () => {
    setCategoriesLoading(true);
    try {
      const data = await apiFetch('/api/admin-panel/blog-categories/');
      setBlogCategories(Array.isArray(data) ? data : (data.results || []));
    } catch (err) {
      setError(err.message || 'Failed to load blog categories.');
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBlogs();
    loadBlogCategories();
  }, [loadBlogs, loadBlogCategories]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const openCategoryManager = () => {
    setEditingCategory(null);
    setIsCategoryManagerOpen(true);
    setError('');
    loadBlogCategories();
  };

  const closeCategoryManager = () => {
    if (categorySaving) return;
    setIsCategoryManagerOpen(false);
    setEditingCategory(null);
    setError('');
  };

  const startCreateCategory = () => {
    const nextOrder = blogCategories.reduce(
      (highest, category) => Math.max(highest, Number(category.display_order) || 0),
      0,
    ) + 1;
    setEditingCategory({
      name: '',
      slug: '',
      description: '',
      display_order: nextOrder,
      is_active: true,
    });
  };

  const startEditCategory = (category) => {
    setEditingCategory({ ...category });
    setError('');
  };

  const updateCategoryField = (field, value) => {
    setEditingCategory((previous) => ({ ...previous, [field]: value }));
  };

  const handleSaveCategory = async (event) => {
    event.preventDefault();
    setCategorySaving(true);
    setError('');

    try {
      const isNew = !editingCategory.id;
      const endpoint = isNew
        ? '/api/admin-panel/blog-categories/create/'
        : `/api/admin-panel/blog-categories/${editingCategory.id}/update/`;
      await apiFetch(endpoint, {
        method: 'POST',
        body: {
          name: editingCategory.name,
          slug: editingCategory.slug,
          description: editingCategory.description,
          display_order: editingCategory.display_order,
          is_active: !!editingCategory.is_active,
        },
      });
      await loadBlogCategories();
      setEditingCategory(null);
      showSuccess(isNew ? 'Blog category created!' : 'Blog category updated!');
    } catch (err) {
      setError(err.message || 'Failed to save blog category.');
    } finally {
      setCategorySaving(false);
    }
  };

  const handleCreate = () => {
    setEditingBlog({
      title: '',
      category_id: '',
      description: '',
      author: '',
      content: '',
      attachments: [],
    });
    setError('');
    setSuccessMsg('');
    setImageFile(null);
    setAttachmentFiles([]);
    setRemovedAttachmentIds([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = async (blogId) => {
    try {
      setError('');
      setSuccessMsg('');
      const data = await apiFetch(`/api/admin-panel/blogs/${blogId}/`);
      setEditingBlog(data.blog || data);
      setImageFile(null);
      setAttachmentFiles([]);
      setRemovedAttachmentIds([]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingBlog(null);
    setImageFile(null);
    setAttachmentFiles([]);
    setRemovedAttachmentIds([]);
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

      const hasFileChanges = imageFile || attachmentFiles.length > 0 || removedAttachmentIds.length > 0;

      // Use FormData whenever image or attachment files are changing.
      if (hasFileChanges) {
        const formData = new FormData();
        formData.append('title', editingBlog.title);
        formData.append('category_id', editingBlog.category_id);
        formData.append('description', editingBlog.description);
        formData.append('author', editingBlog.author);
        formData.append('content', latestContent);
        formData.append('image', imageFile);
        formData.append('is_featured', String(!!editingBlog.is_featured));
        formData.append('remove_attachment_ids', JSON.stringify(removedAttachmentIds));
        attachmentFiles.forEach((attachmentFile) => {
          formData.append('attachments', attachmentFile);
        });

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
            category_id: editingBlog.category_id,
            description: editingBlog.description,
            author: editingBlog.author,
            content: latestContent,
            is_featured: !!editingBlog.is_featured,
            remove_attachment_ids: removedAttachmentIds,
          },
        });
      }

      showSuccess(isNew ? 'Blog post created!' : 'Blog post updated!');
      setEditingBlog(null);
      setImageFile(null);
      setAttachmentFiles([]);
      setRemovedAttachmentIds([]);
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

  const handleAttachmentSelection = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length > 0) {
      setAttachmentFiles((previous) => [...previous, ...selectedFiles]);
    }
    event.target.value = '';
  };

  const removePendingAttachment = (index) => {
    setAttachmentFiles((previous) => previous.filter((_, fileIndex) => fileIndex !== index));
  };

  const removeSavedAttachment = (attachmentId) => {
    setRemovedAttachmentIds((previous) => (
      previous.includes(attachmentId) ? previous : [...previous, attachmentId]
    ));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const groupedBlogs = useMemo(() => {
    const groups = new Map();

    blogCategories.forEach((category) => {
      groups.set(`category-${category.id}`, {
        id: category.id,
        name: category.name,
        isActive: category.is_active,
        blogs: [],
      });
    });

    blogs.forEach((blog) => {
      const categoryKey = blog.category_id
        ? `category-${blog.category_id}`
        : `name-${blog.category || 'Uncategorized'}`;
      if (!groups.has(categoryKey)) {
        groups.set(categoryKey, {
          id: blog.category_id || categoryKey,
          name: blog.category || 'Uncategorized',
          isActive: true,
          blogs: [],
        });
      }
      groups.get(categoryKey).blogs.push(blog);
    });

    return Array.from(groups.values()).filter((group) => group.blogs.length > 0);
  }, [blogCategories, blogs]);

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
              <select
                value={editingBlog.category_id || ''}
                onChange={(e) => updateField('category_id', e.target.value)}
                required
                disabled={categoriesLoading}
              >
                <option value="" disabled>
                  {categoriesLoading ? 'Loading blog categories...' : 'Select a blog category'}
                </option>
                {blogCategories.map((category) => (
                  (category.is_active || String(category.id) === String(editingBlog.category_id)) && (
                    <option key={category.id} value={category.id}>
                      {category.name}{category.is_active ? '' : ' (Inactive)'}
                    </option>
                  )
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
            <div className="admin-form-field span-3 admin-blog-attachments-editor">
              <div className="admin-blog-attachments-heading">
                <div>
                  <span>Attachments</span>
                  <small>Files will be available to view and download from the published blog post.</small>
                </div>
                <label className="secondary-admin-button admin-blog-attachment-upload">
                  + Upload Attachments
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.txt,.zip,.png,.jpg,.jpeg,.gif,.webp"
                    onChange={handleAttachmentSelection}
                  />
                </label>
              </div>

              <div className="admin-blog-attachment-list">
                {(editingBlog.attachments || [])
                  .filter((attachment) => !removedAttachmentIds.includes(attachment.id))
                  .map((attachment) => (
                    <div className="admin-blog-attachment-row" key={attachment.id}>
                      <span className="admin-blog-attachment-icon" aria-hidden="true">DOC</span>
                      <div>
                        <strong>{attachment.name || attachment.original_name}</strong>
                        <span>Saved attachment</span>
                      </div>
                      <a href={formatAssetUrl(attachment.url)} target="_blank" rel="noopener noreferrer">View</a>
                      <button type="button" className="admin-action-btn delete" onClick={() => removeSavedAttachment(attachment.id)}>Remove</button>
                    </div>
                  ))}

                {attachmentFiles.map((attachmentFile, index) => (
                  <div className="admin-blog-attachment-row is-pending" key={`${attachmentFile.name}-${attachmentFile.lastModified}-${index}`}>
                    <span className="admin-blog-attachment-icon" aria-hidden="true">NEW</span>
                    <div>
                      <strong>{attachmentFile.name}</strong>
                      <span>{formatAttachmentSize(attachmentFile.size)} · Uploads when this post is saved</span>
                    </div>
                    <button type="button" className="admin-action-btn delete" onClick={() => removePendingAttachment(index)}>Remove</button>
                  </div>
                ))}

                {(editingBlog.attachments || []).filter((attachment) => !removedAttachmentIds.includes(attachment.id)).length === 0
                  && attachmentFiles.length === 0 && (
                    <p className="admin-blog-attachment-empty">No attachments added.</p>
                  )}
              </div>
              <small className="admin-blog-attachment-help">Maximum 50 MB per file.</small>
            </div>
            <label className="admin-form-field span-3" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '5px 0' }}>
              <input 
                type="checkbox" 
                checked={!!editingBlog.is_featured} 
                onChange={(e) => updateField('is_featured', e.target.checked)} 
                style={{ width: '20px', height: '20px', cursor: 'pointer', margin: 0 }} 
              />
              <span style={{ fontWeight: '600', color: 'var(--ink)' }}>Featured Blog</span>
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
        <div className="admin-blog-header-actions">
          <button type="button" className="secondary-admin-button" onClick={openCategoryManager}>Manage Blog Categories</button>
          <button type="button" className="primary-button" onClick={handleCreate}>+ Add Blog Post</button>
        </div>
      </div>

      {successMsg && <div className="admin-alert success">{successMsg}</div>}
      {error && <div className="admin-alert error">{error}</div>}

      {loading ? (
        <div className="admin-empty-table">Loading blog posts...</div>
      ) : blogs.length === 0 ? (
        <div className="admin-empty-table">No blog posts found.</div>
      ) : (
        <div className="admin-blog-groups">
          {groupedBlogs.map((group) => (
            <section className="admin-blog-group" key={group.id} aria-labelledby={`admin-blog-category-${group.id}`}>
              <div className="admin-blog-group-header">
                <h3 id={`admin-blog-category-${group.id}`}>{group.name}</h3>
                {!group.isActive && <span className="admin-category-status is-inactive">Inactive</span>}
                <span className="admin-blog-group-count">
                  {group.blogs.length} {group.blogs.length === 1 ? 'post' : 'posts'}
                </span>
              </div>
              <div className="admin-cards-grid">
                {group.blogs.map((blog) => (
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
            </section>
          ))}
        </div>
      )}

      {isCategoryManagerOpen && (
        <div className="admin-modal-overlay" onClick={closeCategoryManager}>
          <div
            className="admin-modal admin-modal-lg admin-blog-category-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="blog-category-manager-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-modal-header">
              <div>
                <h3 id="blog-category-manager-title">Blog Categories</h3>
                <p>Create categories or update how they appear on the public Blogs page.</p>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                aria-label="Close blog category manager"
                disabled={categorySaving}
                onClick={closeCategoryManager}
              >
                ×
              </button>
            </div>

            <div className="admin-modal-body">
              {error && <div className="admin-alert error" role="alert">{error}</div>}

              <div className="admin-blog-category-toolbar">
                <p>{blogCategories.length} {blogCategories.length === 1 ? 'category' : 'categories'}</p>
                <button type="button" className="primary-button" onClick={startCreateCategory}>+ Add Category</button>
              </div>

              {editingCategory && (
                <form id="admin-blog-category-form" className="admin-blog-category-form" onSubmit={handleSaveCategory}>
                  <div className="admin-form-grid">
                    <label className="admin-form-field">
                      <span>Category Name *</span>
                      <input
                        type="text"
                        value={editingCategory.name || ''}
                        maxLength="100"
                        required
                        autoFocus
                        onChange={(event) => updateCategoryField('name', event.target.value)}
                      />
                    </label>
                    <label className="admin-form-field">
                      <span>URL Slug</span>
                      <input
                        type="text"
                        value={editingCategory.slug || ''}
                        maxLength="120"
                        placeholder="Generated from the category name"
                        onChange={(event) => updateCategoryField('slug', event.target.value)}
                      />
                    </label>
                    <label className="admin-form-field">
                      <span>Display Order</span>
                      <input
                        type="number"
                        min="0"
                        value={editingCategory.display_order ?? 0}
                        onChange={(event) => updateCategoryField('display_order', event.target.value)}
                      />
                    </label>
                    <label className="admin-form-field span-3">
                      <span>Description</span>
                      <textarea
                        rows="3"
                        value={editingCategory.description || ''}
                        onChange={(event) => updateCategoryField('description', event.target.value)}
                      />
                    </label>
                    <label className="admin-toggle admin-blog-category-active">
                      <input
                        type="checkbox"
                        checked={!!editingCategory.is_active}
                        onChange={(event) => updateCategoryField('is_active', event.target.checked)}
                      />
                      <span>Active on public Blogs page</span>
                    </label>
                  </div>
                  <div className="admin-blog-category-form-actions">
                    <button type="button" className="secondary-admin-button" disabled={categorySaving} onClick={() => setEditingCategory(null)}>Cancel</button>
                    <button type="submit" className="primary-button" disabled={categorySaving}>
                      {categorySaving ? 'Saving...' : (editingCategory.id ? 'Update Category' : 'Create Category')}
                    </button>
                  </div>
                </form>
              )}

              {categoriesLoading ? (
                <div className="admin-empty-table">Loading blog categories...</div>
              ) : blogCategories.length === 0 ? (
                <div className="admin-empty-table">No blog categories found. Add the first category above.</div>
              ) : (
                <div className="admin-data-table-wrap">
                  <table className="admin-data-table admin-blog-category-table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Posts</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {blogCategories.map((category) => (
                        <tr key={category.id}>
                          <td>{category.display_order}</td>
                          <td>
                            <strong>{category.name}</strong>
                            <code>/{category.slug}</code>
                          </td>
                          <td>{category.description || '—'}</td>
                          <td>
                            <span className={`admin-category-status ${category.is_active ? 'is-active' : 'is-inactive'}`}>
                              {category.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>{category.blog_count || 0}</td>
                          <td>
                            <button type="button" className="admin-action-btn edit" onClick={() => startEditCategory(category)}>Edit</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button type="button" className="secondary-admin-button" disabled={categorySaving} onClick={closeCategoryManager}>Close</button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}

export default AdminBlogs;
