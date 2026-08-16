import { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { formatRichText, hasVisibleRichText } from '../utils/richText';

const getCatalogFamily = (productType) => {
  const normalizedType = String(productType || '').toLowerCase();
  if (normalizedType === 'service') {
    return { label: 'Services', searchCategory: 'services' };
  }
  if (normalizedType === 'consumable') {
    return { label: 'Reagents', searchCategory: 'consumables' };
  }
  if (normalizedType === 'reagent') {
    return { label: 'Reagents', searchCategory: 'reagents' };
  }
  return { label: 'Products', searchCategory: 'products' };
};

function CatalogSummaryPage({ navigate, kind, externalId }) {
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError('');

    apiFetch(`/api/products/catalog-summary/${encodeURIComponent(kind)}/${encodeURIComponent(externalId)}/`)
      .then((data) => {
        if (!isMounted) return;
        setPageData(data);
        document.title = `${data.name} | BioArk Technologies`;
      })
      .catch((requestError) => {
        if (!isMounted) return;
        setError(requestError.message || 'This catalog page could not be found.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [kind, externalId]);

  if (loading) {
    return <main className="catalog-summary-page"><div className="catalog-summary-status">Loading catalog summary...</div></main>;
  }

  if (error || !pageData) {
    return (
      <main className="catalog-summary-page">
        <div className="catalog-summary-status is-error">
          <h1>Catalog page not found</h1>
          <p>{error || 'This catalog page is unavailable.'}</p>
          <button type="button" className="primary-button" onClick={() => navigate('/search')}>Browse catalog</button>
        </div>
      </main>
    );
  }

  const family = getCatalogFamily(pageData.product_type);
  const browseUrl = `/search?category=${family.searchCategory}&cat=${encodeURIComponent(pageData.category_external_id)}`;
  const isGroup = pageData.kind === 'group';
  const summaryAvailable = hasVisibleRichText(pageData.summary);

  return (
    <main className="catalog-summary-page">
      <nav className="catalog-summary-breadcrumb" aria-label="Breadcrumb">
        <a href="/" onClick={(event) => { event.preventDefault(); navigate('/'); }}>Home</a>
        <span aria-hidden="true">/</span>
        <a href={`/search?category=${family.searchCategory}`} onClick={(event) => { event.preventDefault(); navigate(`/search?category=${family.searchCategory}`); }}>
          {family.label}
        </a>
        <span aria-hidden="true">/</span>
        {isGroup && (
          <>
            <a
              href={`/catalog/category/${encodeURIComponent(pageData.category_external_id)}`}
              onClick={(event) => {
                event.preventDefault();
                navigate(`/catalog/category/${encodeURIComponent(pageData.category_external_id)}`);
              }}
            >
              {pageData.category_name}
            </a>
            <span aria-hidden="true">/</span>
          </>
        )}
        <span aria-current="page">{pageData.name}</span>
      </nav>

      <section className="catalog-summary-hero">
        <div className="catalog-summary-hero-copy">
          <span className="catalog-summary-eyebrow">{family.label} {isGroup ? 'Group' : 'Category'}</span>
          <h1>{pageData.name}</h1>
          {isGroup && <p>Part of {pageData.category_name}</p>}
        </div>
        <button type="button" className="primary-button" onClick={() => navigate(browseUrl)}>
          Browse {family.label}
        </button>
      </section>

      <article className="catalog-summary-content">
        <h2>Overview</h2>
        {summaryAvailable ? (
          <div
            className="page-rich-text catalog-summary-rich-text"
            dangerouslySetInnerHTML={{ __html: formatRichText(pageData.summary) }}
          />
        ) : (
          <p className="catalog-summary-empty">A summary has not yet been added for this {isGroup ? 'group' : 'category'}.</p>
        )}
      </article>
    </main>
  );
}

export default CatalogSummaryPage;
