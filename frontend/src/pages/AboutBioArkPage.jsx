import React from 'react';

const highlights = [
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

const teamMembers = [
  {
    initials: 'LW',
    name: 'Dr. Lipeng Wu',
    role: 'Founder & CEO',
    bio: 'Dr. Lipeng Wu is the Founder & CEO of BioArk Technologies, an innovative biotechnology company established in Rockville, Maryland in 2025, specializing in gene editing services and the proprietary CRISPR Trinity Platform.',
  },
  {
    initials: 'JX',
    name: 'Dr. Jingwen Xu',
    role: 'Co-Founder & Chief Operating Officer',
    bio: 'Dr. Jingwen Xu, M.D., M.Sc., Ph.D., is a physician-scientist, entrepreneur, and biotechnology executive with over three decades of experience in clinical medicine, molecular biology, and translational research.',
  },
  {
    initials: 'MS',
    name: 'Dr. Mei Sun',
    role: 'Advisor (Neurosensory R&D, Government Funding & Commercialization)',
    bio: 'Dr. Mei Sun is an accomplished professional in neurosensory research and development, with extensive leadership experience in government biomedical research and technology commercialization.',
  },
];

function AboutBioArkPage() {
  return (
    <main className="why-bioark-page">
      <section className="why-bioark-hero">
        <h1>Why BioArk</h1>
        <p>Innovating genome engineering for real-world impact</p>
      </section>

      <section className="why-bioark-intro">
        <div className="why-bioark-copy">
          <h2>Who We Are</h2>
          <p>
            BioArk Technologies, established in January 2025 in Rockville, Maryland, is an
            innovative biotechnology company dedicated to transforming groundbreaking scientific
            discoveries into practical solutions. Our mission is to advance genome engineering and
            accelerate its clinical and translational applications.
          </p>
          <p>
            We provide a comprehensive suite of services, including molecular cloning, viral
            packaging, and stable cell line development, designed to accelerate progress in gene
            editing. By integrating advanced AI technologies, we deliver streamlined, customized
            solutions that enhance efficiency and improve overall customer experience.
          </p>
          <p>
            Our proprietary CRISPR Trinity Platform addresses complex genetic editing challenges
            and offers unique advantages in the development of universal CAR-T therapies and related
            applications. These capabilities are available through specialized services, licensing
            opportunities, and strategic partnerships.
          </p>
          <p>
            By bridging cutting-edge research with clinical application, BioArk Technologies is
            committed to transforming pioneering scientific discoveries into real-world healthcare
            solutions.
          </p>
        </div>

        <div className="why-bioark-highlights" aria-label="BioArk highlights">
          {highlights.map((item) => (
            <article className="why-highlight-card" key={item.title}>
              <span aria-hidden="true">{item.icon}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="team-section">
        <h2>Meet our Team</h2>
        <div className="team-card-grid">
          {teamMembers.map((member) => (
            <article className="team-card" key={member.name}>
              <div className="team-card-header">
                <div className="team-avatar" aria-hidden="true">{member.initials}</div>
                <div>
                  <h3>{member.name}</h3>
                  <p>{member.role}</p>
                </div>
              </div>
              <p>{member.bio}</p>
              <a href="#" onClick={(event) => event.preventDefault()}>Read more</a>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default AboutBioArkPage;
