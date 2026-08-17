import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../utils/api';


const emptyGene = {
  target_sequence: '',
  gene_name: '',
  abbreviation: '',
  symbol: '',
  locus_id: '',
  species: '',
  description: '',
  reference_link: '',
};

const emptyPrice = {
  function_type_code: 'Others',
  delivery_type_code: '',
  target_gene_code: '',
  format_type_id: '',
  unit_amount: '',
  shelf_status: false,
  unit_label: 'Kit',
  quote_only: false,
  list_price: '',
  discount_price: '',
};

function Pagination({ page, totalPages, total, label, onChange }) {
  if (totalPages <= 1 && total === 0) return null;
  return (
    <div className="admin-pagination">
      <button
        type="button"
        className="admin-page-btn"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </button>
      <span className="admin-page-info">Page {page} of {Math.max(1, totalPages)} ({total.toLocaleString()} {label})</span>
      <button
        type="button"
        className="admin-page-btn"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}

function EditorModal({ title, value, onChange, onClose, onSave, saving, error, children, wide = false }) {
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className={`admin-modal ${wide ? 'admin-modal-lg' : ''}`} onClick={(event) => event.stopPropagation()}>
        <div className="admin-modal-header">
          <h3>{title}</h3>
          <button type="button" className="admin-modal-close" aria-label="Close" onClick={onClose}>×</button>
        </div>
        <form className="admin-modal-body" onSubmit={onSave}>
          {error && <div className="admin-alert error">{error}</div>}
          <div className="admin-form-grid">
            {children(value, onChange)}
          </div>
          <div className="admin-modal-footer">
            <button type="button" className="secondary-admin-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? 'Saving...' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AdminGeneDatabase() {
  const [data, setData] = useState({ results: [], total: 0, page: 1, total_pages: 0, species: [] });
  const [page, setPage] = useState(1);
  const [queryDraft, setQueryDraft] = useState('');
  const [query, setQuery] = useState('');
  const [species, setSpecies] = useState('');
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadGenes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), page_size: '50' });
      if (query) params.set('q', query);
      if (species) params.set('species', species);
      setData(await apiFetch(`/api/admin-panel/gene-library/?${params.toString()}`));
    } catch (err) {
      setError(err.message || 'Unable to load the Gene Database.');
    } finally {
      setLoading(false);
    }
  }, [page, query, species]);

  useEffect(() => { loadGenes(); }, [loadGenes]);

  const submitSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setQuery(queryDraft.trim());
  };

  const updateEditing = (field, value) => setEditing((current) => ({ ...current, [field]: value }));

  const saveGene = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const endpoint = editing.id
        ? `/api/admin-panel/gene-library/${editing.id}/update/`
        : '/api/admin-panel/gene-library/create/';
      await apiFetch(endpoint, { method: 'POST', body: editing });
      setSuccess(editing.id ? 'Gene record updated.' : 'Gene record created.');
      setEditing(null);
      await loadGenes();
    } catch (err) {
      setError(err.message || 'Unable to save the gene record.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="admin-section-header admin-gene-section-header">
        <div>
          <h2 id="admin-content-title">Gene Database</h2>
          <p>Manage the target genes available in Gene Design Step 5.</p>
        </div>
        <button type="button" className="primary-button" onClick={() => { setError(''); setSuccess(''); setEditing({ ...emptyGene }); }}>+ Add Gene</button>
      </div>

      <form className="admin-gene-toolbar" onSubmit={submitSearch}>
        <div className="admin-search-box">
          <input
            type="search"
            placeholder="Search sequence, name, symbol, locus, or description..."
            value={queryDraft}
            onChange={(event) => setQueryDraft(event.target.value)}
          />
        </div>
        <select value={species} onChange={(event) => { setSpecies(event.target.value); setPage(1); }}>
          <option value="">All species</option>
          {(data.species || []).map((item) => <option value={item} key={item}>{item}</option>)}
        </select>
        <button type="submit" className="secondary-admin-button">Search</button>
        {(query || species) && (
          <button
            type="button"
            className="admin-action-btn"
            onClick={() => { setQueryDraft(''); setQuery(''); setSpecies(''); setPage(1); }}
          >
            Clear
          </button>
        )}
      </form>

      {success && <div className="admin-alert success">{success}</div>}
      {error && <div className="admin-alert error">{error}</div>}

      {loading ? (
        <div className="admin-empty-table">Loading gene records...</div>
      ) : data.results.length === 0 ? (
        <div className="admin-empty-table">No gene records match the current filters.</div>
      ) : (
        <div className="admin-data-table-wrap">
          <table className="admin-data-table admin-gene-table">
            <thead>
              <tr>
                <th>Target Sequence</th>
                <th>Gene Name</th>
                <th>Symbol</th>
                <th>Species</th>
                <th>Locus ID</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((gene) => (
                <tr key={gene.id}>
                  <td><code>{gene.target_sequence}</code></td>
                  <td><strong>{gene.gene_name}</strong>{gene.abbreviation && <span className="admin-gene-secondary">{gene.abbreviation}</span>}</td>
                  <td>{gene.symbol}</td>
                  <td>{gene.species || '—'}</td>
                  <td>{gene.locus_id || '—'}</td>
                  <td><span className="admin-gene-description">{gene.description || '—'}</span></td>
                  <td><button type="button" className="admin-action-btn edit" onClick={() => { setError(''); setSuccess(''); setEditing({ ...gene }); }}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={data.page || page} totalPages={data.total_pages || 0} total={data.total || 0} label="genes" onChange={setPage} />

      {editing && (
        <EditorModal
          title={editing.id ? 'Edit Gene Record' : 'Create Gene Record'}
          value={editing}
          onChange={updateEditing}
          onClose={() => setEditing(null)}
          onSave={saveGene}
          saving={saving}
          error={error}
          wide
        >
          {(value, onChange) => (
            <>
              <label className="admin-form-field"><span>Target Sequence *</span><input maxLength="6" value={value.target_sequence || ''} onChange={(event) => onChange('target_sequence', event.target.value.toUpperCase())} required /></label>
              <label className="admin-form-field"><span>Gene Name *</span><input value={value.gene_name || ''} onChange={(event) => onChange('gene_name', event.target.value)} required /></label>
              <label className="admin-form-field"><span>Symbol *</span><input value={value.symbol || ''} onChange={(event) => onChange('symbol', event.target.value)} required /></label>
              <label className="admin-form-field"><span>Abbreviation</span><input value={value.abbreviation || ''} onChange={(event) => onChange('abbreviation', event.target.value)} /></label>
              <label className="admin-form-field"><span>Locus ID</span><input type="number" value={value.locus_id ?? ''} onChange={(event) => onChange('locus_id', event.target.value)} /></label>
              <label className="admin-form-field"><span>Species</span><input list="gene-species-options" value={value.species || ''} onChange={(event) => onChange('species', event.target.value)} /><datalist id="gene-species-options">{(data.species || []).map((item) => <option value={item} key={item} />)}</datalist></label>
              <label className="admin-form-field span-2"><span>Description</span><textarea rows="4" value={value.description || ''} onChange={(event) => onChange('description', event.target.value)} /></label>
              <label className="admin-form-field span-2"><span>Reference Link</span><input type="url" value={value.reference_link || ''} onChange={(event) => onChange('reference_link', event.target.value)} placeholder="https://" /></label>
            </>
          )}
        </EditorModal>
      )}
    </>
  );
}


export function AdminGenePricing() {
  const [data, setData] = useState({ results: [], total: 0, page: 1, total_pages: 0, metadata: {} });
  const [page, setPage] = useState(1);
  const [queryDraft, setQueryDraft] = useState('');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ function_type: '', delivery_type: '', format_type: '' });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadPrices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), page_size: '50' });
      if (query) params.set('q', query);
      Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
      setData(await apiFetch(`/api/admin-panel/gene-design-prices/?${params.toString()}`));
    } catch (err) {
      setError(err.message || 'Unable to load Gene Design pricing.');
    } finally {
      setLoading(false);
    }
  }, [filters, page, query]);

  useEffect(() => { loadPrices(); }, [loadPrices]);

  const metadata = data.metadata || {};
  const formatTypes = metadata.format_types || [];
  const selectedFormat = useMemo(() => formatTypes.find((item) => (
    String(item.id) === String(editing?.format_type_id)
  )), [editing?.format_type_id, formatTypes]);

  const startCreate = () => {
    setError('');
    setSuccess('');
    const firstDelivery = metadata.delivery_types?.[0]?.code || '';
    const firstFormat = formatTypes[0];
    setEditing({
      ...emptyPrice,
      delivery_type_code: firstDelivery,
      format_type_id: firstFormat?.id || '',
      unit_amount: firstFormat?.options?.[0] || '',
    });
  };

  const updateEditing = (field, value) => {
    setEditing((current) => {
      const next = { ...current, [field]: value };
      if (field === 'format_type_id') {
        const format = formatTypes.find((item) => String(item.id) === String(value));
        next.unit_amount = format?.options?.[0] || '';
      }
      if (field === 'quote_only' && value) {
        next.list_price = '';
        next.discount_price = '';
      }
      return next;
    });
  };

  const savePrice = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const endpoint = editing.id
        ? `/api/admin-panel/gene-design-prices/${editing.id}/update/`
        : '/api/admin-panel/gene-design-prices/create/';
      await apiFetch(endpoint, { method: 'POST', body: editing });
      setSuccess(editing.id ? 'Pricing record updated.' : 'Pricing record created.');
      setEditing(null);
      await loadPrices();
    } catch (err) {
      setError(err.message || 'Unable to save the pricing record.');
    } finally {
      setSaving(false);
    }
  };

  const setFilter = (field, value) => {
    setFilters((current) => ({ ...current, [field]: value }));
    setPage(1);
  };

  return (
    <>
      <div className="admin-section-header admin-gene-section-header">
        <div>
          <h2 id="admin-content-title">Pricing Tables</h2>
          <p>Manage the backend lookup rules used after Gene Design Step 6.</p>
        </div>
        <button type="button" className="primary-button" disabled={loading || formatTypes.length === 0} onClick={startCreate}>+ Add Price Record</button>
      </div>

      <form className="admin-gene-toolbar admin-gene-price-toolbar" onSubmit={(event) => { event.preventDefault(); setQuery(queryDraft.trim()); setPage(1); }}>
        <div className="admin-search-box"><input type="search" placeholder="Search Step 5 code, format, or unit..." value={queryDraft} onChange={(event) => setQueryDraft(event.target.value)} /></div>
        <select value={filters.function_type} onChange={(event) => setFilter('function_type', event.target.value)}><option value="">All functions</option>{(metadata.function_types || []).map((item) => <option value={item.code} key={item.code}>{item.code}</option>)}</select>
        <select value={filters.delivery_type} onChange={(event) => setFilter('delivery_type', event.target.value)}><option value="">All delivery types</option>{(metadata.delivery_types || []).map((item) => <option value={item.code} key={item.code}>{item.code} — {item.name}</option>)}</select>
        <select value={filters.format_type} onChange={(event) => setFilter('format_type', event.target.value)}><option value="">All formats</option>{formatTypes.map((item) => <option value={item.code} key={item.code}>{item.name}</option>)}</select>
        <button type="submit" className="secondary-admin-button">Search</button>
      </form>

      {success && <div className="admin-alert success">{success}</div>}
      {error && <div className="admin-alert error">{error}</div>}

      {loading ? (
        <div className="admin-empty-table">Loading pricing records...</div>
      ) : data.results.length === 0 ? (
        <div className="admin-empty-table">No pricing records match the current filters.</div>
      ) : (
        <div className="admin-data-table-wrap">
          <table className="admin-data-table admin-gene-price-table">
            <thead><tr><th>Function</th><th>Delivery</th><th>Step 5 Code</th><th>Format / Unit</th><th>Shelf</th><th>Pricing</th><th>Actions</th></tr></thead>
            <tbody>
              {data.results.map((price) => (
                <tr key={price.id}>
                  <td><code>{price.function_type_code}</code></td>
                  <td><code>{price.delivery_type_code}</code></td>
                  <td><code>{price.target_gene_code || 'N/A'}</code></td>
                  <td><strong>{price.format_name}</strong><span className="admin-gene-secondary">{price.unit_amount}</span></td>
                  <td><span className={`admin-badge ${price.shelf_status ? 'badge-success' : 'badge-default'}`}>{price.shelf_status ? 'On Shelf' : 'Custom'}</span></td>
                  <td>{price.quote_only ? <span className="admin-badge badge-accent">Quote Only</span> : <><strong>${price.discount_price || price.list_price}</strong>{price.discount_price && <span className="admin-gene-secondary">List ${price.list_price}</span>}</>}</td>
                  <td><button type="button" className="admin-action-btn edit" onClick={() => { setError(''); setSuccess(''); setEditing({ ...price }); }}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={data.page || page} totalPages={data.total_pages || 0} total={data.total || 0} label="price records" onChange={setPage} />

      {editing && (
        <EditorModal title={editing.id ? 'Edit Price Record' : 'Create Price Record'} value={editing} onChange={updateEditing} onClose={() => setEditing(null)} onSave={savePrice} saving={saving} error={error} wide>
          {(value, onChange) => (
            <>
              <label className="admin-form-field"><span>Function Type *</span><select value={value.function_type_code} onChange={(event) => onChange('function_type_code', event.target.value)} required>{(metadata.function_types || []).map((item) => <option value={item.code} key={item.code}>{item.name}</option>)}</select></label>
              <label className="admin-form-field"><span>Delivery Type *</span><select value={value.delivery_type_code} onChange={(event) => onChange('delivery_type_code', event.target.value)} required>{(metadata.delivery_types || []).map((item) => <option value={item.code} key={item.code}>{item.code} — {item.name}</option>)}</select></label>
              <label className="admin-form-field"><span>Step 5 Code</span><select value={value.target_gene_code || ''} onChange={(event) => onChange('target_gene_code', event.target.value)}><option value="">N/A — Ignore Step 5</option><option value="000000">000000 — Control</option><option value="xxxxxx">xxxxxx — Non-insert</option><option value="######">###### — Specific gene</option></select><small>N/A ignores Step 5 for this rule.</small></label>
              <label className="admin-form-field"><span>Format Type *</span><select value={value.format_type_id} onChange={(event) => onChange('format_type_id', event.target.value)} required>{formatTypes.map((item) => <option value={item.id} key={item.id}>{item.code} — {item.name}</option>)}</select></label>
              <label className="admin-form-field"><span>Unit Amount *</span><select value={value.unit_amount} onChange={(event) => onChange('unit_amount', event.target.value)} required>{(selectedFormat?.options || []).map((option) => <option value={option} key={option}>{option}</option>)}</select></label>
              <label className="admin-form-field"><span>Unit Label *</span><input value={value.unit_label || ''} onChange={(event) => onChange('unit_label', event.target.value)} required /></label>
              <label className="admin-form-field"><span>List Price (USD) *</span><input type="number" min="0" step="0.01" disabled={value.quote_only} value={value.list_price || ''} onChange={(event) => onChange('list_price', event.target.value)} required={!value.quote_only} /></label>
              <label className="admin-form-field"><span>Discount Price (USD)</span><input type="number" min="0" step="0.01" disabled={value.quote_only} value={value.discount_price || ''} onChange={(event) => onChange('discount_price', event.target.value)} /></label>
              <label className="admin-toggle"><input type="checkbox" checked={!!value.shelf_status} onChange={(event) => onChange('shelf_status', event.target.checked)} /><span>On-Shelf backend price</span></label>
              <label className="admin-toggle"><input type="checkbox" checked={!!value.quote_only} onChange={(event) => onChange('quote_only', event.target.checked)} /><span>Quote Only</span></label>
            </>
          )}
        </EditorModal>
      )}
    </>
  );
}
