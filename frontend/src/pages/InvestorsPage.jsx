import React from 'react';

const strategyCards = [
  {
    icon: '▣',
    title: 'Tier I: Solid Foundation',
    subtitle: 'Services & Products',
    items: [
      'AI-assisted molecular cloning and construct design',
      'High-quality viral packaging, including lentivirus workflows',
      'Stable cell line development and validation',
      'Related gene editing kits and reagents',
    ],
    note: 'This tier provides a stable revenue base and demonstrates strong technical execution.',
  },
  {
    icon: '▤',
    title: 'Tier II: Core Innovation',
    subtitle: 'CRISPR Trinity Platform (patent-pending)',
    items: [
      'A unified platform designed to integrate diverse CRISPR functions',
      'Supports complex gene-editing requirements in challenging contexts',
      'Business model: services, licensing, and strategic partnerships',
    ],
  },
  {
    icon: '⌁',
    title: 'Tier III: The Future',
    subtitle: 'Universal Bi-CAR-T Therapy',
    items: [
      'Engineer universal Bi-CAR-T cells with dual receptors',
      'Addresses high cost and single-target limitations of current CAR-T',
      'Reduces reliance on patient-derived cells with universal templates',
      'Primary applications: cancer and immune-related diseases',
    ],
  },
];

const roadmapCards = [
  {
    phase: 'Phase 1',
    goal: 'CRISPR Trinity product development — a unified platform for complex gene-editing.',
    period: '1 Year, $300k',
  },
  {
    phase: 'Phase 2',
    goal: 'Universal Bi-CAR-T research service — engineer universal CAR-T template cells using the platform.',
    period: '2 Years, $1M',
  },
  {
    phase: 'Phase 3',
    goal: 'Therapeutic CAR-T service — translate research into therapeutic applications.',
    period: '3 Years, $3M',
  },
];

function InvestorsPage({ navigate }) {
  return (
    <main className="investors-page">
      <section className="investors-hero">
        <h1>Our Investors</h1>
        <p>
          Partnering with visionary supporters to transform gene editing technologies and advance
          genetic medicine.
        </p>
      </section>

      <section className="investor-overview">
        <div className="investor-overview-copy">
          <h2>Company Overview & Vision</h2>
          <p>
            BioArk Technologies is an innovative biotechnology company committed to translating
            scientific breakthroughs into real-world healthcare solutions. We are evolving from a
            foundational service provider into an integrated medical solutions company.
          </p>
          <p>
            We leverage artificial intelligence (AI) to accelerate service delivery, advance our
            proprietary platform, and drive the creation of next-generation therapies.
          </p>
        </div>

        <div className="investor-visuals" aria-label="Business and market visuals">
          <div className="business-timeline-card">
            <h3>BIOARK</h3>
            <p>Business Timeline</p>
            <div className="timeline-row">
              <strong>$10M</strong>
              <span>2024-2025</span>
              <b>Tier I Services</b>
            </div>
            <div className="timeline-row">
              <strong>$30M</strong>
              <span>2026-2027</span>
              <b>Tier II Platform Licensing</b>
            </div>
            <div className="timeline-row">
              <strong>$60M</strong>
              <span>2028-2030</span>
              <b>Tier III Therapeutic Development</b>
            </div>
          </div>

          <div className="market-growth-card">
            <h3>CAR-T Therapy Market Growth</h3>
            <div className="market-bars" aria-hidden="true">
              <span style={{ height: '28%' }} />
              <span style={{ height: '42%' }} />
              <span style={{ height: '54%' }} />
              <span style={{ height: '70%' }} />
              <span style={{ height: '88%' }} />
            </div>
            <div className="market-years">
              <span>2024</span>
              <span>2025</span>
              <span>2026</span>
              <span>2027</span>
              <span>2028</span>
            </div>
          </div>
        </div>
      </section>

      <section className="investor-section">
        <h2>Our Three-Tiered Strategy</h2>
        <div className="investor-card-grid">
          {strategyCards.map((card) => (
            <article className="investor-info-card" key={card.title}>
              <h3><span>{card.icon}</span>{card.title}</h3>
              <p className="investor-card-subtitle">{card.subtitle}</p>
              <ul>
                {card.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {card.note && <p className="investor-card-note">{card.note}</p>}
            </article>
          ))}
        </div>
      </section>

      <section className="investor-section">
        <h2>Development Roadmap & Milestones</h2>
        <div className="investor-roadmap-grid">
          {roadmapCards.map((card) => (
            <article className="investor-roadmap-card" key={card.phase}>
              <h3><span>□</span>{card.phase}</h3>
              <p><strong>Goal:</strong> {card.goal}</p>
              <p><strong>Period & Funding:</strong> {card.period}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="investor-partner-card">
        <h2>Partner with BioArk</h2>
        <p>
          We are seeking visionary partners to shape the future of genetic medicine. If you are
          interested in our business and share our commitment to innovation, we invite you to connect
          with us.
        </p>
        <div>
          <button type="button" className="primary-button" onClick={() => navigate('/request-quote')}>
            Contact Investor Relations
          </button>
          <a href="mailto:investor@bioarktech.com">investor@bioarktech.com</a>
        </div>
      </section>
    </main>
  );
}

export default InvestorsPage;
