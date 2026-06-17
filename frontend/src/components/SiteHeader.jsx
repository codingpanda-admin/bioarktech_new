import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch, logo, mockCategories, mockProducts } from '../utils/api';

const inferProductCategory = (product, categories) => {
  const explicitCategory = product.category_name || product.product_category || product.category;
  if (explicitCategory) return explicitCategory;

  const name = (product.product_name || '').toLowerCase();
  const matchedCategory = categories.find((category) => {
    const categoryName = (category.category_name || '').toLowerCase();
    return categoryName
      .split(/[\s/&-]+/)
      .filter((part) => part.length > 3)
      .some((part) => name.includes(part));
  });

  return matchedCategory?.category_name || 'Featured Products';
};

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

function SiteHeader({ navigate, currentUser, onOpenAuth, onLogout, cartCount }) {
  const [query, setQuery] = useState('');
  const [productMenuOpen, setProductMenuOpen] = useState(false);
  const [serviceMenuOpen, setServiceMenuOpen] = useState(false);
  const [reagentMenuOpen, setReagentMenuOpen] = useState(false);
  const [aboutMenuOpen, setAboutMenuOpen] = useState(false);
  const [categories, setCategories] = useState(mockCategories);
  const [products, setProducts] = useState(mockProducts);

  useEffect(() => {
    let isMounted = true;

    const loadNavigationCatalog = async () => {
      try {
        const catData = await apiFetch('/api/products/load-product-categories/');
        if (isMounted && catData.length > 0) setCategories(catData);
      } catch (err) {
        if (isMounted) setCategories(mockCategories);
      }

      try {
        const searchData = await apiFetch('/api/search/?q=&category=');
        if (isMounted && searchData.products?.length > 0) {
          setProducts(searchData.products);
          return;
        }

        const featuredData = await apiFetch('/api/products/get-latest-featured-products/');
        if (isMounted && featuredData.length > 0) setProducts(featuredData);
      } catch (err) {
        if (isMounted) setProducts(mockProducts);
      }
    };

    loadNavigationCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  const productMenuGroups = useMemo(() => {
    const groupedProducts = products.reduce((groups, product) => {
      const categoryName = inferProductCategory(product, categories);
      return {
        ...groups,
        [categoryName]: [...(groups[categoryName] || []), product],
      };
    }, {});

    const categoryGroups = categories
      .filter((category) => category.category_name !== 'All Products')
      .map((category) => ({
        name: category.category_name,
        products: groupedProducts[category.category_name] || [],
      }));

    Object.entries(groupedProducts).forEach(([name, categoryProducts]) => {
      if (!categoryGroups.some((group) => group.name === name)) {
        categoryGroups.push({ name, products: categoryProducts });
      }
    });

    return categoryGroups;
  }, [categories, products]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setProductMenuOpen(false);
      setServiceMenuOpen(false);
      setReagentMenuOpen(false);
      setAboutMenuOpen(false);
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const closeMenus = () => {
    setProductMenuOpen(false);
    setServiceMenuOpen(false);
    setReagentMenuOpen(false);
    setAboutMenuOpen(false);
  };

  const MenuCloseButton = ({ label = 'Close menu' }) => (
    <button className="menu-panel-close" type="button" aria-label={label} onClick={closeMenus}>
      <span aria-hidden="true">×</span>
    </button>
  );

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
            <>
              <span style={{ fontSize: '14px', fontWeight: 500 }}>Hola, {currentUser}</span>
              <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); }}>Sign Out</a>
            </>
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
            }}
          >
            Products
          </button>
          {productMenuOpen && (
            <div className="products-mega-menu" id="products-menu">
              <MenuCloseButton label="Close products menu" />
              {productMenuGroups.map((group) => (
                <div className="product-menu-group" key={group.name}>
                  <a
                    className="product-menu-category"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setProductMenuOpen(false);
                      navigate(`/search?q=${encodeURIComponent(group.name)}`);
                    }}
                  >
                    {group.name}
                  </a>
                  <div className="product-menu-items">
                    {group.products.length > 0 ? (
                      group.products.slice(0, 5).map((product) => {
                        const name = product.product_name;
                        const productId = product.product_sku || product.catalog_number;

                        return (
                          <a
                            href="#"
                            key={productId || name}
                            onClick={(e) => {
                              e.preventDefault();
                              setProductMenuOpen(false);
                              navigate(productId ? `/product/${productId}` : `/search?q=${encodeURIComponent(name)}`);
                            }}
                          >
                            {name}
                          </a>
                        );
                      })
                    ) : (
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setProductMenuOpen(false);
                          navigate(`/search?q=${encodeURIComponent(group.name)}`);
                        }}
                      >
                        Browse all
                      </a>
                    )}
                  </div>
                </div>
              ))}
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
        <a className="nav-link-plain" href="/resources" onClick={(e) => { e.preventDefault(); closeMenus(); navigate('/resources'); }}>Resources & Blog</a>
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
        <a className="quote-button" href="/request-quote" onClick={(e) => { e.preventDefault(); closeMenus(); navigate('/request-quote'); }}>Request a Quote</a>
      </nav>
    </header>
  );
}

export default SiteHeader;
