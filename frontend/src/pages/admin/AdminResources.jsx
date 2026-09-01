import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch, API_URL, formatAssetUrl } from '../../utils/api';

const DEFAULT_LEVEL_1 = 'Product Documents';
const DEFAULT_LEVEL_2 = 'Product Manual';
const fieldStyle = { padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 8, background: '#fff', fontSize: 13, fontFamily: 'inherit' };

function AdminResources() {
  const [resources, setResources] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editor, setEditor] = useState(null);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [manageGroups, setManageGroups] = useState(false);
  const [groupEditor, setGroupEditor] = useState(null);
  const [groupSaving, setGroupSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [level1Filter, setLevel1Filter] = useState('All');
  const [level2Filter, setLevel2Filter] = useState('All');
  const [sort, setSort] = useState({ field: 'date_created', order: 'desc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [collapsedLevel1Groups, setCollapsedLevel1Groups] = useState(() => new Set());
  const [collapsedLevel2Groups, setCollapsedLevel2Groups] = useState(() => new Set());
  const [preview, setPreview] = useState(null);

  const loadData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError('');
    try {
      const [documents, hierarchy] = await Promise.all([
        apiFetch('/api/admin-panel/resources/'),
        apiFetch('/api/admin-panel/resource-groups/'),
      ]);
      setResources(documents.results || []);
      setGroups(hierarchy.results || []);
    } catch (err) {
      setError(err.message || 'Failed to load resource documents.');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial synchronization with the Resource Documents API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const flash = (message) => {
    setSuccess(message);
    window.setTimeout(() => setSuccess(''), 3000);
  };

  const defaults = useMemo(() => {
    const level1 = groups.find((item) => item.name === DEFAULT_LEVEL_1) || groups[0];
    const level2 = level1?.subgroups?.find((item) => item.name === DEFAULT_LEVEL_2) || level1?.subgroups?.[0];
    return { level1: level1?.id || '', level2: level2?.id || '' };
  }, [groups]);

  const selectedEditorGroup = groups.find((item) => String(item.id) === String(editor?.level_1_group_id));

  const startCreate = () => {
    if (!defaults.level2) {
      setError('Create a Level 1 group and a Level 2 group before adding a document.');
      setManageGroups(true);
      return;
    }
    setEditor({ name: '', description: '', download_url: '', level_1_group_id: defaults.level1, level_2_group_id: defaults.level2 });
    setFile(null);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startEdit = async (id) => {
    try {
      setError('');
      setEditor(await apiFetch(`/api/admin-panel/resources/${id}/`));
      setFile(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) { setError(err.message); }
  };

  const saveDocument = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const isNew = !editor.id;
      const endpoint = isNew ? '/api/admin-panel/resources/create/' : `/api/admin-panel/resources/${editor.id}/update/`;
      const values = {
        name: editor.name,
        level_2_group_id: editor.level_2_group_id,
        description: editor.description || '',
        download_url: editor.download_url || '',
      };
      if (file) {
        const data = new FormData();
        Object.entries(values).forEach(([key, value]) => data.append(key, value));
        data.append('file', file);
        let csrf = document.cookie.split('; ').find((row) => row.startsWith('csrftoken='))?.split('=')[1];
        if (!csrf) csrf = (await (await fetch(`${API_URL}/api/csrf/`, { credentials: 'include' })).json()).csrftoken;
        const response = await fetch(`${API_URL}${endpoint}`, { method: 'POST', credentials: 'include', headers: { 'X-CSRFToken': csrf }, body: data });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || body.detail || 'Failed to save document.');
        }
      } else {
        await apiFetch(endpoint, { method: 'POST', body: values });
      }
      flash(isNew ? 'Document created!' : 'Document updated!');
      setEditor(null);
      setFile(null);
      await loadData(false);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const deleteDocument = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await apiFetch(`/api/admin-panel/resources/${id}/delete/`, { method: 'POST' });
      flash('Document deleted.');
      await loadData(false);
    } catch (err) { setError(err.message); }
  };

  const chooseLevel1 = (id) => {
    const group = groups.find((item) => String(item.id) === String(id));
    setEditor((current) => ({ ...current, level_1_group_id: id, level_2_group_id: group?.subgroups?.[0]?.id || '' }));
  };

  const editLevel1 = (item) => setGroupEditor({ type: 'level1', id: item?.id, name: item?.name || '', display_order: item?.display_order || 0 });
  const editLevel2 = (parentId, item) => setGroupEditor({ type: 'level2', id: item?.id, name: item?.name || '', display_order: item?.display_order || 0, level_1_group_id: parentId });

  const saveGroup = async (event) => {
    event.preventDefault();
    setGroupSaving(true);
    setError('');
    try {
      const base = groupEditor.type === 'level1' ? 'resource-groups' : 'resource-subgroups';
      const endpoint = groupEditor.id ? `/api/admin-panel/${base}/${groupEditor.id}/update/` : `/api/admin-panel/${base}/create/`;
      await apiFetch(endpoint, { method: 'POST', body: groupEditor });
      flash(`${groupEditor.type === 'level1' ? 'Level 1' : 'Level 2'} group ${groupEditor.id ? 'updated' : 'created'}.`);
      setGroupEditor(null);
      await loadData(false);
    } catch (err) { setError(err.message); }
    finally { setGroupSaving(false); }
  };

  const filterSubgroups = useMemo(() => level1Filter === 'All'
    ? groups.flatMap((group) => group.subgroups || [])
    : groups.find((group) => String(group.id) === level1Filter)?.subgroups || [], [groups, level1Filter]);

  const activeLevel2Filter = level2Filter === 'All'
    || filterSubgroups.some((item) => String(item.id) === level2Filter)
    ? level2Filter
    : 'All';

  const visible = useMemo(() => resources.filter((item) => {
    const text = `${item.name || ''} ${item.level_1_group || ''} ${item.level_2_group || ''} ${item.description || ''}`.toLowerCase();
    return (level1Filter === 'All' || String(item.level_1_group_id) === level1Filter)
      && (activeLevel2Filter === 'All' || String(item.level_2_group_id) === activeLevel2Filter)
      && text.includes(search.trim().toLowerCase());
  }).sort((a, b) => {
    let left = a[sort.field] || '';
    let right = b[sort.field] || '';
    if (typeof left === 'string') { left = left.toLowerCase(); right = String(right).toLowerCase(); }
    return left === right ? 0 : (left < right ? -1 : 1) * (sort.order === 'asc' ? 1 : -1);
  }), [resources, level1Filter, activeLevel2Filter, search, sort]);

  const pages = Math.ceil(visible.length / pageSize);
  const rows = visible.slice((page - 1) * pageSize, page * pageSize);
  const groupedRows = useMemo(() => groups.map((level1) => {
    const level2Groups = (level1.subgroups || []).map((level2) => ({
      ...level2,
      documents: rows.filter((document) => String(document.level_2_group_id) === String(level2.id)),
    })).filter((level2) => level2.documents.length > 0);

    return {
      ...level1,
      level2Groups,
      documentCount: level2Groups.reduce((count, level2) => count + level2.documents.length, 0),
    };
  }).filter((level1) => level1.documentCount > 0), [groups, rows]);

  const toggleLevel1Group = (groupId) => {
    setCollapsedLevel1Groups((current) => {
      const next = new Set(current);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const toggleLevel2Group = (groupId) => {
    setCollapsedLevel2Groups((current) => {
      const next = new Set(current);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const toggleSort = (field) => {
    setSort((current) => current.field === field ? { field, order: current.order === 'asc' ? 'desc' : 'asc' } : { field, order: 'asc' });
    setPage(1);
  };
  const marker = (field) => sort.field === field ? (sort.order === 'asc' ? ' ↑' : ' ↓') : ' ↕';

  if (editor) return (
    <div className="admin-blog-editor-page">
      <div className="admin-editor-header">
        <div><button type="button" className="admin-back-button" onClick={() => { setEditor(null); setFile(null); setError(''); }}>Back to Documents</button><h2 id="admin-content-title">{editor.id ? 'Edit Document' : 'Create Document'}</h2></div>
        <div className="admin-editor-header-actions"><button type="button" className="secondary-admin-button" onClick={() => setEditor(null)}>Cancel</button><button type="submit" form="resource-form" className="primary-button" disabled={saving}>{saving ? 'Saving...' : 'Save Document'}</button></div>
      </div>
      {error && <div className="admin-alert error">{error}</div>}
      <form id="resource-form" onSubmit={saveDocument} className="admin-editor-panel">
        <div className="admin-form-grid">
          <label className="admin-form-field"><span>Document Name *</span><input required maxLength="200" value={editor.name || ''} onChange={(event) => setEditor({ ...editor, name: event.target.value })} /></label>
          <label className="admin-form-field"><span>Level 1 Group *</span><select required value={editor.level_1_group_id || ''} onChange={(event) => chooseLevel1(event.target.value)}><option value="" disabled>Select Level 1</option>{groups.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="admin-form-field"><span>Level 2 Group *</span><select required value={editor.level_2_group_id || ''} onChange={(event) => setEditor({ ...editor, level_2_group_id: event.target.value })}><option value="" disabled>Select Level 2</option>{(selectedEditorGroup?.subgroups || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="admin-form-field span-3"><span>Description</span><input maxLength="500" value={editor.description || ''} onChange={(event) => setEditor({ ...editor, description: event.target.value })} /></label>
          <label className="admin-form-field span-3"><span>Download URL (optional when uploading a file)</span><input maxLength="500" value={editor.download_url || ''} onChange={(event) => setEditor({ ...editor, download_url: event.target.value })} /></label>
          <label className="admin-form-field span-3"><span>Upload File</span><input type="file" onChange={(event) => setFile(event.target.files[0] || null)} />{editor.download_url && !file && <small>Current link: <a href={formatAssetUrl(editor.download_url)} target="_blank" rel="noreferrer">{editor.download_url}</a></small>}</label>
        </div>
        <div className="admin-editor-footer"><button type="button" className="secondary-admin-button" onClick={() => setEditor(null)}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? 'Saving...' : 'Save Document'}</button></div>
      </form>
    </div>
  );

  return <>
    <div className="admin-section-header"><h2 id="admin-content-title">Resource Documents</h2><div style={{ display: 'flex', gap: 10 }}><button className="secondary-admin-button" onClick={() => { setManageGroups(true); setGroupEditor(null); }}>Manage Groups</button><button className="primary-button" onClick={startCreate}>+ Add Document</button></div></div>
    {success && <div className="admin-alert success">{success}</div>}{error && <div className="admin-alert error">{error}</div>}
    <div className="admin-controls-row" style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', background: 'var(--panel)', padding: 16, borderRadius: 10, border: '1px solid var(--line)' }}>
      <input type="search" placeholder="Search documents..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} style={{ ...fieldStyle, flex: '1 1 260px' }} />
      <select value={level1Filter} onChange={(event) => { setLevel1Filter(event.target.value); setLevel2Filter('All'); setPage(1); }} style={{ ...fieldStyle, width: 190 }}><option value="All">All Level 1 Groups</option>{groups.map((item) => <option key={item.id} value={String(item.id)}>{item.name}</option>)}</select>
      <select value={activeLevel2Filter} onChange={(event) => { setLevel2Filter(event.target.value); setPage(1); }} style={{ ...fieldStyle, width: 190 }}><option value="All">All Level 2 Groups</option>{filterSubgroups.map((item) => <option key={item.id} value={String(item.id)}>{item.name}</option>)}</select>
      <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} style={{ ...fieldStyle, width: 90 }}>{[5, 10, 20, 50].map((count) => <option key={count}>{count}</option>)}</select>
    </div>
    {loading ? <div className="admin-empty-table">Loading documents...</div> : rows.length === 0 ? <div className="admin-empty-table">No matching documents found.</div> : (
      <div className="admin-grouped-products admin-resource-groups">
        {groupedRows.map((level1) => {
          const isLevel1Collapsed = collapsedLevel1Groups.has(level1.id);
          return (
            <section key={level1.id} className={`admin-category-group ${isLevel1Collapsed ? 'is-collapsed' : ''}`}>
              <h3 className="admin-category-title">
                <button
                  type="button"
                  className="admin-category-toggle"
                  aria-expanded={!isLevel1Collapsed}
                  aria-controls={`resource-level-1-${level1.id}`}
                  onClick={() => toggleLevel1Group(level1.id)}
                >
                  <span className="admin-category-toggle-icon" aria-hidden="true">{isLevel1Collapsed ? '+' : '-'}</span>
                  <span>{level1.name}</span>
                </button>
                <span className="admin-category-badge">{level1.documentCount} documents</span>
              </h3>

              {!isLevel1Collapsed && (
                <div id={`resource-level-1-${level1.id}`} className="admin-category-panel">
                  {level1.level2Groups.map((level2) => {
                    const isLevel2Collapsed = collapsedLevel2Groups.has(level2.id);
                    return (
                      <div key={level2.id} className={`admin-subgroup-group ${isLevel2Collapsed ? 'is-collapsed' : ''}`}>
                        <h4 className="admin-subgroup-title">
                          <button
                            type="button"
                            className="admin-subgroup-toggle"
                            aria-expanded={!isLevel2Collapsed}
                            aria-controls={`resource-level-2-${level2.id}`}
                            onClick={() => toggleLevel2Group(level2.id)}
                          >
                            <span className="admin-category-toggle-icon" aria-hidden="true">{isLevel2Collapsed ? '+' : '-'}</span>
                            <span className="admin-subgroup-identity">
                              <span>{level2.name} ({level2.document_count ?? level2.documents.length})</span>
                            </span>
                          </button>
                        </h4>

                        {!isLevel2Collapsed && (
                          <div id={`resource-level-2-${level2.id}`} className="admin-data-table-wrap">
                            <table className="admin-data-table">
                              <thead><tr>
                                {[['name', 'Name', '30%'], ['description', 'Description', '42%'], ['date_created', 'Date', '14%']].map(([field, label, width]) => (
                                  <th key={field} onClick={() => toggleSort(field)} style={{ cursor: 'pointer', width }}>{label}{marker(field)}</th>
                                ))}
                                <th style={{ width: '14%' }}>Actions</th>
                              </tr></thead>
                              <tbody>{level2.documents.map((item) => <tr key={item.id}>
                                <td><strong>{item.name}</strong>{item.download_url && <div><button type="button" onClick={() => setPreview(formatAssetUrl(item.download_url))} style={{ border: 0, background: 'none', color: 'var(--blue)', padding: '4px 0', cursor: 'pointer', fontWeight: 600 }}>Preview Document</button></div>}</td>
                                <td>{item.description || '—'}</td>
                                <td>{item.date_created ? new Date(item.date_created).toLocaleDateString() : '—'}</td>
                                <td><div className="admin-row-actions"><button className="admin-action-btn edit" onClick={() => startEdit(item.id)}>Edit</button><button className="admin-action-btn delete" onClick={() => deleteDocument(item.id)}>Delete</button></div></td>
                              </tr>)}</tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    )}
    {pages > 1 && <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}><span>Page {page} of {pages}</span><div style={{ display: 'flex', gap: 8 }}><button className="secondary-admin-button" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><button className="secondary-admin-button" disabled={page === pages} onClick={() => setPage(page + 1)}>Next</button></div></div>}

    {manageGroups && <div className="admin-modal-overlay" onClick={() => { setManageGroups(false); setGroupEditor(null); }}><div className="admin-modal admin-modal-lg" onClick={(event) => event.stopPropagation()}>
      <div className="admin-modal-header"><div><h3>Document Groups</h3><p style={{ margin: '4px 0 0', color: 'var(--muted)' }}>Each Level 2 group belongs to one Level 1 group.</p></div><button className="admin-modal-close" onClick={() => setManageGroups(false)}>×</button></div>
      <div className="admin-modal-body"><button type="button" className="primary-button" onClick={() => editLevel1()}>+ Add Level 1 Group</button>
        {groupEditor && <form onSubmit={saveGroup} style={{ marginTop: 16, padding: 16, border: '1px solid var(--line)', borderRadius: 10, background: 'var(--panel)' }}><h4 style={{ marginTop: 0 }}>{groupEditor.id ? 'Edit' : 'Create'} {groupEditor.type === 'level1' ? 'Level 1' : 'Level 2'} Group</h4>
          {groupEditor.type === 'level2' && <label className="admin-form-field"><span>Parent Level 1 *</span><select required value={groupEditor.level_1_group_id} onChange={(event) => setGroupEditor({ ...groupEditor, level_1_group_id: event.target.value })}>{groups.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px auto', gap: 10, alignItems: 'end', marginTop: 10 }}><label className="admin-form-field"><span>Name *</span><input required maxLength="100" value={groupEditor.name} onChange={(event) => setGroupEditor({ ...groupEditor, name: event.target.value })} /></label><label className="admin-form-field"><span>Display Order</span><input type="number" min="0" value={groupEditor.display_order} onChange={(event) => setGroupEditor({ ...groupEditor, display_order: Number(event.target.value) })} /></label><div style={{ display: 'flex', gap: 8 }}><button type="button" className="secondary-admin-button" onClick={() => setGroupEditor(null)}>Cancel</button><button className="primary-button" disabled={groupSaving}>{groupSaving ? 'Saving...' : 'Save'}</button></div></div>
        </form>}
        <div style={{ display: 'grid', gap: 14, marginTop: 18 }}>{groups.map((group) => <section key={group.id} style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--panel)' }}><strong>Level 1: {group.name}</strong><div style={{ display: 'flex', gap: 8 }}><button className="admin-action-btn edit" onClick={() => editLevel1(group)}>Edit</button><button className="secondary-admin-button" onClick={() => editLevel2(group.id)}>+ Add Level 2</button></div></div><div style={{ padding: '8px 14px' }}>{group.subgroups.length === 0 ? <p style={{ color: 'var(--muted)' }}>No Level 2 groups yet.</p> : group.subgroups.map((item) => <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--line)' }}><span>Level 2: <strong>{item.name}</strong> <small style={{ color: 'var(--muted)' }}>({item.document_count} documents)</small></span><button className="admin-action-btn edit" onClick={() => editLevel2(group.id, item)}>Edit</button></div>)}</div></section>)}</div>
      </div><div className="admin-modal-footer"><button className="secondary-admin-button" onClick={() => setManageGroups(false)}>Close</button></div>
    </div></div>}
    {preview && <div onClick={() => setPreview(null)} style={{ position: 'fixed', inset: 0, zIndex: 1100, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(6,23,60,.75)' }}><div onClick={(event) => event.stopPropagation()} style={{ width: 'min(1200px,100%)', height: '85vh', background: '#fff', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}><div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--line)' }}><h3 style={{ margin: 0 }}>Document Preview</h3><button className="admin-modal-close" onClick={() => setPreview(null)}>×</button></div><iframe src={preview} title="Document Preview" style={{ flex: 1, width: '100%', border: 0 }} /></div></div>}
  </>;
}

export default AdminResources;
