import './App.css'

const logo = '/img/logo_homepage_1.png'

const categories = [
  ['Gene Editing', 'Tools', 'dna'],
  ['PCR & qPCR', 'Reagents', 'molecule'],
  ['Electrophoresis', 'Gel Imaging', 'scope'],
  ['Cell Culture', 'Viability', 'cell'],
  ['Enzymes', 'Proteins', 'nodes'],
  ['Tags', 'Reporters', 'tag'],
  ['Kits', 'Buffers', 'bottle'],
  ['All', 'Products', 'arrow'],
]

const products = [
  ['BioArk Agarose LE (Low EEO) High Strength', '$29.00 - $129.00', 'bottle', '129'],
  ['Premium dNTP Mix (2.5 mM each)', '$29.00 - $89.00', 'vial', '94'],
  ['Cas9 Nuclease (S. pyogenes) Recombinant', '$89.00 - $299.00', 'dna', '76'],
  ['NEB CutSmart Buffer (10X)', '$19.00 - $59.00', 'buffer', '110'],
  ['Protein Ladder (10-250 kDa) Ready-to-Use', '$29.00', 'tubes', '63'],
  ['1 kb Plus DNA Ladder (0.1-10 kb)', '$25.00', 'ladder', '88'],
  ['Plasmid Mini Prep Kit (50 preps)', '$49.00', 'kit', '54'],
  ['BioArkTech Gel Documentation System (1200W)', '$3,299.00', 'device', '41'],
]

const resources = [
  ['Application Note', 'CRISPR Knockout Workflow: A Step-by-Step Guide', 'May 8, 2024', '3 min read'],
  ['Technical Guide', 'qPCR Best Practices for Reliable Gene Expression Analysis', 'April 24, 2024', '4 min read'],
  ['Product Spotlight', 'BioArk Agarose LE: High Resolution You Can Trust', 'April 10, 2024', '2 min read'],
]

function SiteHeader() {
  return (
    <header className="site-header">
      <div className="topbar">
        <a className="brand" href="/" aria-label="Bio Ark Tech home">
          <img src={logo} alt="Bio Ark Tech" />
        </a>

        <form className="search" role="search">
          <input aria-label="Search products" placeholder="Search products, categories, or applications..." />
          <button type="submit">Search</button>
        </form>

        <div className="header-actions" aria-label="Account and cart">
          <a href="#">Sign In</a>
          <a href="#">Cart (0)</a>
        </div>
      </div>

      <nav className="main-nav" aria-label="Primary navigation">
        <a href="#">Shop by Category</a>
        <a href="#">Services</a>
        <a href="#">Reagents & Kits</a>
        <a href="#">Design</a>
        <a href="#">Resources & Blog</a>
        <div className="nav-dropdown">
          <a className="nav-trigger" href="#">About</a>
          <div className="dropdown-menu">
            <a href="#">Investors</a>
            <a href="#">Why BioArk</a>
          </div>
        </div>
        <a className="quote-button" href="/request-quote">Request a Quote</a>
      </nav>
    </header>
  )
}

function IconMark({ type }) {
  return (
    <span className={`icon-mark icon-${type}`} aria-hidden="true">
      <span />
    </span>
  )
}

function ProductVisual({ type }) {
  return (
    <div className={`product-visual visual-${type}`} aria-hidden="true">
      <span className="cap" />
      <span className="label" />
      <span className="detail detail-one" />
      <span className="detail detail-two" />
      <span className="detail detail-three" />
    </div>
  )
}

