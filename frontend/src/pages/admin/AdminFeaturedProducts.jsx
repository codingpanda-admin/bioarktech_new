import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch, formatAssetUrl } from '../../utils/api';

const FEATURED_BUCKETS = [
  { key: 'products', label: 'Products', emptyLabel: 'No featured products.' },
  { key: 'services', label: 'Services', emptyLabel: 'No featured services.' },
  { key: 'reagents', label: 'Reagents', emptyLabel: 'No featured reagents.' },
];

const normalizeBuckets = (data) => {
  const sourceBuckets = data?.buckets || {};
  const buckets = {
    products: Array.isArray(sourceBuckets.products) ? sourceBuckets.products : [],
    services: Array.isArray(sourceBuckets.services) ? sourceBuckets.services : [],
    reagents: Array.isArray(sourceBuckets.reagents) ? sourceBuckets.reagents : [],
  };

  if (!data?.buckets && Array.isArray(data?.results)) {
    data.results.forEach((item) => {
      const bucketKey = item.item_type === 'service'
        ? 'services'
        : item.item_type === 'reagent'
          ? 'reagents'
          : 'products';
      buckets[bucketKey].push(item);
    });
  }

  return buckets;
};

function AdminFeaturedProducts({ onEditItem }) {
  const [featuredBuckets, setFeaturedBuckets] = useState({ products: [], services: [], reagents: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadFeaturedItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/admin-panel/featured-products/');
      setFeaturedBuckets(normalizeBuckets(data));
    } catch (err) {
      setError(err.message || 'Failed to load featured items.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeaturedItems();
  }, [loadFeaturedItems]);

  const filteredBuckets = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return featuredBuckets;

    return Object.fromEntries(
      FEATURED_BUCKETS.map(({ key }) => [
        key,
        featuredBuckets[key].filter((item) => (
          item.product_name?.toLowerCase().includes(normalizedQuery)
          || item.catalog_number?.toLowerCase().includes(normalizedQuery)
          || item.category_name?.toLowerCase().includes(normalizedQuery)
          || item.group_name?.toLowerCase().includes(normalizedQuery)
        )),
      ]),
    );
  }, [featuredBuckets, searchQuery]);

  return (
    <>
      <div className="admin-section-header">
        <div>
          <h2 id="admin-content-title">Featured Solutions</h2>
          <p className="admin-section-description">
            Items currently featured in the homepage Featured Solutions section.
          </p>
        </div>
        <div className="admin-section-actions">
          <div className="admin-search-box">
            <input
              type="search"
              placeholder="Search featured items..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Search featured products, services, and reagents"
            />
          </div>
        </div>
      </div>

      {error && <div className="admin-alert error">{error}</div>}

      {loading ? (
        <div className="admin-empty-table">Loading featured items...</div>
      ) : (
        <div className="admin-featured-buckets">
          {FEATURED_BUCKETS.map(({ key, label, emptyLabel }) => {
            const items = filteredBuckets[key];
            return (
              <section className={`admin-featured-bucket ${key}`} key={key} aria-labelledby={`featured-${key}-heading`}>
                <header className="admin-featured-bucket-header">
                  <h3 id={`featured-${key}-heading`}>{label}</h3>
                  <span>{items.length}</span>
                </header>

                {items.length === 0 ? (
                  <div className="admin-featured-bucket-empty">
                    {searchQuery.trim() ? `No matching ${label.toLowerCase()}.` : emptyLabel}
                  </div>
                ) : (
                  <div className="admin-data-table-wrap">
                    <table className="admin-data-table admin-featured-items-table">
                      <thead>
                        <tr>
                          <th>Featured Item</th>
                          <th>Catalog #</th>
                          <th>Category / Group</th>
                          <th>Homepage URL</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={`${item.item_type}-${item.id}`}>
                            <td>
                              <div className="admin-product-cell">
                                {item.image_url ? (
                                  <img
                                    src={formatAssetUrl(item.image_url)}
                                    alt=""
                                    className="admin-thumb"
                                  />
                                ) : (
                                  <span className={`admin-featured-item-placeholder ${item.item_type}`} aria-hidden="true">
                                    {item.item_type === 'service' ? 'S' : item.item_type === 'reagent' ? 'R' : 'P'}
                                  </span>
                                )}
                                <strong>{item.product_name}</strong>
                              </div>
                            </td>
                            <td>{item.catalog_number ? <code>{item.catalog_number}</code> : <span>—</span>}</td>
                            <td>
                              <span className="admin-featured-category">{item.category_name || 'Uncategorized'}</span>
                              {item.group_name && <small>{item.group_name}</small>}
                            </td>
                            <td>
                              <a
                                className="admin-public-detail-link"
                                href={item.homepage_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`Open ${item.homepage_url} in a new tab`}
                              >
                                {item.homepage_url}
                              </a>
                            </td>
                            <td>
                              <button
                                className="admin-action-btn edit"
                                type="button"
                                onClick={() => onEditItem?.(item)}
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

export default AdminFeaturedProducts;
