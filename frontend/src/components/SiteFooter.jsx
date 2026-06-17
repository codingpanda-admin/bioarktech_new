import React from 'react';
import { logo } from '../utils/api';

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M13.7 10.6 20.4 3h-1.6L13 9.6 8.4 3H3l7 10-7 8h1.6l6.1-6.9 4.9 6.9H21l-7.3-10.4Zm-2.2 2.5-.7-1-5.6-7.9h2.4l4.5 6.4.7 1 5.9 8.3h-2.4l-4.8-6.8Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7.8 2.8h8.4c2.8 0 5 2.2 5 5v8.4c0 2.8-2.2 5-5 5H7.8c-2.8 0-5-2.2-5-5V7.8c0-2.8 2.2-5 5-5Zm0 1.8c-1.8 0-3.2 1.4-3.2 3.2v8.4c0 1.8 1.4 3.2 3.2 3.2h8.4c1.8 0 3.2-1.4 3.2-3.2V7.8c0-1.8-1.4-3.2-3.2-3.2H7.8Zm4.2 3.2a4.2 4.2 0 1 1 0 8.4 4.2 4.2 0 0 1 0-8.4Zm0 1.8a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8Zm4.5-2.3a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.6 4.6 12 4.6 12 4.6s-5.6 0-7.5.5a3 3 0 0 0-2.1 2.1C1.9 9.1 1.9 12 1.9 12s0 2.9.5 4.8a3 3 0 0 0 2.1 2.1c1.9.5 7.5.5 7.5.5s5.6 0 7.5-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-4.8.5-4.8s0-2.9-.5-4.8ZM10 15.4V8.6l5.9 3.4-5.9 3.4Z" />
    </svg>
  );
}

function SiteFooter({ navigate }) {
  const goToFooterLink = (e, path) => {
    e.preventDefault();
    if (path) navigate(path);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    });
  };

  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <img src={logo} alt="Bio Ark Tech" />
          <p>Advanced tools. Better science. Empowering discovery. Enhancing life.</p>
          <div className="socials" aria-label="Social links">
            <a href="#" aria-label="BioArkTech on X" onClick={(e) => e.preventDefault()}><XIcon /></a>
            <a href="#" aria-label="BioArkTech on Instagram" onClick={(e) => e.preventDefault()}><InstagramIcon /></a>
            <a href="#" aria-label="BioArkTech on YouTube" onClick={(e) => e.preventDefault()}><YouTubeIcon /></a>
          </div>
        </div>
        <div>
          <h3>Shop by Category</h3>
          <a href="/search?q=" onClick={(e) => goToFooterLink(e, '/search?q=')}>Products</a>
          <a href="/search?q=Service" onClick={(e) => goToFooterLink(e, '/search?q=Service')}>Services</a>
          <a href="/search?category=reagents" onClick={(e) => goToFooterLink(e, '/search?category=reagents')}>Reagents & Kits</a>
          <a href="/search?q=" onClick={(e) => goToFooterLink(e, '/search?q=')}>All Categories</a>
        </div>
        <div>
          <h3>Customer Service</h3>
          <a href="/request-quote" onClick={(e) => goToFooterLink(e, '/request-quote')}>Request a Quote</a>
          <a href="#" onClick={(e) => goToFooterLink(e)}>Order Tracking</a>
          <a href="#" onClick={(e) => goToFooterLink(e)}>Shipping & Delivery</a>
          <a href="#" onClick={(e) => goToFooterLink(e)}>Returns & Refunds</a>
          <a href="#" onClick={(e) => goToFooterLink(e)}>FAQs</a>
          <a href="#" onClick={(e) => goToFooterLink(e)}>Product Support</a>
        </div>
        <div>
          <h3>Company</h3>
          <a href="/investors" onClick={(e) => goToFooterLink(e, '/investors')}>Investors</a>
          <a href="/about-bioark" onClick={(e) => goToFooterLink(e, '/about-bioark')}>Why BioArk</a>
          <a href="/resources" onClick={(e) => goToFooterLink(e, '/resources')}>Resources & Blogs</a>
          <a href="#" onClick={(e) => goToFooterLink(e)}>Privacy Policy</a>
          <a href="#" onClick={(e) => goToFooterLink(e)}>Terms of Service</a>
        </div>
        <div>
          <h3>Stay Updated</h3>
          <p>Subscribe to get the latest news, offers, and product updates.</p>
          <form className="newsletter" onSubmit={(e) => e.preventDefault()}>
            <input aria-label="Email address" placeholder="Enter your email" />
            <button type="submit">↗</button>
          </form>
        </div>
      </div>
      <p className="copyright">© 2026 BioArkTech. All rights reserved.</p>
    </footer>
  );
}

export default SiteFooter;
