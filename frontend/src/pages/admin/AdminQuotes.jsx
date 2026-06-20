import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../utils/api';

function AdminQuotes() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedQuote, setExpandedQuote] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [filterRead, setFilterRead] = useState('all');

  const loadQuotes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/admin-panel/quotes/');
      setQuotes(data.results || data.quotes || []);
    } catch (err) {
      setError(err.message || 'Failed to load quotes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadQuotes(); }, [loadQuotes]);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleToggleRead = async (quoteId) => {
    try {
      await apiFetch(`/api/admin-panel/quotes/${quoteId}/mark-read/`, { method: 'POST' });
      showSuccess('Quote status updated.');
      loadQuotes();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (quoteId) => {
    if (!confirm('Are you sure you want to delete this quote request?')) return;
    try {
      await apiFetch(`/api/admin-panel/quotes/${quoteId}/delete/`, { method: 'POST' });
      showSuccess('Quote deleted.');
      loadQuotes();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  const filtered = quotes.filter(q => {
    if (filterRead === 'unread') return !q.read;
    if (filterRead === 'read') return q.read;
    return true;
  });

  return (
    <>
      <div className="admin-section-header">
        <h2 id="admin-content-title">Quote Requests</h2>
        <div className="admin-section-actions">
          <div className="admin-filter-group">
            <button 
              className={`admin-filter-btn ${filterRead === 'all' ? 'active' : ''}`}
              onClick={() => setFilterRead('all')}
            >All ({quotes.length})</button>
            <button 
              className={`admin-filter-btn ${filterRead === 'unread' ? 'active' : ''}`}
              onClick={() => setFilterRead('unread')}
            >Unread ({quotes.filter(q => !q.read).length})</button>
            <button 
              className={`admin-filter-btn ${filterRead === 'read' ? 'active' : ''}`}
              onClick={() => setFilterRead('read')}
            >Read ({quotes.filter(q => q.read).length})</button>
          </div>
        </div>
      </div>

      {successMsg && <div className="admin-alert success">{successMsg}</div>}
      {error && <div className="admin-alert error">{error}</div>}

      {loading ? (
        <div className="admin-empty-table">Loading quotes...</div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty-table">No quote requests found.</div>
      ) : (
        <div className="admin-quotes-list">
          {filtered.map((quote) => (
            <div key={quote.id} className={`admin-quote-item ${!quote.read ? 'unread' : ''}`}>
              <div className="admin-quote-header" onClick={() => setExpandedQuote(expandedQuote === quote.id ? null : quote.id)}>
                <div className="admin-quote-info">
                  {!quote.read && <span className="admin-unread-dot" />}
                  <div>
                    <strong>{quote.first_name} {quote.last_name}</strong>
                    <span className="admin-quote-email">{quote.email}</span>
                  </div>
                </div>
                <div className="admin-quote-meta">
                  {quote.service_type && <span className="admin-badge badge-default">{quote.service_type}</span>}
                  <span className="admin-quote-date">{formatDate(quote.created_at)}</span>
                  <span className="admin-chevron">{expandedQuote === quote.id ? '▲' : '▼'}</span>
                </div>
              </div>
              {expandedQuote === quote.id && (
                <div className="admin-quote-details">
                  <div className="admin-quote-grid">
                    {quote.phone && <div><strong>Phone:</strong> {quote.phone}</div>}
                    {quote.company && <div><strong>Company:</strong> {quote.company}</div>}
                    {quote.department && <div><strong>Department:</strong> {quote.department}</div>}
                    {quote.timeline && <div><strong>Timeline:</strong> {quote.timeline}</div>}
                    {quote.budget && <div><strong>Budget:</strong> {quote.budget}</div>}
                    {quote.external_id && <div><strong>External ID:</strong> {quote.external_id}</div>}
                  </div>
                  {quote.project_description && (
                    <div className="admin-quote-desc">
                      <strong>Project Description:</strong>
                      <p>{quote.project_description}</p>
                    </div>
                  )}
                  {quote.additional_info && (
                    <div className="admin-quote-desc">
                      <strong>Additional Info:</strong>
                      <p>{quote.additional_info}</p>
                    </div>
                  )}
                  <div className="admin-row-actions">
                    <button className="admin-action-btn toggle" onClick={() => handleToggleRead(quote.id)}>
                      {quote.read ? 'Mark Unread' : 'Mark Read'}
                    </button>
                    <button className="admin-action-btn delete" onClick={() => handleDelete(quote.id)}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default AdminQuotes;
