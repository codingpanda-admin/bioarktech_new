import { useEffect, useRef, useState } from 'react';
import { apiFetch, formatAssetUrl } from '../utils/api';
import { formatRichText } from '../utils/richText';

const RichContent = ({ value, className = '' }) => (
  <div
    className={`page-rich-text ${className}`.trim()}
    dangerouslySetInnerHTML={{ __html: formatRichText(value) }}
  />
);

const defaultHighlights = [
  {
    icon: '▦',
    title: 'Founded 2025 • Rockville, MD',
    text: 'Established to advance genome engineering into real-world applications.',
  },
  {
    icon: '⚗',
    title: 'Comprehensive gene editing services',
    text: 'Molecular cloning, viral packaging, stable cell line development.',
  },
  {
    icon: '✣',
    title: 'Proprietary CRISPR Trinity Platform',
    text: 'Designed for complex editing and universal CAR-T strategies.',
  },
  {
    icon: '⚙',
    title: 'AI-enhanced, tailored solutions',
    text: 'Streamlined workflows for efficiency and better experiences.',
  },
  {
    icon: '♢',
    title: 'Clinical & translational focus',
    text: 'Bridging cutting-edge research with practical healthcare solutions.',
  },
];

const defaultTeamMembers = [
  {
    initials: 'LW',
    name: 'Dr. Lipeng Wu',
    role: 'Founder & CEO',
    image: 'media/profile_pics/Headshot-1-Lipeng-300x300.jpg',
    bio: 'Dr. Lipeng Wu is the Founder & CEO of BioArk Technologies, an innovative biotechnology company established in Rockville, Maryland in 2025, specializing in gene editing services and the proprietary CRISPR Trinity Platform.',
    fullBio: [
      'Dr. Lipeng Wu is the Founder & CEO of BioArk Technologies, an innovative biotechnology company established in Rockville, Maryland in 2025, specializing in gene editing services and the proprietary CRISPR-Trinity platform. With over 21 years of research experience in molecular biology, cell biology, and cancer biology across both academic and industry settings, he brings deep expertise in genome engineering, viral vector systems, and CAR-T therapy development.',
      'Dr. Wu’s career bridges both academic research and the biotechnology industry. He held research fellowships at the NIH and the University of Michigan, where he published multiple high-impact papers in Molecular Cell and Molecular and Cellular Biology on epigenetics and chromatin biology. He later served as Senior Scientist and Product Manager at Origene Technologies, where he led the development of advanced CRISPR technologies including base editing and prime editing, as well as viral vector production and stable cell line platforms.',
      'Today, Dr. Wu leverages his expertise in CRISPR genome editing, molecular cloning, viral vector design, stable cell line engineering, and AI-driven biotechnology to lead BioArk Technologies. As a scientific innovator and business leader, he has directed research teams, product pipelines, and strategic partnerships to bridge fundamental discoveries with real-world healthcare solutions.',
    ],
  },
  {
    initials: 'JX',
    name: 'Dr. Jingwen Xu',
    role: 'Co-Founder & Chief Operating Officer',
    image: 'media/profile_pics/Jingwen-Xu-HeadShot.jpg',
    bio: 'Dr. Jingwen Xu, M.D., M.Sc., Ph.D., is a physician-scientist, entrepreneur, and biotechnology executive with over three decades of experience in clinical medicine, molecular biology, and translational research.',
    fullBio: [
      'Dr. Jingwen Xu, M.D., M.Sc., Ph.D., is a physician-scientist, entrepreneur, and biotechnology executive with over three decades of experience in clinical medicine, molecular biology, and translational research. He is the Co-Founder and Chief Operating Officer of BioArk Technologies and also serves as Chief Executive Officer of EGFIE, a company specializing in the marketing and distribution of molecular laboratory consumables, kits, reagents, and equipment.',
      'Dr. Xu completed his postdoctoral research at the University of Helsinki, focusing on biomedicine and orthopaedics. He then served as a Senior Research Scientist at the Albert Einstein College of Medicine, where he conducted studies in rheumatology, oncology, and molecular signaling pathways. He later joined Georgetown University as an Instructor and Assistant Professor, advancing research in molecular biology and immunology.',
      'In addition to his academic appointments, Dr. Xu has held leadership roles in both research and industry. As CEO of Himalayan Biotech and later EGFIE, he has successfully bridged scientific innovation with business development. At BioArk Technologies, he plays a pivotal role in advancing next-generation CRISPR-based platforms and CAR-T therapeutic strategies, integrating laboratory management expertise with commercial strategy.',
      'Today, Dr. Xu combines deep scientific expertise with entrepreneurial leadership to drive innovation at the intersection of biotechnology, clinical application, and commercial development.',
    ],
  },
  {
    initials: 'MS',
    name: 'Dr. Mei Sun',
    role: 'Advisor (Neurosensory R&D, Government Funding & Commercialization)',
    image: 'media/profile_pics/Mei-Sun.jpeg',
    bio: 'Dr. Mei Sun is an accomplished professional in neurosensory research and development, with extensive leadership experience in government biomedical research and technology commercialization.',
    fullBio: [
      'Dr. Mei Sun is an accomplished professional in the field of neurosensory research and development, with extensive leadership experience in government biomedical research and technology commercialization.',
      'Most recently, in 2025 Dr. Sun founded Heyma Consulting LLC, a firm dedicated to helping startups and established companies pursue government funding opportunities, including DoD, NIH, NSF, and state-level programs. Through this venture, she provides strategic guidance on securing SBIR, OTA, and BAA funding, as well as commercialization strategy and proposal development.',
      'In 2024, Dr. Sun served as Program Manager at the Defense Health Agency (DHA), where she oversaw the Sensory Program, a Department of Defense research portfolio advancing innovations in sensory injury prevention, diagnostics, and treatment. Prior to this role, Dr. Sun was the Neurosensory Portfolio Manager at the US Army Medical Research and Development Command (USMRDC), where she managed Science & Technology funding for a broad range of neurosensory research projects. She also held the role of Program Manager for the Congressionally Directed Medical Research Program’s (CDMRP) Other Transaction Authority (OTA) program, where she facilitated the entire funding cycle—from solicitation announcements through post-award management—enhancing collaboration between agencies and advancing critical research.',
      'Dr. Sun’s expertise extends beyond neurosensory research. From 2017 to 2019, she served as Portfolio Manager for the Medical Simulation and Information Sciences Research Program (MSISRP), managing an annual budget of over twenty million dollars in science and technology funding, and leading collaborations across DoD commands, government agencies, academia, and industry. From 2014 to 2017, Dr. Sun was Senior Scientist and Principal Investigator at the US Army Medical Research Institute of Infectious Diseases (USAMRIID). Earlier in her career, she was a research scientist at the Janelia Research Campus, HHMI (2010–2014), and completed her post-doctoral training at Genentech, Inc. (2008–2010). Dr. Sun earned her PhD in Biology and MBA in Management from UCSD in 2007 and trained with renowned scientists including Nobel laureates Dr. Roger Tsien and Dr. Eric Betzig, contributing to 20+ publications in Science, Nature Cell Biology, Nature Methods, and Nature Microbiology. Beyond her professional career, Dr. Sun serves on the Board of Directors of FITCI, a leading biotech incubator in Frederick, Maryland.',
    ],
  },
  {
    initials: 'DY',
    name: 'Dezhong Yin, Ph.D.',
    role: 'Director of R&D and Product Development',
    image: 'media/profile_pics/Dezhong-Yin.jpg',
    bio: 'A biotechnology leader with more than 20 years of experience spanning cell and molecular biology, stem cells, viral vectors, and product innovation. At BioArk, Dr. Yin leads R&D and the development of innovative products and technologies.',
    fullBio: [
      'Dezhong Yin, Ph.D., is a biotechnology leader with more than 20 years of experience in cell biology, molecular biology, stem cell biology, viral vector development, and biotechnology product innovation. At BioArk Technologies, he leads research and development initiatives and drives the development of innovative products and technologies.',
      'Prior to joining BioArk, Dr. Yin served as Director and Department Head of Molecular Biology at OriGene Technologies, where he led multiple R&D teams responsible for the development and commercialization of stable cell lines, AAV and lentiviral products, DNA clones, CAR-T target and effector cells, and CRISPR-based technologies.',
      'Before OriGene, Dr. Yin spent 12 years at ATCC as Lead Scientist and Manager of Stem Cell and Primary Cell R&D. There, he directed multidisciplinary teams in developing and commercializing human induced pluripotent stem cells (iPSCs), primary cells, cancer organoids, and exosome products.',
      'Earlier in his career, Dr. Yin worked at Vericel Corporation, focusing on in vivo bone marrow mesenchymal stem cell (MSC) tracking and the production of cGMP-compliant MSCs for clinical applications. He also completed a postdoctoral fellowship at GSK, where his research focused on microbiology and antibiotic discovery.',
      'Dr. Yin earned his Ph.D. from The Pennsylvania State University and has authored 27 peer-reviewed scientific publications.',
    ],
  },
];