function HomePage() {
  return (
    <>
      <main>
        <section className="hero-section">
          <button className="carousel-control prev" type="button" aria-label="Previous promotion">‹</button>
          <div className="hero-content">
            <p className="eyebrow">Limited Offer</p>
            <h1><span>50% Off</span> Precast Agarose Gels</h1>
            <p>High-resolution, ready-to-use gels for fast and reliable DNA analysis.</p>
            <div className="hero-actions">
              <a href="#" className="primary-button">Shop Now</a>
              <a href="/request-quote" className="secondary-button">Request a Quote</a>
            </div>
          </div>

          <div className="hero-art" aria-label="BioArk agarose gel promotion">
            <div className="dna-ribbon" />
            <div className="glow-platform" />
            <div className="gel-pack">
              <div className="pack-logo">BIOARK TECH</div>
              <div className="pack-lines" />
            </div>
            <div className="gel-tray">
              {Array.from({ length: 12 }).map((_, index) => (
                <span key={index} />
              ))}
            </div>
            <div className="sample-box">
              {Array.from({ length: 8 }).map((_, index) => (
                <span key={index} />
              ))}
            </div>
          </div>
          <button className="carousel-control next" type="button" aria-label="Next promotion">›</button>
          <div className="hero-dots" aria-hidden="true"><span /><span /><span /><span /></div>
        </section>

        <section className="categories-section" aria-labelledby="categories-title">
          <h2 id="categories-title">Explore Popular Categories</h2>
          <div className="category-row">
            {categories.map(([lineOne, lineTwo, icon]) => (
              <a className="category-item" href="#" key={`${lineOne}-${lineTwo}`}>
                <IconMark type={icon} />
                <span>{lineOne}<small>{lineTwo}</small></span>
              </a>
            ))}
          </div>
        </section>

        <section className="products-section" aria-labelledby="products-title">
          <h2 id="products-title">Featured Products</h2>
          <p className="section-subtitle">
            High-performance reagents designed to accelerate your research and deliver reliable results.
          </p>
          <div className="product-grid">
            {products.map(([name, price, visual, reviews]) => (
              <article className="product-card" key={name}>
                <ProductVisual type={visual} />
                <h3>{name}</h3>
                <p className="rating">★★★★★ <span>({reviews})</span></p>
                <p className="price">{price}</p>
                <a href="#">View Product <span>→</span></a>
              </article>
            ))}
          </div>
          <a className="view-all" href="#">View All Products <span>→</span></a>
        </section>

        <section className="products-section" aria-labelledby="gene-editing-products-title">
          <h2 id="gene-editing-products-title">Gene Editing Products</h2>
          <p className="section-subtitle">
            A comprehensive portfolio of tools for precise and efficient genome engineering, from CRISPR to viral vectors.
          </p>
          <div className="product-grid">
            {products.map(([name, price, visual, reviews]) => (
              <article className="product-card" key={`gene-editing-${name}`}>
                <ProductVisual type={visual} />
                <h3>{name}</h3>
                <p className="rating">★★★★★ <span>({reviews})</span></p>
                <p className="price">{price}</p>
                <a href="#">View Product <span>→</span></a>
              </article>
            ))}
          </div>
          <a className="view-all" href="#">View All Gene Editing <span>→</span></a>
        </section>

        <section className="products-section" aria-labelledby="services-title">
          <h2 id="services-title">Services</h2>
          <p className="section-subtitle">
            Partner with our expert team for tailored services that meet your unique project requirements.
          </p>
          <div className="product-grid">
            {products.map(([name, price, visual, reviews]) => (
              <article className="product-card" key={`services-${name}`}>
                <ProductVisual type={visual} />
                <h3>{name}</h3>
                <p className="rating">★★★★★ <span>({reviews})</span></p>
                <p className="price">{price}</p>
                <a href="#">View Service <span>→</span></a>
              </article>
            ))}
          </div>
          <a className="view-all" href="#">View All Services <span>→</span></a>
        </section>

        <section className="about-section" aria-labelledby="about-title">
          <div className="about-copy">
            <h2 id="about-title">About BioArkTech</h2>
            <p>
              BioArkTech is dedicated to empowering life science research with innovative,
              high-quality products. From molecular biology reagents to advanced instruments,
              we provide reliable solutions that drive discovery and accelerate breakthroughs.
            </p>
            <div className="trust-row">
              <span>Premium Quality</span>
              <span>Reliable Results</span>
              <span>Fast Shipping</span>
              <span>Expert Support</span>
            </div>
          </div>
          <div className="video-card" aria-label="Bio Ark Tech video preview">
            <img src={logo} alt="" />
            <div className="video-line" />
            <div className="video-controls"><span /> 0:00 / 1:25 <b /></div>
          </div>
        </section>

        <section className="resources-section" aria-labelledby="resources-title">
          <h2 id="resources-title">Resources & Blog</h2>
          <div className="resource-grid">
            {resources.map(([tag, title, date, readTime]) => (
              <article className="resource-card" key={title}>
                <div className="resource-image"><span>{tag}</span></div>
                <div className="resource-body">
                  <h3>{title}</h3>
                  <p>{date} <span>•</span> {readTime}</p>
                  <a href="#">Read More <span>→</span></a>
                </div>
              </article>
            ))}
          </div>
          <a className="view-all" href="#">View All Resources <span>→</span></a>
        </section>

        <section className="bulk-cta">
          <h2>Looking for Bulk Pricing?</h2>
          <p>Get exclusive discounts on large orders and custom solutions tailored to your needs.</p>
          <div>
            <a className="primary-button" href="/request-quote">Request a Quote</a>
            <a className="secondary-button" href="#">Contact Us <span>→</span></a>
          </div>
        </section>
      </main>
    </>
  )
}

