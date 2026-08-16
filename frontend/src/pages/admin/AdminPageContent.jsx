import { useCallback, useEffect, useState } from 'react';
import { apiFetch, formatAssetUrl } from '../../utils/api';
import { ProductContentEditor } from './AdminProducts';

const PAGE_IMAGE_UPLOAD_ENDPOINT = '/api/admin-panel/page-content/upload-image/';
const INVESTOR_ICON_OPTIONS = [
  { value: '\u25a3', label: 'Foundation' },
  { value: '\u25a4', label: 'Platform' },
  { value: '\u2301', label: 'Future' },
  { value: '\u2697', label: 'Science' },
  { value: '\ud83e\uddec', label: 'Gene Editing' },
  { value: '\u25ce', label: 'Target' },
  { value: '\u2197', label: 'Growth' },
  { value: '\u2726', label: 'Innovation' },
  { value: '\u25c8', label: 'Partnership' },
];
const ABOUT_HIGHLIGHT_ICON_OPTIONS = [
  { value: '\u25a6', label: 'Company' },
  { value: '\u2697', label: 'Science' },
  { value: '\u2723', label: 'Platform' },
  { value: '\u2699', label: 'AI & Engineering' },
  { value: '\u2662', label: 'Clinical' },
  { value: '\ud83e\uddec', label: 'Gene Editing' },
  { value: '\u25ce', label: 'Target' },
  { value: '\u2726', label: 'Innovation' },
  { value: '\u25c8', label: 'Partnership' },
];
const hasHtml = (value) => /<\/?[a-z][\s\S]*>/i.test(String(value || ''));
const escapeHtml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const blocksToEditorValue = (value) => (Array.isArray(value) ? value : [value])
  .map((item) => {
    const text = String(item || '').trim();
    if (!text) return '';
    return hasHtml(text) ? text : `<p>${escapeHtml(text)}</p>`;
  })
  .join('');

const editorValueToBlocks = (value) => {
  const html = String(value || '').trim();
  if (!html) return [];
  const template = document.createElement('template');
  template.innerHTML = html;
  return Array.from(template.content.childNodes)
    .map((node) => (
      node.nodeType === Node.TEXT_NODE ? node.textContent.trim() : node.outerHTML
    ))
    .filter(Boolean);
};

const itemsToEditorValue = (value) => {
  const items = Array.isArray(value) ? value : [];
  if (!items.length) return '';
  return `<ul>${items.map((item) => `<li>${hasHtml(item) ? item : escapeHtml(item)}</li>`).join('')}</ul>`;
};

const editorValueToItems = (value) => {
  const html = String(value || '').trim();
  if (!html) return [];
  const template = document.createElement('template');
  template.innerHTML = html;
  const listItems = Array.from(template.content.querySelectorAll('li'));
  if (listItems.length) return listItems.map((item) => item.innerHTML.trim()).filter(Boolean);
  return editorValueToBlocks(html);
};

const editorRecordKey = (prefix, item, index) => (
  item.id ? `${prefix}-${item.id}` : item._editor_key || `${prefix}-new-${index}`
);

const newEditorKey = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function RichTextField({ label, value, onChange, list = false }) {
  return (
    <div className="admin-content-rich-field full-width">
      <span className="admin-content-field-label">{label}</span>
      <ProductContentEditor
        value={list ? itemsToEditorValue(value) : blocksToEditorValue(value)}
        onChange={(html) => onChange(list ? editorValueToItems(html) : editorValueToBlocks(html))}
        ariaLabel={label}
        imageUploadEndpoint={PAGE_IMAGE_UPLOAD_ENDPOINT}
      />
    </div>
  );
}

function RichTextValueField({ label, value, onChange }) {
  return (
    <div className="admin-content-rich-field full-width">
      <span className="admin-content-field-label">{label}</span>
      <ProductContentEditor
        value={value || ''}
        onChange={onChange}
        ariaLabel={label}
        imageUploadEndpoint={PAGE_IMAGE_UPLOAD_ENDPOINT}
      />
    </div>
  );
}

