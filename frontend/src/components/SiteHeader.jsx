import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch, logo } from '../utils/api';

const serviceMenuGroups = [
  {
    name: 'Genetic Engineering',
    services: [
      { title: 'Genome Editing Services', query: 'Genome Editing Services' },
      { title: 'Custom Cloning Services', query: 'Custom Cloning Services' },
      { title: 'Stable Cell Line Services', query: 'Stable Cell Line Services' },
    ],
  },
  {
    name: 'Viral Vector Services',
    services: [
      { title: 'Lentivirus Package Services', query: 'Lentivirus Package Services' },
      { title: 'Vector Construction Support', query: 'Vector Construction' },
      { title: 'Functional Testing', query: 'Functional Testing' },
    ],
  },
  {
    name: 'Research Support',
    services: [
      { title: 'Experiment Services', query: 'Experiment Services' },
      { title: 'Lab Supplies', query: 'Lab Supplies' },
      { title: 'Project Consultation', query: 'Project Consultation' },
    ],
  },
];

const reagentMenuGroups = [
  {
    name: 'Molecular Biology Reagents',
    items: [
      { title: 'PCR & qPCR Reagents', query: 'PCR qPCR Reagents' },
      { title: 'dNTPs & Nucleotides', query: 'dNTP Nucleotides' },
      { title: 'Enzymes & Proteins', query: 'Enzymes Proteins' },
    ],
  },
  {
    name: 'Kits & Buffers',
    items: [
      { title: 'Plasmid Prep Kits', query: 'Plasmid Prep Kit' },
      { title: 'Cloning Kits', query: 'Cloning Kit' },
      { title: 'Reaction Buffers', query: 'Buffer' },
    ],
  },
  {
    name: 'Gel & Protein Analysis',
    items: [
      { title: 'Agarose Gels', query: 'Agarose Gel' },
      { title: 'DNA Ladders & Markers', query: 'DNA Ladder Marker' },
      { title: 'Protein Ladders', query: 'Protein Ladder' },
    ],
  },
];

const defaultProductCategories = [
  { category_name: 'Genome Editing', external_id: 'genome-editing' },
  { category_name: 'Vector Stock', external_id: 'vector-clones' },
  { category_name: 'IVT mRNA', external_id: 'category-1764975611348' },
  { category_name: 'Purified Protein', external_id: 'category-1764975769330' },
  { category_name: 'Virus Product', external_id: 'lentivirus' },
  { category_name: 'Cell Lines', external_id: 'stable-cell-lines' },
];

const buildCategoryOnlyCatalog = (categories) => (
  categories
    .filter((category) => category.external_id || category.externalId)
    .map((category) => ({
      category_id: category.category_id || null,
      category_name: category.category_name,
      external_id: category.external_id || category.externalId,
      externalId: category.externalId || category.external_id,
      product_count: category.product_count || 0,
      subcategories: category.subcategories || [],
    }))
);

// Icons for each category
const categoryIcons = {
  'Genome Editing': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v6m0 8v6M4.93 4.93l4.24 4.24m5.66 5.66l4.24 4.24M2 12h6m8 0h6M4.93 19.07l4.24-4.24m5.66-5.66l4.24-4.24"/>
    </svg>
  ),
  'Vector Stock': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
    </svg>
  ),
  'IVT mRNA': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3v18M18 3v18M6 9c3 0 3-3 6-3s3 3 6 3M6 15c3 0 3-3 6-3s3 3 6 3"/>
    </svg>
  ),
  'Purified Protein': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 2v4m10-4v4M5 6h14a2 2 0 012 2v2a6 6 0 01-6 6h-6a6 6 0 01-6-6V8a2 2 0 012-2zM9 16v4a2 2 0 002 2h2a2 2 0 002-2v-4"/>
    </svg>
  ),
  'Virus Product': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.93 4.93l2.12 2.12m9.9 9.9l2.12 2.12M4.93 19.07l2.12-2.12m9.9-9.9l2.12-2.12"/>
    </svg>
  ),
  'Cell Lines': (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>
    </svg>
  ),
};

