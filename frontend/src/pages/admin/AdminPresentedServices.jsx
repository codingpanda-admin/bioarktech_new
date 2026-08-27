import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch, formatAssetUrl } from '../../utils/api';

function AdminPresentedServices({ onEditItem }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [removingServiceId, setRemovingServiceId] = useState(null);

  const loadServices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/admin-panel/presented-services/');
      setServices(Array.isArray(data?.results) ? data.results : []);
    } catch (err) {
      setError(err.message || 'Failed to load recommended services.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const handleRemovePresentedService = async (service) => {
    if (!window.confirm(`Remove "${service.product_name}" from Recommended Services?`)) return;

    setRemovingServiceId(service.id);
    setError('');
    setSuccessMsg('');
    try {
      await apiFetch(`/api/admin-panel/services/${service.id}/update/`, {
        method: 'POST',
        body: { presented_service: false },
      });
      setServices((currentServices) => currentServices.filter((item) => item.id !== service.id));
      setSuccessMsg(`${service.product_name} was removed from Recommended Services.`);
    } catch (err) {
      setError(err.message || 'Failed to remove the featured service.');
    } finally {
      setRemovingServiceId(null);
    }
  };

  const filteredServices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return services;

    return services.filter((service) => (
      service.product_name?.toLowerCase().includes(query)
      || service.catalog_number?.toLowerCase().includes(query)
      || service.category_name?.toLowerCase().includes(query)
      || service.group_name?.toLowerCase().includes(query)
    ));
  }, [searchQuery, services]);

  return (
    <>
      <div className="admin-section-header">
        <div>
          <h2 id="admin-content-title">Recommended Services</h2>
          <p className="admin-section-description">
            Services displayed in the Recommended Services panel on customer-facing service detail pages.
          </p>
        </div>
        <div className="admin-section-actions">
          <div className="admin-search-box">
            <input
              type="search"
              placeholder="Search recommended services..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Search recommended services"
            />
          </div>
        </div>
      </div>

      {error && <div className="admin-alert error">{error}</div>}
      {successMsg && <div className="admin-alert success">{successMsg}</div>}

      {loading ? (
        <div className="admin-empty-table">Loading recommended services...</div>
      ) : (
        <section className="admin-featured-bucket services" aria-labelledby="presented-services-heading">
          <header className="admin-featured-bucket-header">
            <h3 id="presented-services-heading">Recommended Services</h3>
            <span>{filteredServices.length}</span>
          </header>

          {filteredServices.length === 0 ? (
            <div className="admin-featured-bucket-empty">
              {searchQuery.trim() ? 'No matching recommended services.' : 'No recommended services.'}
            </div>
          ) : (
            <div className="admin-data-table-wrap">
              <table className="admin-data-table admin-featured-items-table">
                <thead>
                  <tr>
                    <th>Recommended Service</th>
                    <th>Catalog #</th>
                    <th>Category / Group</th>
                    <th>Public URL</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map((service) => (
                    <tr key={service.id}>
                      <td>
                        <div className="admin-product-cell">
                          {service.image_url ? (
                            <img src={formatAssetUrl(service.image_url)} alt="" className="admin-thumb" />
                          ) : (
                            <span className="admin-featured-item-placeholder service" aria-hidden="true">S</span>
                          )}
                          <strong>{service.product_name}</strong>
                        </div>
                      </td>
                      <td>{service.catalog_number ? <code>{service.catalog_number}</code> : <span>—</span>}</td>
                      <td>
                        <span className="admin-featured-category">{service.category_name || 'Uncategorized'}</span>
                        {service.group_name && <small>{service.group_name}</small>}
                      </td>
                      <td>
                        <a
                          className="admin-public-detail-link"
                          href={service.homepage_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`Open ${service.homepage_url} in a new tab`}
                        >
                          {service.homepage_url}
                        </a>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            className="admin-action-btn edit"
                            type="button"
                            onClick={() => onEditItem?.(service)}
                          >
                            Edit
                          </button>
                          <button
                            className="admin-action-btn delete"
                            type="button"
                            disabled={removingServiceId === service.id}
                            onClick={() => handleRemovePresentedService(service)}
                          >
                            {removingServiceId === service.id ? 'Removing...' : 'Remove'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  );
}

export default AdminPresentedServices;