const defaultOverview = {
  page_title: 'Why BioArk',
  page_subtitle: 'Innovating genome engineering for real-world impact',
  section_title: 'Who We Are',
  paragraphs: [
    'BioArk Technologies, established in January 2025 in Rockville, Maryland, is an innovative biotechnology company dedicated to transforming groundbreaking scientific discoveries into practical solutions. Our mission is to advance genome engineering and accelerate its clinical and translational applications.',
    'We provide a comprehensive suite of services, including molecular cloning, viral packaging, and stable cell line development, designed to accelerate progress in gene editing. By integrating advanced AI technologies, we deliver streamlined, customized solutions that enhance efficiency and improve overall customer experience.',
    'Our proprietary CRISPR Trinity Platform addresses complex genetic editing challenges and offers unique advantages in the development of universal CAR-T therapies and related applications. These capabilities are available through specialized services, licensing opportunities, and strategic partnerships.',
    'By bridging cutting-edge research with clinical application, BioArk Technologies is committed to transforming pioneering scientific discoveries into real-world healthcare solutions.',
  ],
};

function AboutBioArkPage() {
  const [overview, setOverview] = useState(defaultOverview);
  const [highlights, setHighlights] = useState(defaultHighlights);
  const [teamMembers, setTeamMembers] = useState(defaultTeamMembers);
  const [selectedMember, setSelectedMember] = useState(null);
  const modalCloseButtonRef = useRef(null);
  const biographyTriggerRef = useRef(null);

  const closeBiography = () => {
    setSelectedMember(null);
    window.setTimeout(() => biographyTriggerRef.current?.focus(), 0);
  };

  useEffect(() => {
    let cancelled = false;

    apiFetch('/api/interface/about-page/')
      .then((data) => {
        if (cancelled) return;
        if (Object.hasOwn(data, 'overview')) setOverview(data.overview);
        if (Array.isArray(data.highlights)) setHighlights(data.highlights);
        if (Array.isArray(data.team_members)) {
          setTeamMembers(data.team_members.map((member) => ({
            ...member,
            image: member.image_url,
            bio: member.short_bio,
            fullBio: Array.isArray(member.full_bio) ? member.full_bio : [],
          })));
        }
      })
      .catch(() => {
        // Keep the bundled content available if the content API is temporarily unavailable.
      });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedMember) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeBiography();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    modalCloseButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedMember]);

  return (
    <main className="why-bioark-page">
      {overview && <section className="why-bioark-hero">
        <h1>{overview.page_title}</h1>
        <p>{overview.page_subtitle}</p>
      </section>}

      {overview && <section className="why-bioark-intro">
        <h2 className="why-bioark-section-title">{overview.section_title}</h2>
        <div className="why-bioark-intro-content">
          <div className="why-bioark-copy">
            {(overview.paragraphs || []).map((paragraph, index) => (
              <RichContent key={`${index}-${paragraph.slice(0, 24)}`} value={paragraph} />
            ))}
          </div>

          <div className="why-bioark-highlights" aria-label="BioArk highlights">
            {highlights.map((item) => (
              <article className="why-highlight-card" key={item.title}>
                <span aria-hidden="true">{item.icon}</span>
                <div>
                  <h3>{item.title}</h3>
                  <RichContent value={item.text} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>}

      <section className="team-section">
        <h2>Meet our Team</h2>
        <div className="team-card-grid">
          {teamMembers.map((member) => (
            <article className="team-card" key={member.name}>
              <div className="team-card-header">
                {member.image ? (
                  <img
                    className="team-avatar team-avatar-image"
                    src={formatAssetUrl(member.image)}
                    alt={`Portrait of ${member.name}`}
                  />
                ) : (
                  <div className="team-avatar" aria-hidden="true">{member.initials}</div>
                )}
                <div>
                  <h3>{member.name}</h3>
                  <p>{member.role}</p>
                </div>
              </div>
              <RichContent className="team-card-biography" value={member.bio} />
              {member.fullBio ? (
                <button
                  type="button"
                  className="team-read-more"
                  onClick={(event) => {
                    biographyTriggerRef.current = event.currentTarget;
                    setSelectedMember(member);
                  }}
                >
                  Read More
                </button>
              ) : (
                <a className="team-read-more" href="#" onClick={(event) => event.preventDefault()}>Read more</a>
              )}
            </article>
          ))}
        </div>
      </section>

      {selectedMember && (
        <div
          className="team-bio-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeBiography();
            }
          }}
        >
          <section
            className="team-bio-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-bio-modal-title"
          >
            <button
              ref={modalCloseButtonRef}
              type="button"
              className="team-bio-modal-close"
              aria-label={`Close biography for ${selectedMember.name}`}
              onClick={closeBiography}
            >
              ×
            </button>
            <header className="team-bio-modal-header">
              {selectedMember.image ? (
                <img
                  className="team-bio-modal-image"
                  src={formatAssetUrl(selectedMember.image)}
                  alt=""
                />
              ) : (
                <div className="team-avatar" aria-hidden="true">{selectedMember.initials}</div>
              )}
              <div>
                <h2 id="team-bio-modal-title">{selectedMember.name}</h2>
                <p>{selectedMember.role}</p>
              </div>
            </header>
            <div className="team-bio-modal-copy">
              {selectedMember.fullBio.map((paragraph, index) => (
                <RichContent key={`${index}-${paragraph.slice(0, 24)}`} value={paragraph} />
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default AboutBioArkPage;
