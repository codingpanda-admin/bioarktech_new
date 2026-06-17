import { useState, useEffect } from 'react';
import './App.css';

// Utilities
import { apiFetch, getProductShippingCost } from './utils/api';

// Components
import SiteHeader from './components/SiteHeader';
import AdminHeader from './components/AdminHeader';
import SiteFooter from './components/SiteFooter';
import AuthModal from './components/AuthModal';

// Pages
import HomePage from './pages/HomePage';
import RequestQuotePage from './pages/RequestQuotePage';
import SearchPage from './pages/SearchPage';
import AdminPage from './pages/AdminPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CartPage from './pages/CartPage';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [searchParams, setSearchParams] = useState(new URLSearchParams(window.location.search));
  const [currentUser, setCurrentUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Cart State & Methods
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('bioark_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('bioark_cart', JSON.stringify(cart));
  }, [cart]);

  const handleAddToCart = (product, quantity, selectedUnit) => {
    setCart((prevCart) => {
      const isFeatured = !product.product_sku;
      const sku = product.product_sku || product.catalog_number;
      const unitSizeText = isFeatured ? (selectedUnit?.unit_size || '') : (product.unit_size || '');
      const price = isFeatured ? (selectedUnit?.unit_price || product.unit_price || 0) : (product.unit_price || 0);
      const listPrice = isFeatured ? (selectedUnit?.list_price || product.list_price || 0) : (product.list_price || 0);
      const image = product.image || (product.images && product.images[0]?.image) || '';

      const existingItemIndex = prevCart.findIndex(
        (item) => item.sku === sku && item.unitSize === unitSizeText
      );

      if (existingItemIndex > -1) {
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + quantity,
        };
        return updatedCart;
      } else {
        const shippingCost = getProductShippingCost(product);
        return [
          ...prevCart,
          {
            sku,
            name: product.product_name,
            unitSize: unitSizeText,
            price: Number(price),
            listPrice: Number(listPrice),
            image,
            quantity,
            shippingCost,
            product,
          },
        ];
      }
    });
  };

  const handleUpdateQty = (sku, unitSize, quantity) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.sku === sku && item.unitSize === unitSize
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
    );
  };

  const handleRemoveItem = (sku, unitSize) => {
    setCart((prevCart) =>
      prevCart.filter((item) => !(item.sku === sku && item.unitSize === unitSize))
    );
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Sync state with back/forward history navigation
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
      setSearchParams(new URLSearchParams(window.location.search));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch logged in user session on load
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const data = await apiFetch('/api/whoami/');
        if (data.username) {
          setCurrentUser(data.username);
        }
      } catch (err) {
        // Not authenticated
      }
    };
    checkUserSession();
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    const parsedPath = path.split('?')[0];
    const parsedSearch = path.includes('?') ? path.split('?')[1] : '';
    setCurrentPath(parsedPath);
    setSearchParams(new URLSearchParams(parsedSearch));
  };

  const handleLogout = async () => {
    try {
      await apiFetch('/api/logout/', { method: 'POST' });
      setCurrentUser(null);
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  const isRequestQuotePage = currentPath === '/request-quote';
  const isAdminPage = currentPath === '/admin';
  const isSearchPage = currentPath === '/search';
  const isProductPage = currentPath.startsWith('/product/');
  const isCartPage = currentPath === '/cart';

  return (
    <div className="site-shell">
      {isAdminPage ? (
        <AdminHeader navigate={navigate} onLogout={handleLogout} />
      ) : (
        <SiteHeader 
          navigate={navigate} 
          currentUser={currentUser} 
          onOpenAuth={() => setAuthModalOpen(true)} 
          onLogout={handleLogout} 
          cartCount={cartCount}
        />
      )}
      
      {isAdminPage ? (
        <AdminPage />
      ) : isRequestQuotePage ? (
        <RequestQuotePage navigate={navigate} cart={cart} onClearCart={handleClearCart} />
      ) : isSearchPage ? (
        <SearchPage 
          navigate={navigate} 
          currentQuery={searchParams.get('q') || ''} 
          currentCategory={searchParams.get('category') || ''} 
        />
      ) : isProductPage ? (
        <ProductDetailsPage 
          navigate={navigate} 
          skuOrCatalog={currentPath.substring('/product/'.length)} 
          onAddToCart={handleAddToCart}
        />
      ) : isCartPage ? (
        <CartPage 
          navigate={navigate} 
          cart={cart} 
          onUpdateQty={handleUpdateQty} 
          onRemoveItem={handleRemoveItem} 
          onClearCart={handleClearCart}
        />
      ) : (
        <HomePage navigate={navigate} searchParams={searchParams} />
      )}
      
      {!isAdminPage && <SiteFooter navigate={navigate} />}

      {authModalOpen && (
        <AuthModal 
          onClose={() => setAuthModalOpen(false)} 
          onLoginSuccess={(email) => setCurrentUser(email)} 
        />
      )}
    </div>
  );
}

export default App;