function ImageUploadField({ label, value, onChange, alt = '' }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await apiFetch(PAGE_IMAGE_UPLOAD_ENDPOINT, {
        method: 'POST',
        body: formData,
      });
      onChange(response.image_path || response.url || '');
    } catch (error) {
      setUploadError(error.message || 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="admin-content-image-field full-width">
      <span className="admin-content-field-label">{label}</span>
      <div className="admin-content-image-controls">
        <input value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder="media/page_content_images/image.jpg" />
        <label className="admin-btn-secondary admin-content-upload-button">
          {uploading ? 'Uploading...' : 'Upload image'}
          <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={uploadImage} disabled={uploading} />
        </label>
        {value && <button type="button" className="admin-content-remove" onClick={() => onChange('')}>Remove image</button>}
      </div>
      {uploadError && <small className="admin-content-upload-error">{uploadError}</small>}
      {value && <img className="admin-content-image-preview" src={formatAssetUrl(value)} alt={alt || 'Uploaded content preview'} />}
    </div>
  );
}

function EditorHeader({ title, description, publicPath, saving, onSave, onCancel }) {
  return (
    <div className="admin-page-content-header">
      <div>
        <h2 id="admin-content-title">{title}</h2>
        <p>{description}</p>
      </div>
      <div className="admin-page-content-actions">
        <a href={publicPath} target="_blank" rel="noopener noreferrer">View public page</a>
        <button type="button" className="admin-btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="button" className="admin-btn-primary" onClick={onSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save all changes'}
        </button>
      </div>
    </div>
  );
}

function Message({ error, success }) {
  if (error) return <div className="admin-message admin-error">{error}</div>;
  if (success) return <div className="admin-message admin-success">{success}</div>;
  return null;
}

function ActiveOrderFields({ item, onChange }) {
  return (
    <div className="admin-content-inline-fields">
      <label>
        Display order
        <input
          type="number"
          min="0"
          value={item.display_order ?? 0}
          onChange={(event) => onChange('display_order', Number(event.target.value) || 0)}
        />
      </label>
      <label className="admin-content-checkbox">
        <input
          type="checkbox"
          checked={item.is_active !== false}
          onChange={(event) => onChange('is_active', event.target.checked)}
        />
        Active
      </label>
    </div>
  );
}

function RecordCard({
  title,
  children,
  onRemove,
  collapsible = false,
  expanded = true,
  onToggle,
  dragHandleLabel = '',
  isDragging = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}) {
  return (
    <article
      className={`admin-content-record ${collapsible && !expanded ? 'is-collapsed' : ''} ${isDragging ? 'is-dragging' : ''}`.trim()}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="admin-content-record-heading">
        <div className="admin-content-record-title">
          {dragHandleLabel && (
            <button
              type="button"
              className="admin-content-drag-control"
              draggable
              aria-label={dragHandleLabel}
              title={dragHandleLabel}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            >
              <span aria-hidden="true">{'\u2261'}</span>
            </button>
          )}
          <h4>{title}</h4>
        </div>
        <div className="admin-content-record-actions">
          {collapsible && (
            <button
              type="button"
              className="admin-content-toggle"
              aria-expanded={expanded}
              onClick={onToggle}
            >
              {expanded ? 'Hide' : 'Show'}
            </button>
          )}
          <button type="button" className="admin-content-remove" onClick={onRemove}>Remove</button>
        </div>
      </div>
      {(!collapsible || expanded) && children}
    </article>
  );
}

function LoadingPanel() {
  return <div className="admin-loading-page"><div className="admin-spinner" /><p>Loading page content...</p></div>;
}

