import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

function MyQuotesPage({ navigate, currentUser, authChecked }) {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authChecked) {
      return;
    }

    if (!currentUser) {
      setLoading(false);
      return;
    }

    const loadQuotes = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await apiFetch('/api/quotes/my-quotes/');
        setQuotes(data.results || []);
      } catch (err) {
        setError(err.message || 'Failed to load quotes.');
      } finally {
        setLoading(false);
      }
    };

    loadQuotes();
  }, [authChecked, currentUser]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return 'N/A';

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getValue = (quote, ...keys) => {
    for (const key of keys) {
      const value = quote[key];
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        return value;
      }
    }

    return 'N/A';
  };

  return (
    <main className="customer-quotes-page">
      <section className="customer-quotes-header">
        <h1>My Quotes</h1>
      </section>

      {!authChecked || loading ? (
        <div className="customer-quotes-empty">Loading quotes...</div>
      ) : !currentUser ? (
        <div className="customer-quotes-empty">
          <h2>Please sign in to view your quotes.</h2>
          <p>Your submitted quote requests will appear here after login.</p>
        </div>
      ) : error ? (
        <div className="alert-banner error">{error}</div>
      ) : quotes.length === 0 ? (
        <div className="customer-quotes-empty">
          <h2>No quotes submitted yet.</h2>
          <p>When you request a quote, it will be listed here with its status.</p>
        </div>
      ) : (
        <div className="customer-quotes-list">
          {quotes.map((quote) => (
            <article className="customer-quote-card" key={quote.id}>
              <div className="customer-quote-card-header">
                <div>
                  <h2>{getValue(quote, 'service_type', 'serviceType')}</h2>
                  <p>{getValue(quote, 'project_description', 'projectDescription')}</p>
                </div>
                <span className={`customer-quote-status ${quote.read ? 'is-read' : 'is-unread'}`}>
                  {quote.read ? 'Read' : 'Unread'}
                </span>
              </div>
              <dl className="customer-quote-meta">
                <div>
                  <dt>Created Date</dt>
                  <dd>{formatDate(getValue(quote, 'created_at', 'createdAt'))}</dd>
                </div>
                <div>
                  <dt>Timeline</dt>
                  <dd>{getValue(quote, 'timeline')}</dd>
                </div>
                <div>
                  <dt>Budget</dt>
                  <dd>{getValue(quote, 'budget')}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

export default MyQuotesPage;
