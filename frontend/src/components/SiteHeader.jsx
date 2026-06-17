import React, { useState } from 'react';
import { logo } from '../utils/api';

function SiteHeader({ navigate, currentUser, onOpenAuth, onLogout, cartCount }) {
  const [query, setQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

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
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Hola, {currentUser}</span>
              <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); }}>Sign Out</a>
            </>
          ) : (
            <a href="#" onClick={(e) => { e.preventDefault(); onOpenAuth(); }}>Sign In</a>
          )}
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/cart'); }}>Cart ({cartCount || 0})</a>
        </div>
      </div>

      <nav className="main-nav" aria-label="Primary navigation">
        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/?scroll=categories'); }}>Shop by Category</a>
        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/search?q=Service'); }}>Services</a>
        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/search?category=reagents'); }}>Reagents & Kits</a>
        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/search?category=consumables'); }}>Consumables</a>
        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/request-quote'); }}>Design</a>
        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/?scroll=blog'); }}>Resources & Blog</a>
        <div className="nav-dropdown">
          <a className="nav-trigger" href="#" onClick={(e) => e.preventDefault()}>About</a>
          <div className="dropdown-menu">
            <a href="#" onClick={(e) => e.preventDefault()}>Investors</a>
            <a href="#" onClick={(e) => e.preventDefault()}>Why BioArk</a>
          </div>
        </div>
        <a className="quote-button" href="/request-quote" onClick={(e) => { e.preventDefault(); navigate('/request-quote'); }}>Request a Quote</a>
      </nav>
    </header>
  );
}

export default SiteHeader;
