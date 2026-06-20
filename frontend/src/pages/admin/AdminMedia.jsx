import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch, API_URL } from '../../utils/api';

function AdminMedia() {
  const [media, setMedia] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [uploading, setUploading] = useState(false);

  // Upload form state
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedUnionId, setSelectedUnionId] = useState('');
  const [mainDisplay, setMainDisplay] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [mediaData, fpsData] = await Promise.all([
        apiFetch('/api/admin-panel/media/'),
        apiFetch('/api/admin-panel/featured-products/')
      ]);
      setMedia(mediaData.results || []);
      setFeaturedProducts(fpsData.results || []);
    } catch (err) {
      setError(err.message || 'Failed to load media gallery.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0] || null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select an image file first.');
      return;
    }
    if (!selectedUnionId) {
      setError('Please select a product association.');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('union_id', selectedUnionId);
      formData.append('main_display', mainDisplay);

      // CSRF token retrieval helper
      let csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];

      if (!csrfToken) {
        const csrfRes = await fetch(`${API_URL}/api/csrf/`, { credentials: 'include' });
        const csrfData = await csrfRes.json();
        csrfToken = csrfData.csrftoken;
      }

      const response = await fetch(`${API_URL}/api/admin-panel/media/upload/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'X-CSRFToken': csrfToken },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to upload image.');
      }

      showSuccess('Image uploaded successfully.');
      setSelectedFile(null);
      setMainDisplay(false);
      // Reset file input element
      const fileInput = document.getElementById('media-file-input');
      if (fileInput) fileInput.value = '';

      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (imageId) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    try {
      await apiFetch(`/api/admin-panel/media/${imageId}/delete/`, { method: 'POST' });
      showSuccess('Image deleted.');
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <div className="admin-section-header">
        <h2 id="admin-content-title">Media Library</h2>
      </div>

      {successMsg && <div className="admin-alert success">{successMsg}</div>}
      {error && <div className="admin-alert error">{error}</div>}

      <div className="admin-media-layout">
        {/* Upload Panel */}
        <section className="admin-form-section" aria-labelledby="upload-media-title">
          <h3 id="upload-media-title">Upload New Product Image</h3>
          <form onSubmit={handleUpload} className="admin-media-upload-form">
            <div className="admin-form-grid">
              <label className="admin-form-field span-3">
                <span>Select Image *</span>
                <input 
                  id="media-file-input"
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  required 
                />
              </label>

              <label className="admin-form-field span-2">
                <span>Associate with Product *</span>
                <select 
                  value={selectedUnionId} 
                  onChange={(e) => setSelectedUnionId(e.target.value)} 
                  required
                >
                  <option value="">-- Choose Product --</option>
                  {featuredProducts.map(fp => (
                    <option key={fp.id} value={fp.union_id}>
                      {fp.product_name} ({fp.catalog_number})
                    </option>
                  ))}
                </select>
              </label>

              <div className="admin-form-toggles span-1" style={{ alignSelf: 'center', marginTop: '1.5rem' }}>
                <label className="admin-toggle">
                  <input 
                    type="checkbox" 
                    checked={mainDisplay} 
                    onChange={(e) => setMainDisplay(e.target.checked)} 
                  />
                  <span>Main Display</span>
                </label>
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <button type="submit" className="primary-button" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload Image'}
              </button>
            </div>
          </form>
        </section>

        {/* Gallery section */}
        <section className="admin-table-section" aria-labelledby="gallery-title" style={{ marginTop: '2rem' }}>
          <h3 id="gallery-title">Gallery ({media.length} items)</h3>
          {loading ? (
            <div className="admin-empty-table">Loading media...</div>
          ) : media.length === 0 ? (
            <div className="admin-empty-table">No images in library yet.</div>
          ) : (
            <div className="admin-media-grid">
              {media.map((img) => (
                <div key={img.id} className="admin-media-card">
                  <div className="admin-media-img-wrapper">
                    <img src={img.url} alt="" />
                    {img.main_display && (
                      <span className="admin-media-badge main">Main</span>
                    )}
                  </div>
                  <div className="admin-media-details">
                    <span className="admin-media-name" title={img.product_name || 'Unassigned'}>
                      {img.product_name || 'Unassigned'}
                    </span>
                    <code className="admin-media-code">
                      {img.catalog_number ? `Cat: ${img.catalog_number}` : `Union ID: ${img.union_id || '—'}`}
                    </code>
                    <button 
                      type="button" 
                      className="admin-action-btn delete" 
                      onClick={() => handleDelete(img.id)}
                      style={{ marginTop: '0.5rem', width: '100%' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export default AdminMedia;