function SiteHeader({ navigate, currentUser, currentUserProfile, onOpenAuth, onLogout, cartCount }) {
  const [query, setQuery] = useState('');
  const [productMenuOpen, setProductMenuOpen] = useState(false);
  const [serviceMenuOpen, setServiceMenuOpen] = useState(false);
  const [reagentMenuOpen, setReagentMenuOpen] = useState(false);
  const [aboutMenuOpen, setAboutMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const profileMenuRef = React.useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadCatalog = async () => {
      try {
        const data = await apiFetch('/api/products/get-product-catalog/');
        if (isMounted && data.length > 0) {
          setCatalog(data);
          setActiveCategory(data[0].external_id);
          return;
        }
      } catch (err) {
        console.error('Failed to load product catalog:', err);
      }

      try {
        const categories = await apiFetch('/api/products/load-product-categories/');
        const fallbackCatalog = buildCategoryOnlyCatalog(categories);
        if (isMounted && fallbackCatalog.length > 0) {
          setCatalog(fallbackCatalog);
          setActiveCategory(fallbackCatalog[0].external_id);
          return;
        }
      } catch (err) {
        console.error('Failed to load product categories:', err);
      }

      const defaultCatalog = buildCategoryOnlyCatalog(defaultProductCategories);
      if (isMounted) {
        setCatalog(defaultCatalog);
        setActiveCategory(defaultCatalog[0]?.external_id || null);
      }
    };

    loadCatalog();

    return () => { isMounted = false; };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      closeMenus();
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const closeMenus = useCallback(() => {
    setProductMenuOpen(false);
    setServiceMenuOpen(false);
    setReagentMenuOpen(false);
    setAboutMenuOpen(false);
    setProfileMenuOpen(false);
  }, []);

  useEffect(() => {
    if (!profileMenuOpen) {
      return;
    }

    const handleOutsideClick = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [profileMenuOpen]);

  const MenuCloseButton = ({ label = 'Close menu' }) => (
    <button className="menu-panel-close" type="button" aria-label={label} onClick={closeMenus}>
      <span aria-hidden="true">×</span>
    </button>
  );

  const activeCatalogEntry = catalog.find((c) => c.external_id === activeCategory);
  const firstName = currentUserProfile?.first_name || currentUser?.split('@')[0] || 'user';
  const profileAltText = `Hi, ${firstName}`;
  const isAdminUser = Boolean(currentUserProfile?.isAdmin || currentUserProfile?.is_admin);

  return (
    <header className="site-header">
      <div className="topbar">
        <a className="brand" href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} aria-label="Bio Ark Tech home">
          <img src={logo} alt="Bio Ark Tech" />
        </a>

        <form className="search" role="search" onSubmit={handleSearchSubmit}>
          <input 
            aria-label="Search products" 
            placeholder="Search products, categories, or applications..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        <div className="header-actions" aria-label="Account and cart">
          {currentUser ? (
            <div className={`profile-menu ${profileMenuOpen ? 'is-open' : ''}`} ref={profileMenuRef}>
              <button
                type="button"
                className="profile-icon-button"
                aria-label={profileAltText}
                title={profileAltText}
                aria-expanded={profileMenuOpen}
                aria-controls="profile-menu"
                onClick={() => {
                  setProductMenuOpen(false);
                  setServiceMenuOpen(false);
                  setReagentMenuOpen(false);
                  setAboutMenuOpen(false);
                  setProfileMenuOpen((isOpen) => !isOpen);
                }}
              >
                <span aria-hidden="true">{firstName.charAt(0).toUpperCase()}</span>
              </button>
              {profileMenuOpen && (
                <div className="profile-dropdown" id="profile-menu">
                  <div className="profile-dropdown-greeting">{profileAltText}</div>
                  <a href="/profile" onClick={(e) => { e.preventDefault(); closeMenus(); navigate('/profile'); }}>
                    My Profile
                  </a>
                  <a href="/quotes" onClick={(e) => { e.preventDefault(); closeMenus(); navigate('/quotes'); }}>
                    My Quotes
                  </a>
                  {isAdminUser && (
                    <a href="/admin" onClick={(e) => { e.preventDefault(); closeMenus(); navigate('/admin'); }}>
                      Admin Console
                    </a>
                  )}
                  <a href="#" onClick={(e) => { e.preventDefault(); closeMenus(); onLogout(); }}>
                    Sign Out
                  </a>
                </div>
              )}
            </div>
          ) : (
            <a href="#" onClick={(e) => { e.preventDefault(); onOpenAuth(); }}>Sign In</a>
          )}
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/cart'); }}>Cart ({cartCount || 0})</a>
        </div>
      </div>

      <nav className="main-nav" aria-label="Primary navigation">
        <div className={`products-nav ${productMenuOpen ? 'is-open' : ''}`}>
          <button
            className="nav-trigger products-trigger"
            type="button"
            aria-expanded={productMenuOpen}
            aria-controls="products-menu"
            onClick={() => {
              setServiceMenuOpen(false);
              setReagentMenuOpen(false);
              setAboutMenuOpen(false);
              setProductMenuOpen((isOpen) => !isOpen);
              if (!productMenuOpen && catalog.length > 0 && !activeCategory) {
                setActiveCategory(catalog[0].external_id);
              }
            }}
          >
            Products
          </button>
          {productMenuOpen && (
            <div className="products-mega-menu catalog-mega-menu" id="products-menu">
              <MenuCloseButton label="Close products menu" />

              {/* Category sidebar */}
              <div className="catalog-sidebar">
                <div className="catalog-sidebar-title">Product Categories</div>
                {catalog.map((cat) => (
                  <button
                    key={cat.external_id}
                    className={`catalog-category-btn ${activeCategory === cat.external_id ? 'is-active' : ''}`}
                    type="button"
                    onMouseEnter={() => setActiveCategory(cat.external_id)}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveCategory(cat.external_id);
                    }}
                  >
                    <span className="catalog-category-icon">
                      {categoryIcons[cat.category_name] || categoryIcons['Genome Editing']}
                    </span>
                    <span className="catalog-category-label">{cat.category_name}</span>
                    <span className="catalog-category-count">({cat.product_count})</span>
                    <span className="catalog-category-arrow">›</span>
                  </button>
                ))}
              </div>

              {/* Detail panel for active category */}
              <div className="catalog-detail">
                {activeCatalogEntry && (
                  <>
                    <div className="catalog-detail-header">
                      <a
                        className="catalog-detail-title"
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          closeMenus();
                          navigate(`/search?q=${encodeURIComponent(activeCatalogEntry.category_name)}`);
                        }}
                      >
                        {activeCatalogEntry.category_name}
                        <span className="catalog-detail-count">{activeCatalogEntry.product_count} products</span>
                      </a>
                    </div>

                    {activeCatalogEntry.product_count === 0 ? (
                      <div className="catalog-empty">
                        <div className="catalog-empty-icon">🧬</div>
                        <p>Products coming soon</p>
                        <a
                          href="#"
                          className="catalog-browse-link"
                          onClick={(e) => {
                            e.preventDefault();
                            closeMenus();
                            navigate('/request-quote');
                          }}
                        >
                          Request a quote →
                        </a>
                      </div>
                    ) : (
                      <div className="catalog-subcategories">
                        {activeCatalogEntry.subcategories.map((sub) => (
                          <div className="catalog-subcategory" key={sub.name || '__default'}>
                            {sub.name && (
                              <div className="catalog-subcategory-name">
                                <span className="catalog-sub-dot" />
                                {sub.name}
                              </div>
                            )}
                            <div className="catalog-products-list">
                              {sub.products.map((product) => (
                                <a
                                  key={product.external_id}
                                  className="catalog-product-link"
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    closeMenus();
                                    navigate(`/product/${product.externalId || product.external_id}`);
                                  }}
                                >
                                  <span className="catalog-product-name">{product.product_name}</span>
                                  <span className="catalog-product-sku">{product.catalog_number}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="catalog-detail-footer">
                      <a
                        href="#"
                        className="catalog-view-all"
                        onClick={(e) => {
                          e.preventDefault();
                          closeMenus();
                          navigate(`/search?q=${encodeURIComponent(activeCatalogEntry.category_name)}`);
                        }}
                      >
                        View all {activeCatalogEntry.category_name} →
                      </a>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        <div className={`products-nav services-nav ${serviceMenuOpen ? 'is-open' : ''}`}>
          <button
            className="nav-trigger services-trigger"
            type="button"
            aria-expanded={serviceMenuOpen}
            aria-controls="services-menu"
            onClick={() => {
              setProductMenuOpen(false);
              setReagentMenuOpen(false);
              setAboutMenuOpen(false);
              setServiceMenuOpen((isOpen) => !isOpen);
            }}
          >
            Services
          </button>
          {serviceMenuOpen && (
            <div className="products-mega-menu services-mega-menu" id="services-menu">
              <MenuCloseButton label="Close services menu" />
              {serviceMenuGroups.map((group) => (
                <div className="product-menu-group" key={group.name}>
                  <a
                    className="product-menu-category"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setServiceMenuOpen(false);
                      navigate(`/search?q=${encodeURIComponent(group.name)}`);
                    }}
                  >
                    {group.name}
                  </a>
                  <div className="product-menu-items">
                    {group.services.map((service) => (
                      <a
                        href="#"
                        key={service.title}
                        onClick={(e) => {
                          e.preventDefault();
                          setServiceMenuOpen(false);
                          navigate(`/search?q=${encodeURIComponent(service.query)}`);
                        }}
                      >
                        {service.title}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className={`products-nav reagents-nav ${reagentMenuOpen ? 'is-open' : ''}`}>
          <button
            className="nav-trigger reagents-trigger"
            type="button"
            aria-expanded={reagentMenuOpen}
            aria-controls="reagents-menu"
            onClick={() => {
              setProductMenuOpen(false);
              setServiceMenuOpen(false);
              setAboutMenuOpen(false);
              setReagentMenuOpen((isOpen) => !isOpen);
            }}
          >
            Reagents & Kits
          </button>
          {reagentMenuOpen && (
            <div className="products-mega-menu reagents-mega-menu" id="reagents-menu">
              <MenuCloseButton label="Close reagents menu" />
              {reagentMenuGroups.map((group) => (
                <div className="product-menu-group" key={group.name}>
                  <a
                    className="product-menu-category"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setReagentMenuOpen(false);
                      navigate(`/search?category=reagents&q=${encodeURIComponent(group.name)}`);
                    }}
                  >
                    {group.name}
                  </a>
                  <div className="product-menu-items">
                    {group.items.map((item) => (
                      <a
                        href="#"
                        key={item.title}
                        onClick={(e) => {
                          e.preventDefault();
                          setReagentMenuOpen(false);
                          navigate(`/search?category=reagents&q=${encodeURIComponent(item.query)}`);
                        }}
                      >
                        {item.title}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <a href="#" onClick={(e) => { e.preventDefault(); closeMenus(); navigate('/search?category=consumables'); }}>Consumables</a>
        <a href="#" onClick={(e) => { e.preventDefault(); closeMenus(); navigate('/request-quote'); }}>Design</a>
        <a className="nav-link-plain" href="/resources" onClick={(e) => { e.preventDefault(); closeMenus(); navigate('/resources'); }}>Resources & Blogs</a>
        <div className={`nav-dropdown ${aboutMenuOpen ? 'is-open' : ''}`}>
          <button
            className="nav-trigger"
            type="button"
            aria-expanded={aboutMenuOpen}
            aria-controls="about-menu"
            onClick={() => {
              setProductMenuOpen(false);
              setServiceMenuOpen(false);
              setReagentMenuOpen(false);
              setAboutMenuOpen((isOpen) => !isOpen);
            }}
          >
            About
          </button>
          {aboutMenuOpen && (
            <div className="dropdown-menu" id="about-menu">
              <MenuCloseButton label="Close about menu" />
              <a href="/investors" onClick={(e) => { e.preventDefault(); closeMenus(); navigate('/investors'); }}>Investors</a>
              <a href="/about-bioark" onClick={(e) => { e.preventDefault(); closeMenus(); navigate('/about-bioark'); }}>Why BioArk</a>
            </div>
          )}
        </div>
        <a
          className="quote-button"
          href="/request-quote"
          onClick={(e) => {
            e.preventDefault();
            closeMenus();
            navigate('/request-quote');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          Request a Quote
        </a>
      </nav>
    </header>
  );
}

export default SiteHeader;