export function AdminAboutBioArk() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedHighlights, setExpandedHighlights] = useState(() => new Set());
  const [expandedTeamMembers, setExpandedTeamMembers] = useState(() => new Set());
  const [draggedAboutRecord, setDraggedAboutRecord] = useState(null);

  const loadContent = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/admin-panel/about-page/');
      setContent({
        overview: data.overview || {
          page_title: 'Why BioArk',
          page_subtitle: '',
          section_title: 'Who We Are',
          paragraphs: [],
          is_active: true,
        },
        highlights: data.highlights || [],
        team_members: data.team_members || [],
      });
      return true;
    } catch (err) {
      setError(err.message || 'Unable to load About BioArk content.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Loading is intentionally triggered when the editor is mounted.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadContent();
  }, [loadContent]);

  const updateOverview = (field, value) => {
    setContent((current) => ({
      ...current,
      overview: { ...current.overview, [field]: value },
    }));
  };

  const updateRow = (section, index, field, value) => {
    setContent((current) => ({
      ...current,
      [section]: current[section].map((item, itemIndex) => (
        itemIndex === index ? { ...item, [field]: value } : item
      )),
    }));
  };

  const removeRow = (section, index) => {
    setContent((current) => ({
      ...current,
      [section]: current[section].filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const toggleRecord = (setExpanded, key) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const startRecordDrag = (event, section, index) => {
    setDraggedAboutRecord({ section, index });
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', `${section}:${index}`);
  };

  const dropRecord = (event, section, targetIndex) => {
    event.preventDefault();
    if (!draggedAboutRecord || draggedAboutRecord.section !== section) return;

    const sourceIndex = draggedAboutRecord.index;
    setDraggedAboutRecord(null);
    if (sourceIndex === targetIndex) return;

    setContent((current) => {
      const reordered = [...current[section]];
      const [movedItem] = reordered.splice(sourceIndex, 1);
      reordered.splice(targetIndex, 0, movedItem);
      return {
        ...current,
        [section]: reordered.map((item, index) => ({ ...item, display_order: index + 1 })),
      };
    });
  };

  const addHighlight = () => {
    const editorKey = newEditorKey('highlight');
    setContent((current) => ({
      ...current,
      highlights: [...current.highlights, {
        _editor_key: editorKey,
        icon: ABOUT_HIGHLIGHT_ICON_OPTIONS[0].value,
        title: '',
        text: '',
        display_order: current.highlights.length + 1,
        is_active: true,
      }],
    }));
    setExpandedHighlights((current) => new Set(current).add(editorKey));
  };

  const addTeamMember = () => {
    const editorKey = newEditorKey('team-member');
    setContent((current) => ({
      ...current,
      team_members: [...current.team_members, {
        _editor_key: editorKey,
        initials: '', name: '', role: '', image_url: '', short_bio: '', full_bio: [],
        display_order: current.team_members.length + 1, is_active: true,
      }],
    }));
    setExpandedTeamMembers((current) => new Set(current).add(editorKey));
  };

  const saveContent = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const data = await apiFetch('/api/admin-panel/about-page/', {
        method: 'PUT',
        body: content,
      });
      setContent({
        overview: data.overview,
        highlights: data.highlights || [],
        team_members: data.team_members || [],
      });
      setSuccess(data.message || 'About BioArk content saved.');
    } catch (err) {
      setError(err.message || 'Unable to save About BioArk content.');
    } finally {
      setSaving(false);
    }
  };

  const cancelChanges = async () => {
    if (saving) return;
    setSuccess('');
    setDraggedAboutRecord(null);
    setExpandedHighlights(new Set());
    setExpandedTeamMembers(new Set());
    const restored = await loadContent();
    if (restored) setSuccess('All unsaved About BioArk changes were discarded.');
  };

  if (loading) return <LoadingPanel />;
  if (!content) return <Message error={error || 'About BioArk content is unavailable.'} />;

  return (
    <div className="admin-page-content-editor">
      <EditorHeader
        title="About BioArk Page"
        description="Edit the public page introduction, highlights, and team member biographies."
        publicPath="/about-bioark"
        saving={saving}
        onSave={saveContent}
        onCancel={cancelChanges}
      />
      <Message error={error} success={success} />

      <section className="admin-content-panel">
        <h3>Who We Are</h3>
        <div className="admin-content-form-grid two-column">
          <label>Page title<input value={content.overview.page_title || ''} onChange={(e) => updateOverview('page_title', e.target.value)} /></label>
          <label>Page subtitle<input value={content.overview.page_subtitle || ''} onChange={(e) => updateOverview('page_subtitle', e.target.value)} /></label>
          <label>Section title<input value={content.overview.section_title || ''} onChange={(e) => updateOverview('section_title', e.target.value)} /></label>
          <label className="admin-content-checkbox standalone"><input type="checkbox" checked={content.overview.is_active !== false} onChange={(e) => updateOverview('is_active', e.target.checked)} />Active</label>
          <RichTextField label="Who We Are content" value={content.overview.paragraphs} onChange={(value) => updateOverview('paragraphs', value)} />
        </div>
      </section>

      <section className="admin-content-panel">
        <div className="admin-content-panel-title"><h3>Highlights</h3><button type="button" className="admin-btn-secondary" onClick={addHighlight}>Add highlight</button></div>
        <div className="admin-content-record-list">
          {content.highlights.map((item, index) => (
            <RecordCard
              key={editorRecordKey('highlight', item, index)}
              title={item.title || `New highlight ${index + 1}`}
              onRemove={() => removeRow('highlights', index)}
              collapsible
              expanded={expandedHighlights.has(editorRecordKey('highlight', item, index))}
              onToggle={() => toggleRecord(setExpandedHighlights, editorRecordKey('highlight', item, index))}
              dragHandleLabel={`Drag ${item.title || `highlight ${index + 1}`} to reorder`}
              isDragging={draggedAboutRecord?.section === 'highlights' && draggedAboutRecord.index === index}
              onDragStart={(event) => startRecordDrag(event, 'highlights', index)}
              onDragEnd={() => setDraggedAboutRecord(null)}
              onDragOver={(event) => {
                if (draggedAboutRecord?.section === 'highlights') event.preventDefault();
              }}
              onDrop={(event) => dropRecord(event, 'highlights', index)}
            >
              <div className="admin-content-form-grid three-column">
                <label>
                  Icon
                  <select value={item.icon || ABOUT_HIGHLIGHT_ICON_OPTIONS[0].value} onChange={(e) => updateRow('highlights', index, 'icon', e.target.value)}>
                    {ABOUT_HIGHLIGHT_ICON_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.value} {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="span-two">Title<input value={item.title || ''} onChange={(e) => updateRow('highlights', index, 'title', e.target.value)} /></label>
                <RichTextValueField label="Description" value={item.text} onChange={(value) => updateRow('highlights', index, 'text', value)} />
              </div>
              <ActiveOrderFields item={item} onChange={(field, value) => updateRow('highlights', index, field, value)} />
            </RecordCard>
          ))}
        </div>
      </section>

      <section className="admin-content-panel">
        <div className="admin-content-panel-title"><h3>Meet Our Team</h3><button type="button" className="admin-btn-secondary" onClick={addTeamMember}>Add team member</button></div>
        <div className="admin-content-record-list">
          {content.team_members.map((member, index) => (
            <RecordCard
              key={editorRecordKey('team-member', member, index)}
              title={member.name || `New team member ${index + 1}`}
              onRemove={() => removeRow('team_members', index)}
              collapsible
              expanded={expandedTeamMembers.has(editorRecordKey('team-member', member, index))}
              onToggle={() => toggleRecord(setExpandedTeamMembers, editorRecordKey('team-member', member, index))}
              dragHandleLabel={`Drag ${member.name || `team member ${index + 1}`} to reorder`}
              isDragging={draggedAboutRecord?.section === 'team_members' && draggedAboutRecord.index === index}
              onDragStart={(event) => startRecordDrag(event, 'team_members', index)}
              onDragEnd={() => setDraggedAboutRecord(null)}
              onDragOver={(event) => {
                if (draggedAboutRecord?.section === 'team_members') event.preventDefault();
              }}
              onDrop={(event) => dropRecord(event, 'team_members', index)}
            >
              <div className="admin-content-form-grid three-column">
                <label>Initials<input value={member.initials || ''} onChange={(e) => updateRow('team_members', index, 'initials', e.target.value)} /></label>
                <label>Name<input value={member.name || ''} onChange={(e) => updateRow('team_members', index, 'name', e.target.value)} /></label>
                <label>Role<input value={member.role || ''} onChange={(e) => updateRow('team_members', index, 'role', e.target.value)} /></label>
                <ImageUploadField label="Profile image" value={member.image_url} alt={member.name} onChange={(value) => updateRow('team_members', index, 'image_url', value)} />
                <RichTextValueField label="Card biography" value={member.short_bio} onChange={(value) => updateRow('team_members', index, 'short_bio', value)} />
                <RichTextField label="Full biography" value={member.full_bio} onChange={(value) => updateRow('team_members', index, 'full_bio', value)} />
              </div>
              <ActiveOrderFields item={member} onChange={(field, value) => updateRow('team_members', index, field, value)} />
            </RecordCard>
          ))}
        </div>
      </section>

      <div className="admin-content-bottom-save">
        <button type="button" className="admin-btn-secondary" onClick={cancelChanges} disabled={saving}>Cancel</button>
        <button type="button" className="admin-btn-primary" onClick={saveContent} disabled={saving}>{saving ? 'Saving...' : 'Save all changes'}</button>
      </div>
    </div>
  );
}

export function AdminInvestors() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedTiers, setExpandedTiers] = useState(() => new Set());
  const [expandedMilestones, setExpandedMilestones] = useState(() => new Set());
  const [draggedInvestorRecord, setDraggedInvestorRecord] = useState(null);

  const loadContent = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/admin-panel/investor-page/');
      setContent({
        overview: data.overview || {
          page_title: 'Our Investors',
          page_subtitle: '',
          section_title: 'Company Overview & Vision',
          strategy_section_title: 'Our Three-Tiered Strategy',
          roadmap_section_title: 'Development Roadmap & Milestones',
          paragraphs: [],
          image_url: '',
          image_alt: '',
          is_active: true,
        },
        strategy_tiers: data.strategy_tiers || [],
        milestones: data.milestones || [],
        partner: data.partner || { section_title: 'Partner with BioArk', text: '', button_text: '', button_url: '', button_target: '_self', button_style: 'primary', contact_email: '', is_active: true },
      });
      return true;
    } catch (err) {
      setError(err.message || 'Unable to load investor content.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Loading is intentionally triggered when the editor is mounted.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadContent();
  }, [loadContent]);

  const updateObject = (section, field, value) => setContent((current) => ({
    ...current,
    [section]: { ...current[section], [field]: value },
  }));

  const updateRow = (section, index, field, value) => setContent((current) => ({
    ...current,
    [section]: current[section].map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    )),
  }));

  const removeRow = (section, index) => setContent((current) => ({
    ...current,
    [section]: current[section].filter((_, itemIndex) => itemIndex !== index),
  }));

  const toggleRecord = (setExpanded, key) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const startRecordDrag = (event, section, index) => {
    setDraggedInvestorRecord({ section, index });
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', `${section}:${index}`);
  };

  const dropRecord = (event, section, targetIndex) => {
    event.preventDefault();
    if (!draggedInvestorRecord || draggedInvestorRecord.section !== section) return;

    const sourceIndex = draggedInvestorRecord.index;
    setDraggedInvestorRecord(null);
    if (sourceIndex === targetIndex) return;

    setContent((current) => {
      const reordered = [...current[section]];
      const [movedItem] = reordered.splice(sourceIndex, 1);
      reordered.splice(targetIndex, 0, movedItem);
      return {
        ...current,
        [section]: reordered.map((item, index) => ({ ...item, display_order: index + 1 })),
      };
    });
  };

  const addTier = () => {
    const editorKey = newEditorKey('tier');
    setContent((current) => ({
      ...current,
      strategy_tiers: [...current.strategy_tiers, { _editor_key: editorKey, icon: INVESTOR_ICON_OPTIONS[0].value, title: '', subtitle: '', items: [], note: '', display_order: current.strategy_tiers.length + 1, is_active: true }],
    }));
    setExpandedTiers((current) => new Set(current).add(editorKey));
  };

  const addMilestone = () => {
    const editorKey = newEditorKey('milestone');
    setContent((current) => ({
      ...current,
      milestones: [...current.milestones, { _editor_key: editorKey, phase: '', goal: '', period_and_funding: '', display_order: current.milestones.length + 1, is_active: true }],
    }));
    setExpandedMilestones((current) => new Set(current).add(editorKey));
  };

  const saveContent = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const data = await apiFetch('/api/admin-panel/investor-page/', { method: 'PUT', body: content });
      setContent({ overview: data.overview, strategy_tiers: data.strategy_tiers || [], milestones: data.milestones || [], partner: data.partner });
      setSuccess(data.message || 'Investor page content saved.');
    } catch (err) {
      setError(err.message || 'Unable to save investor page content.');
    } finally {
      setSaving(false);
    }
  };

  const cancelChanges = async () => {
    if (saving) return;
    setSuccess('');
    setDraggedInvestorRecord(null);
    setExpandedTiers(new Set());
    setExpandedMilestones(new Set());
    const restored = await loadContent();
    if (restored) setSuccess('All unsaved Investors changes were discarded.');
  };

  if (loading) return <LoadingPanel />;
  if (!content) return <Message error={error || 'Investor content is unavailable.'} />;

  return (
    <div className="admin-page-content-editor">
      <EditorHeader title="Investors Page" description="Edit the public investor overview, strategy, roadmap, and partner call-to-action." publicPath="/investors" saving={saving} onSave={saveContent} onCancel={cancelChanges} />
      <Message error={error} success={success} />

      <section className="admin-content-panel">
        <h3>Company Overview &amp; Vision</h3>
        <div className="admin-content-form-grid two-column">
          <label>Page title<input value={content.overview.page_title || ''} onChange={(e) => updateObject('overview', 'page_title', e.target.value)} /></label>
          <label>Page subtitle<input value={content.overview.page_subtitle || ''} onChange={(e) => updateObject('overview', 'page_subtitle', e.target.value)} /></label>
          <label>Section title<input value={content.overview.section_title || ''} onChange={(e) => updateObject('overview', 'section_title', e.target.value)} /></label>
          <label className="admin-content-checkbox standalone"><input type="checkbox" checked={content.overview.is_active !== false} onChange={(e) => updateObject('overview', 'is_active', e.target.checked)} />Active</label>
          <RichTextField label="Company overview content" value={content.overview.paragraphs} onChange={(value) => updateObject('overview', 'paragraphs', value)} />
          <ImageUploadField label="Right-side image" value={content.overview.image_url} alt={content.overview.image_alt} onChange={(value) => updateObject('overview', 'image_url', value)} />
          <label>Image alternative text<input value={content.overview.image_alt || ''} onChange={(e) => updateObject('overview', 'image_alt', e.target.value)} /></label>
        </div>
      </section>

      <section className="admin-content-panel">
        <div className="admin-content-panel-title"><h3>{content.overview.strategy_section_title || 'Our Three-Tiered Strategy'}</h3><button type="button" className="admin-btn-secondary" onClick={addTier}>Add tier</button></div>
        <div className="admin-content-form-grid admin-investor-section-title-field">
          <label>Section title<input value={content.overview.strategy_section_title || ''} onChange={(e) => updateObject('overview', 'strategy_section_title', e.target.value)} /></label>
        </div>
        <div className="admin-content-record-list">
          {content.strategy_tiers.map((tier, index) => (
            <RecordCard
              key={editorRecordKey('tier', tier, index)}
              title={tier.title || `New tier ${index + 1}`}
              onRemove={() => removeRow('strategy_tiers', index)}
              collapsible
              expanded={expandedTiers.has(editorRecordKey('tier', tier, index))}
              onToggle={() => toggleRecord(setExpandedTiers, editorRecordKey('tier', tier, index))}
              dragHandleLabel={`Drag ${tier.title || `strategy tier ${index + 1}`} to reorder`}
              isDragging={draggedInvestorRecord?.section === 'strategy_tiers' && draggedInvestorRecord.index === index}
              onDragStart={(event) => startRecordDrag(event, 'strategy_tiers', index)}
              onDragEnd={() => setDraggedInvestorRecord(null)}
              onDragOver={(event) => {
                if (draggedInvestorRecord?.section === 'strategy_tiers') event.preventDefault();
              }}
              onDrop={(event) => dropRecord(event, 'strategy_tiers', index)}
            >
              <div className="admin-content-form-grid three-column">
                <label>
                  Icon
                  <select value={tier.icon || INVESTOR_ICON_OPTIONS[0].value} onChange={(e) => updateRow('strategy_tiers', index, 'icon', e.target.value)}>
                    {INVESTOR_ICON_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.value} {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>Title<input value={tier.title || ''} onChange={(e) => updateRow('strategy_tiers', index, 'title', e.target.value)} /></label>
                <label>Subtitle<input value={tier.subtitle || ''} onChange={(e) => updateRow('strategy_tiers', index, 'subtitle', e.target.value)} /></label>
                <RichTextField label="Card items" value={tier.items} list onChange={(value) => updateRow('strategy_tiers', index, 'items', value)} />
                <RichTextValueField label="Note" value={tier.note} onChange={(value) => updateRow('strategy_tiers', index, 'note', value)} />
              </div>
              <ActiveOrderFields item={tier} onChange={(field, value) => updateRow('strategy_tiers', index, field, value)} />
            </RecordCard>
          ))}
        </div>
      </section>

      <section className="admin-content-panel">
        <div className="admin-content-panel-title"><h3>{content.overview.roadmap_section_title || 'Development Roadmap & Milestones'}</h3><button type="button" className="admin-btn-secondary" onClick={addMilestone}>Add milestone</button></div>
        <div className="admin-content-form-grid admin-investor-section-title-field">
          <label>Section title<input value={content.overview.roadmap_section_title || ''} onChange={(e) => updateObject('overview', 'roadmap_section_title', e.target.value)} /></label>
        </div>
        <div className="admin-content-record-list">
          {content.milestones.map((milestone, index) => (
            <RecordCard
              key={editorRecordKey('milestone', milestone, index)}
              title={milestone.phase || `New milestone ${index + 1}`}
              onRemove={() => removeRow('milestones', index)}
              collapsible
              expanded={expandedMilestones.has(editorRecordKey('milestone', milestone, index))}
              onToggle={() => toggleRecord(setExpandedMilestones, editorRecordKey('milestone', milestone, index))}
              dragHandleLabel={`Drag ${milestone.phase || `milestone ${index + 1}`} to reorder`}
              isDragging={draggedInvestorRecord?.section === 'milestones' && draggedInvestorRecord.index === index}
              onDragStart={(event) => startRecordDrag(event, 'milestones', index)}
              onDragEnd={() => setDraggedInvestorRecord(null)}
              onDragOver={(event) => {
                if (draggedInvestorRecord?.section === 'milestones') event.preventDefault();
              }}
              onDrop={(event) => dropRecord(event, 'milestones', index)}
            >
              <div className="admin-content-form-grid two-column">
                <label>Phase<input value={milestone.phase || ''} onChange={(e) => updateRow('milestones', index, 'phase', e.target.value)} /></label>
                <label>Period &amp; funding<input value={milestone.period_and_funding || ''} onChange={(e) => updateRow('milestones', index, 'period_and_funding', e.target.value)} /></label>
                <RichTextValueField label="Goal" value={milestone.goal} onChange={(value) => updateRow('milestones', index, 'goal', value)} />
              </div>
              <ActiveOrderFields item={milestone} onChange={(field, value) => updateRow('milestones', index, field, value)} />
            </RecordCard>
          ))}
        </div>
      </section>

      <section className="admin-content-panel">
        <h3>Partner with BioArk</h3>
        <div className="admin-content-form-grid two-column">
          <label>Section title<input value={content.partner.section_title || ''} onChange={(e) => updateObject('partner', 'section_title', e.target.value)} /></label>
          <label>Contact email<input type="email" value={content.partner.contact_email || ''} onChange={(e) => updateObject('partner', 'contact_email', e.target.value)} /></label>
          <RichTextValueField label="Description" value={content.partner.text} onChange={(value) => updateObject('partner', 'text', value)} />
          <label>Button text<input value={content.partner.button_text || ''} onChange={(e) => updateObject('partner', 'button_text', e.target.value)} /></label>
          <label>Button URL<input value={content.partner.button_url || ''} onChange={(e) => updateObject('partner', 'button_url', e.target.value)} /></label>
          <label>Button target<select value={content.partner.button_target || '_self'} onChange={(e) => updateObject('partner', 'button_target', e.target.value)}><option value="_self">Same tab</option><option value="_blank">New tab</option></select></label>
          <label>Button style<input value={content.partner.button_style || ''} onChange={(e) => updateObject('partner', 'button_style', e.target.value)} placeholder="primary" /></label>
          <label className="admin-content-checkbox standalone"><input type="checkbox" checked={content.partner.is_active !== false} onChange={(e) => updateObject('partner', 'is_active', e.target.checked)} />Active</label>
        </div>
      </section>

      <div className="admin-content-bottom-save">
        <button type="button" className="admin-btn-secondary" onClick={cancelChanges} disabled={saving}>Cancel</button>
        <button type="button" className="admin-btn-primary" onClick={saveContent} disabled={saving}>{saving ? 'Saving...' : 'Save all changes'}</button>
      </div>
    </div>
  );
}
