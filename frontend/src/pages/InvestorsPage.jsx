import { useEffect, useState } from 'react';
import { apiFetch, formatAssetUrl } from '../utils/api';
import { formatRichText } from '../utils/richText';

const RichContent = ({ value, className = '' }) => (
  <div
    className={`page-rich-text ${className}`.trim()}
    dangerouslySetInnerHTML={{ __html: formatRichText(value) }}
  />
);

const defaultStrategyCards = [
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

const defaultRoadmapCards = [
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

const defaultOverview = {
  page_title: 'Our Investors',
  page_subtitle: 'Partnering with visionary supporters to transform gene editing technologies and advance genetic medicine.',
  section_title: 'Company Overview & Vision',
  paragraphs: [
    'BioArk Technologies is an innovative biotechnology company committed to translating scientific breakthroughs into real-world healthcare solutions. We are evolving from a foundational service provider into an integrated medical solutions company.',
    'We leverage artificial intelligence (AI) to accelerate service delivery, advance our proprietary platform, and drive the creation of next-generation therapies.',
  ],
  image_url: '',
  image_alt: '',
};

const defaultPartner = {
  section_title: 'Partner with BioArk',
  text: 'We are seeking visionary partners to shape the future of genetic medicine. If you are interested in our business and share our commitment to innovation, we invite you to connect with us.',
  button_text: 'Contact Investor Relations',
  button_url: '/request-quote',
  button_target: '_self',
  button_style: 'primary',
  contact_email: 'investor@bioarktech.com',
};

function InvestorsPage({ navigate }) {
  const [overview, setOverview] = useState(defaultOverview);
  const [strategyCards, setStrategyCards] = useState(defaultStrategyCards);
  const [roadmapCards, setRoadmapCards] = useState(defaultRoadmapCards);
  const [partner, setPartner] = useState(defaultPartner);

  useEffect(() => {
    let cancelled = false;

    apiFetch('/api/interface/investor-page/')
      .then((data) => {
        if (cancelled) return;
        if (Object.hasOwn(data, 'overview')) setOverview(data.overview);
        if (Array.isArray(data.strategy_tiers)) setStrategyCards(data.strategy_tiers);
        if (Array.isArray(data.milestones)) {
          setRoadmapCards(data.milestones.map((item) => ({
            ...item,
            period: item.period_and_funding,
          })));
        }
        if (Object.hasOwn(data, 'partner')) setPartner(data.partner);
      })
      .catch(() => {
        // Keep the bundled content available if the content API is temporarily unavailable.
      });

    return () => { cancelled = true; };
  }, []);

  const handlePartnerButton = () => {
    const url = partner.button_url || '/request-quote';
    if (partner.button_target === '_blank') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (url.startsWith('/')) {
      navigate(url);
    } else {
      window.location.assign(url);
    }
  };

  return (
    <main className="investors-page">
      {overview && <section className="investors-hero">
        <h1>{overview.page_title}</h1>
        <p>{overview.page_subtitle}</p>
      </section>}

      {overview && <section className="investor-overview">
        <div className="investor-overview-copy">
          <h2>{overview.section_title}</h2>
          {(overview.paragraphs || []).map((paragraph, index) => (
            <RichContent key={`${index}-${paragraph.slice(0, 24)}`} value={paragraph} />
          ))}
        </div>

        {overview.image_url ? (
          <div className="investor-visuals investor-overview-image-wrap">
            <img src={formatAssetUrl(overview.image_url)} alt={overview.image_alt || ''} />
          </div>
        ) : <div className="investor-visuals" aria-label="Business and market visuals">
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
        </div>}
      </section>}

      <section className="investor-section">
        <h2>Our Three-Tiered Strategy</h2>
        <div className="investor-card-grid">
          {strategyCards.map((card) => (
            <article className="investor-info-card" key={card.title}>
              <h3><span>{card.icon}</span>{card.title}</h3>
              <p className="investor-card-subtitle">{card.subtitle}</p>
              <ul>
                {card.items.map((item, index) => (
                  <li
                    key={`${index}-${item.slice(0, 24)}`}
                    dangerouslySetInnerHTML={{ __html: formatRichText(item) }}
                  />
                ))}
              </ul>
              {card.note && <RichContent className="investor-card-note" value={card.note} />}
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
              <p><strong>Goal:</strong></p>
              <RichContent className="investor-roadmap-goal" value={card.goal} />
              <p><strong>Period & Funding:</strong> {card.period}</p>
            </article>
          ))}
        </div>
      </section>

      {partner && <section className="investor-partner-card">
        <h2>{partner.section_title}</h2>
        <RichContent value={partner.text} />
        <div>
          {partner.button_text && (
            <button
              type="button"
              className={partner.button_style === 'primary' ? 'primary-button' : `primary-button ${partner.button_style}`}
              onClick={handlePartnerButton}
            >
              {partner.button_text}
            </button>
          )}
          {partner.contact_email && <a href={`mailto:${partner.contact_email}`}>{partner.contact_email}</a>}
        </div>
      </section>}
    </main>
  );
}

export default InvestorsPage;
