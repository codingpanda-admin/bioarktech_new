import React from 'react';
import { logo } from '../utils/api';

function SiteFooter({ navigate }) {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <img src={logo} alt="Bio Ark Tech" />
          <p>Advanced tools. Better science. Empowering discovery. Enhancing life.</p>
          <div className="socials" aria-label="Social links"><a href="#">in</a><a href="#">x</a><a href="#">yt</a><a href="#">@</a></div>
        </div>
        <div>
          <h3>Shop by Category</h3>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Gene Editing Tools</a>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>PCR & qPCR Reagents</a>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Cell Culture</a>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Electrophoresis</a>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>All Categories</a>
        </div>
        <div>
          <h3>Customer Service</h3>
          <a href="#" onClick={(e) => e.preventDefault()}>Order Tracking</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Shipping & Delivery</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Returns & Refunds</a>
          <a href="#" onClick={(e) => e.preventDefault()}>FAQs</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Product Support</a>
        </div>
        <div>
          <h3>Company</h3>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/'); }}>About BioArkTech</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Careers</a>
          <a href="#" onClick={(e) => e.preventDefault()}>News & Updates</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Terms of Service</a>
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
