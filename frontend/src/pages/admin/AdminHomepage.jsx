import React, { useEffect, useState } from 'react';
import { apiFetch, formatAssetUrl } from '../../utils/api';

function AdminHomepage() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [eyebrow, setEyebrow] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [primaryBtnText, setPrimaryBtnText] = useState('');
  const [primaryBtnLink, setPrimaryBtnLink] = useState('');
  const [secondaryBtnText, setSecondaryBtnText] = useState('');
  const [secondaryBtnLink, setSecondaryBtnLink] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  // File upload state
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchSlides = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/admin-panel/homepage-slides/');
      setSlides(data.results || []);
    } catch (err) {
      setError('Failed to fetch homepage slides: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const openAddModal = () => {
    setEditingSlide(null);
    setEyebrow('');
    setTitle('');
    setDescription('');
    setPrimaryBtnText('');
    setPrimaryBtnLink('');
    setSecondaryBtnText('');
    setSecondaryBtnLink('');
    setImageUrl('');
    setDisplayOrder(slides.length + 1);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (slide) => {
    setEditingSlide(slide);
    setEyebrow(slide.eyebrow || '');
    setTitle(slide.title || '');
    setDescription(slide.description || '');
    setPrimaryBtnText(slide.primary_button_text || '');
    setPrimaryBtnLink(slide.primary_button_link || '');
    setSecondaryBtnText(slide.secondary_button_text || '');
    setSecondaryBtnLink(slide.secondary_button_link || '');
    setImageUrl(slide.image_url || '');
    setDisplayOrder(slide.display_order || 0);
    setIsActive(slide.is_active);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await apiFetch('/api/admin-panel/products/upload-image/', {
        method: 'POST',
        body: formData,
        headers: {} // Let browser set boundary automatically
      });
      setImageUrl(response.image_path);
      setSuccess('Image uploaded successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to upload image: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving || uploading) return;
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    // Defensive parsing of display order to prevent crash on NaN or null
    let orderNum = 0;
    if (displayOrder !== '' && displayOrder !== null && displayOrder !== undefined) {
      const parsed = Number(displayOrder);
      if (!isNaN(parsed)) {
        orderNum = Math.floor(parsed);
      }
    }

    const payload = {
      eyebrow,
      title,
      description,
      primary_button_text: primaryBtnText,
      primary_button_link: primaryBtnLink,
      secondary_button_text: secondaryBtnText,
      secondary_button_link: secondaryBtnLink,
      image_url: imageUrl,
      display_order: orderNum,
      is_active: isActive
    };

    setSaving(true);
    setError('');
    try {
      if (editingSlide) {
        // Update
        await apiFetch(`/api/admin-panel/homepage-slides/${editingSlide.id}/update/`, {
          method: 'PUT',
          body: payload
        });
        setSuccess('Homepage slide updated successfully');
      } else {
        // Create
        await apiFetch('/api/admin-panel/homepage-slides/create/', {
          method: 'POST',
          body: payload
        });
        setSuccess('Homepage slide created successfully');
      }
      setIsModalOpen(false);
      fetchSlides();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save slide: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slideId) => {
    if (!window.confirm('Are you sure you want to delete this slide?')) return;

    setError('');
    try {
      await apiFetch(`/api/admin-panel/homepage-slides/${slideId}/delete/`, {
        method: 'DELETE'
      });
      setSuccess('Slide deleted successfully');
      fetchSlides();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete slide: ' + err.message);
    }
  };

  const getSlideThumbnail = (url) => {
    if (!url) return null;
    if (url.startsWith('/images/')) {
      return url; // served locally from public
    }
    return formatAssetUrl(url); // served from media
  };

  return (
    <>
      <div className="admin-header-actions">
        <h2 id="admin-content-title">Homepage Slides</h2>
        <button className="admin-btn-primary" onClick={openAddModal}>
          + Add New Slide
        </button>
      </div>

      <p className="admin-section-subtitle">
        Manage the hero promotion slides that display on the main website homepage. Slides are shown in order of their display order values.
      </p>

      {error && <div className="admin-notification error">{error}</div>}
      {success && <div className="admin-notification success">{success}</div>}

      {loading ? (
        <div className="admin-loading">Loading homepage slides...</div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Order</th>
                <th style={{ width: '120px' }}>Preview</th>
                <th>Eyebrow</th>
                <th>Title</th>
                <th>Primary CTA</th>
                <th style={{ width: '100px' }}>Status</th>
                <th style={{ width: '150px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {slides.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>
                    No slides found in the database.
                  </td>
                </tr>
              ) : (
                slides.map((slide) => (
                  <tr key={slide.id}>
                    <td><strong>{slide.display_order}</strong></td>
                    <td>
                      {slide.image_url ? (
                        <img
                          src={getSlideThumbnail(slide.image_url)}
                          alt={slide.title}
                          style={{
                            width: '90px',
                            height: '55px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            background: '#0a1931'
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: '12px', color: '#888' }}>Default Art</span>
                      )}
                    </td>
                    <td>{slide.eyebrow || <em style={{ color: '#666' }}>None</em>}</td>
                    <td>
                      <span dangerouslySetInnerHTML={{ __html: slide.title }} />
                    </td>
                    <td>
                      {slide.primary_button_text ? (
                        <span className="admin-tag pointer" style={{ background: 'rgba(0, 111, 242, 0.15)', color: '#0084ff' }}>
                          {slide.primary_button_text} ({slide.primary_button_link})
                        </span>
                      ) : (
                        <em style={{ color: '#666' }}>None</em>
                      )}
                    </td>
                    <td>
                      <span className={`admin-status-badge ${slide.is_active ? 'active' : 'inactive'}`}>
                        {slide.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="admin-table-actions">
                        <button className="admin-action-btn edit" onClick={() => openEditModal(slide)}>
                          Edit
                        </button>
                        <button className="admin-action-btn delete" onClick={() => handleDelete(slide.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="admin-modal admin-modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{editingSlide ? 'Edit Homepage Slide' : 'Add Homepage Slide'}</h3>
              <button className="admin-modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleSave} className="admin-modal-body">
              <div className="form-row">
                <div className="form-group col-6">
                  <label>Eyebrow Text (e.g. "Limited Offer")</label>
                  <input
                    type="text"
                    value={eyebrow}
                    onChange={(e) => setEyebrow(e.target.value)}
                    placeholder="Small uppercase header text"
                  />
                </div>
                <div className="form-group col-6">
                  <label>Display Order</label>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Slide Title (HTML supported, e.g. "50% Off Precast Gels")</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Slide main heading. Use <span>text</span> for highlight color."
                  required
                />
              </div>

              <div className="form-group">
                <label>Description / Subtitle</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  placeholder="Supporting text detailing the promotion or services..."
                />
              </div>

              <div className="form-row">
                <div className="form-group col-6">
                  <label>Primary Button Text</label>
                  <input
                    type="text"
                    value={primaryBtnText}
                    onChange={(e) => setPrimaryBtnText(e.target.value)}
                    placeholder="e.g. Shop Now"
                  />
                </div>
                <div className="form-group col-6">
                  <label>Primary Button Link</label>
                  <input
                    type="text"
                    value={primaryBtnLink}
                    onChange={(e) => setPrimaryBtnLink(e.target.value)}
                    placeholder="e.g. /search?q=Agarose"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group col-6">
                  <label>Secondary Button Text</label>
                  <input
                    type="text"
                    value={secondaryBtnText}
                    onChange={(e) => setSecondaryBtnText(e.target.value)}
                    placeholder="e.g. Request a Quote"
                  />
                </div>
                <div className="form-group col-6">
                  <label>Secondary Button Link</label>
                  <input
                    type="text"
                    value={secondaryBtnLink}
                    onChange={(e) => setSecondaryBtnLink(e.target.value)}
                    placeholder="e.g. /request-quote"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Background/Banner Image Path</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="e.g. /images/homepage/Homepage-1.jpg"
                    style={{ flex: 1 }}
                  />
                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      className="admin-btn-secondary"
                      disabled={uploading}
                      style={{ minHeight: '38px', whiteSpace: 'nowrap' }}
                    >
                      {uploading ? 'Uploading...' : 'Upload File'}
                    </button>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        opacity: 0,
                        width: '100%',
                        height: '100%',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                </div>
                <small style={{ color: '#888', marginTop: '4px', display: 'block' }}>
                  Provide a custom route (e.g. starting with `/images/homepage/`) or upload a file. Leave empty to display the default animated SVG gel illustration.
                </small>
              </div>

              {imageUrl && (
                <div style={{ marginTop: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#aaa', display: 'block', marginBottom: '4px' }}>Image Preview:</span>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                      src={getSlideThumbnail(imageUrl)}
                      alt="Thumbnail Preview"
                      style={{
                        maxWidth: '220px',
                        maxHeight: '120px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        display: 'block'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        fontSize: '11px',
                        lineHeight: '20px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        padding: 0
                      }}
                      title="Clear image path"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <span>Is Active (will be displayed on the homepage slider)</span>
                </label>
              </div>

              <div className="admin-modal-footer">
                <button 
                  type="button" 
                  className="admin-btn-secondary" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving || uploading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="admin-btn-primary"
                  disabled={saving || uploading}
                >
                  {saving ? 'Saving...' : (editingSlide ? 'Save Changes' : 'Create Slide')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminHomepage;
