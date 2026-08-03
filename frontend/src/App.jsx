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
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import CheckoutCancelPage from './pages/CheckoutCancelPage';
import ResourcesPage from './pages/ResourcesPage';
import InvestorsPage from './pages/InvestorsPage';
import AboutBioArkPage from './pages/AboutBioArkPage';
import BlogDetailPage from './pages/BlogDetailPage';
import ProfilePage from './pages/ProfilePage';
import MyQuotesPage from './pages/MyQuotesPage';
import DesignPage from './pages/DesignPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [searchParams, setSearchParams] = useState(new URLSearchParams(window.location.search));
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleOpenAuth = () => {
    setAuthModalOpen(true);
  };

  useEffect(() => {
    const handleMessage = async (event) => {
      if (event.data?.type === 'AUTH_SUCCESS') {
        const email = event.data.email;
        setCurrentUser(email);
        try {
          const profile = await apiFetch('/api/users/view-user-info/');
          setCurrentUserProfile(profile);
        } catch (profileErr) {
          setCurrentUserProfile(null);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

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
      const hasSelectedUnit = Boolean(selectedUnit);
      const sku = product.product_sku || product.catalog_number || product.external_id;
      const unitSizeText = hasSelectedUnit ? (selectedUnit?.unit_size || '') : (product.unit_size || '');
      
      const rawPrice = hasSelectedUnit ? selectedUnit?.unit_price : (product.unit_price || product.list_price || 0);
      const parsedPrice = typeof rawPrice === 'string'
        ? rawPrice.replace(/[^0-9.-]/g, '')
        : rawPrice;
      const price = parsedPrice && !isNaN(Number(parsedPrice)) ? Number(parsedPrice) : 0;
      
      const rawListPrice = hasSelectedUnit ? selectedUnit?.list_price : (product.list_price || product.price_range || 0);
      const parsedListPrice = typeof rawListPrice === 'string'
        ? rawListPrice.replace(/[^0-9.-]/g, '')
        : rawListPrice;
      const listPrice = parsedListPrice && !isNaN(Number(parsedListPrice)) ? Number(parsedListPrice) : 0;
      
      const image = product.image || product.image_url || (product.images && (typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.image)) || '';

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
            price,
            listPrice,
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
        const session = await apiFetch('/api/session/');
        if (session.isAuthenticated) {
          const profile = await apiFetch('/api/users/view-user-info/');
          setCurrentUser(profile.email);
          setCurrentUserProfile(profile);
        }
      } catch (err) {
        setCurrentUser(null);
        setCurrentUserProfile(null);
      } finally {
        setAuthChecked(true);
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
      setCurrentUserProfile(null);
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminLogout = async () => {
    try {
      await apiFetch('/api/logout/', { method: 'POST' });
      setCurrentUser(null);
      setCurrentUserProfile(null);
      navigate('/admin');
    } catch (err) {
      console.error(err);
    }
  };

  const refreshUserProfile = async () => {
    try {
      const profile = await apiFetch('/api/users/view-user-info/');
      setCurrentUserProfile(profile);
      return profile;
    } catch (err) {
      console.error('Error refreshing profile:', err);
    }
  };

  const isRequestQuotePage = currentPath === '/request-quote';
  const isAdminPage = currentPath === '/admin';
  const isSearchPage = currentPath === '/search';
  const isProductPage = currentPath.startsWith('/product/');
  const isCartPage = currentPath === '/cart';
  const isCheckoutSuccess = currentPath === '/checkout/success';
  const isCheckoutCancel = currentPath === '/checkout/cancel';
  const isBlogsPage = currentPath === '/blogs';
  const isBlogPage = currentPath.startsWith('/blog/');
  const isInvestorsPage = currentPath === '/investors';
  const isAboutBioArkPage = currentPath === '/about-bioark';
  const isProfilePage = currentPath === '/profile';
  const isMyQuotesPage = currentPath === '/quotes';
  const isDesignPage = currentPath === '/design';
  const isResetPasswordPage = currentPath.startsWith('/reset-password/');
  const isAuthPopupPage = currentPath === '/auth-popup';

  if (isAuthPopupPage) {
    return (
      <div className="auth-popup-page" style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--panel)',
        padding: '20px'
      }}>
        <AuthModal 
          isPopupPage={true} 
          onLoginSuccess={async (email) => {
            if (window.opener) {
              window.opener.postMessage({ type: 'AUTH_SUCCESS', email: email }, '*');
              window.close();
            }
          }} 
          onClose={() => {
            if (window.opener) {
              window.close();
            }
          }} 
        />
      </div>
    );
  }

  return (
    <div className="site-shell">
      {isAdminPage && currentUserProfile && (currentUserProfile.is_admin || currentUserProfile.isAdmin || currentUserProfile.is_staff) ? (
        <AdminHeader navigate={navigate} onLogout={handleAdminLogout} />
      ) : (
        <SiteHeader 
          navigate={navigate} 
          currentUser={currentUser} 
          currentUserProfile={currentUserProfile}
          onOpenAuth={handleOpenAuth} 
          onLogout={handleAdminLogout}
          cartCount={cartCount}
        />
      )}
      
      {isAdminPage ? (
        <AdminPage 
          currentUser={currentUser} 
          currentUserProfile={currentUserProfile} 
          authChecked={authChecked}
          onLoginSuccess={async (email) => {
            setCurrentUser(email);
            try {
              const profile = await apiFetch('/api/users/view-user-info/');
              setCurrentUserProfile(profile);
            } catch (profileErr) {
              setCurrentUserProfile(null);
            }
          }} 
          onLogout={handleLogout}
        />
      ) : isRequestQuotePage ? (
        <RequestQuotePage
          navigate={navigate}
          cart={cart}
          onClearCart={handleClearCart}
          currentUser={currentUser}
          currentUserProfile={currentUserProfile}
          quotePrefill={searchParams}
        />
      ) : isSearchPage ? (
        <SearchPage 
          navigate={navigate} 
          currentQuery={searchParams.get('q') || ''} 
          currentCategory={searchParams.get('category') || ''} 
          initialSelectedCategory={searchParams.get('cat') || null}
        />
      ) : isProductPage ? (
        <ProductDetailsPage 
          navigate={navigate} 
          skuOrCatalog={currentPath.substring('/product/'.length)} 
          onAddToCart={handleAddToCart}
          currentUser={currentUser}
          currentUserProfile={currentUserProfile}
        />
      ) : isCartPage ? (
        <CartPage
          navigate={navigate}
          cart={cart}
          onUpdateQty={handleUpdateQty}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          currentUser={currentUser}
          currentUserProfile={currentUserProfile}
          onOpenAuth={handleOpenAuth}
          onRefreshProfile={refreshUserProfile}
        />
      ) : isCheckoutSuccess ? (
        <CheckoutSuccessPage
          navigate={navigate}
          onClearCart={handleClearCart}
        />
      ) : isCheckoutCancel ? (
        <CheckoutCancelPage navigate={navigate} />
      ) : isResetPasswordPage ? (
        <ResetPasswordPage navigate={navigate} token={currentPath.split('/reset-password/')[1]?.split('?')[0] || ''} />
      ) : isBlogsPage ? (
        <ResourcesPage navigate={navigate} searchParams={searchParams} />
      ) : isProfilePage ? (
        <ProfilePage navigate={navigate} initialTab={searchParams.get('tab')} onRefreshProfile={refreshUserProfile} />
      ) : isMyQuotesPage ? (
        <MyQuotesPage navigate={navigate} currentUser={currentUser} authChecked={authChecked} />
      ) : isDesignPage ? (
        <DesignPage navigate={navigate} />
      ) : isBlogPage ? (
        <BlogDetailPage
          navigate={navigate}
          blogId={currentPath.substring('/blog/'.length)}
        />
      ) : isInvestorsPage ? (
        <InvestorsPage navigate={navigate} />
      ) : isAboutBioArkPage ? (
        <AboutBioArkPage navigate={navigate} />
      ) : (
        <HomePage navigate={navigate} searchParams={searchParams} />
      )}
      
      {!isAdminPage && <SiteFooter navigate={navigate} />}

      {authModalOpen && (
        <AuthModal 
          onClose={() => setAuthModalOpen(false)} 
          onLoginSuccess={async (email) => {
            setCurrentUser(email);
            try {
              const profile = await apiFetch('/api/users/view-user-info/');
              setCurrentUserProfile(profile);
            } catch (profileErr) {
              setCurrentUserProfile(null);
            }
            setAuthModalOpen(false);
          }} 
        />
      )}
    </div>
  );
}

export default App;