function RequestQuotePage() {
  return (
    <main className="quote-page">
      <section className="quote-hero">
        <h1>Request a Quote</h1>
        <p>
          Get a customized quote for our products and services tailored to your research needs.
        </p>
      </section>

      <section className="quote-layout" aria-labelledby="quote-form-title">
        <div className="quote-panel">
          <h2 id="quote-form-title">Quote Request Form</h2>
          <p className="quote-form-intro">Please provide detailed information about your project requirements</p>
          <form className="quote-form">
            <label>
              First Name *
              <input type="text" name="firstName" required />
            </label>
            <label>
              Last Name *
              <input type="text" name="lastName" required />
            </label>
            <label>
              Email *
              <input type="email" name="email" required />
            </label>
            <label>
              Phone Number
              <input type="tel" name="phone" />
            </label>
            <label>
              Company/Institution *
              <input type="text" name="company" required />
            </label>
            <label>
              Department
              <input type="text" name="department" />
            </label>
            <label className="full-span">
              Service Type *
              <select name="serviceType" defaultValue="" required>
                <option value="" disabled>Select service type</option>
                <option>Featured Products</option>
                <option>Gene Editing Products</option>
                <option>Services</option>
                <option>Bulk Pricing</option>
              </select>
            </label>
            <label>
              Preferred Timeline
              <select name="timeline" defaultValue="">
                <option value="" disabled>Select timeline</option>
                <option>As soon as possible</option>
                <option>Within 2 weeks</option>
                <option>Within 1 month</option>
                <option>Flexible</option>
              </select>
            </label>
            <label>
              Budget Range (USD)
              <select name="budget" defaultValue="">
                <option value="" disabled>Select budget range</option>
                <option>Under $1,000</option>
                <option>$1,000 - $5,000</option>
                <option>$5,000 - $25,000</option>
                <option>$25,000+</option>
              </select>
            </label>
            <label className="full-span">
              Project Description *
              <textarea name="projectDescription" rows="6" placeholder="Please describe your project requirements, specific products needed, or services required..." required />
            </label>
            <label className="full-span">
              Additional Information
              <textarea name="additionalInformation" rows="5" placeholder="Any additional details, special requirements, or questions..." />
            </label>
            <button type="submit" className="primary-button">Submit Request</button>
          </form>
        </div>

        <aside className="quote-aside">
          <h2>What happens next?</h2>
          <p>We review your request, confirm any technical details, and prepare a tailored quote for your team.</p>
          <ul>
            <li>Product selection and availability guidance</li>
            <li>Bulk pricing and custom service options</li>
            <li>Support from BioArkTech specialists</li>
          </ul>
          <div className="immediate-assistance">
            <h2>Need Immediate Assistance?</h2>
            <p>Contact our team directly for urgent requests or technical consultations</p>
            <div className="assistance-grid">
              <div className="assistance-card">
                <strong>Phone</strong>
                <span>1-734-604-2386</span>
              </div>
              <div className="assistance-card">
                <strong>Email</strong>
                <span>support@bioarktech.com</span>
              </div>
              <div className="assistance-card">
                <strong>Response Time</strong>
                <span>Within 24 hours</span>
              </div>
            </div>
          </div>
          <a href="/" className="secondary-link">Back to homepage</a>
        </aside>
      </section>
    </main>
  )
}

function SiteFooter() {
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
            <a href="#">Gene Editing Tools</a>
            <a href="#">PCR & qPCR Reagents</a>
            <a href="#">Cell Culture</a>
            <a href="#">Electrophoresis</a>
            <a href="#">All Categories</a>
          </div>
          <div>
            <h3>Customer Service</h3>
            <a href="#">Order Tracking</a>
            <a href="#">Shipping & Delivery</a>
            <a href="#">Returns & Refunds</a>
            <a href="#">FAQs</a>
            <a href="#">Product Support</a>
          </div>
          <div>
            <h3>Company</h3>
            <a href="#">About BioArkTech</a>
            <a href="#">Careers</a>
            <a href="#">News & Updates</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
          <div>
            <h3>Stay Updated</h3>
            <p>Subscribe to get the latest news, offers, and product updates.</p>
            <form className="newsletter">
              <input aria-label="Email address" placeholder="Enter your email" />
              <button type="submit">↗</button>
            </form>
          </div>
        </div>
        <p className="copyright">© 2026 BioArkTech. All rights reserved.</p>
      </footer>
  )
}

function App() {
  const isRequestQuotePage = window.location.pathname === '/request-quote'

  return (
    <div className="site-shell">
      <SiteHeader />
      {isRequestQuotePage ? <RequestQuotePage /> : <HomePage />}
      <SiteFooter />
    </div>
  )
}

export default App
