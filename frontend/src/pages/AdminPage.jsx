import React from 'react';

function AdminPage() {
  const adminLinks = [
    'Overview',
    'Homepage',
    'Users',
    'Products',
    'Featured Products',
    'Reagents',
    'Services',
    'Blog',
    'Quotes',
    'Email (SMTP)',
    'Media',
  ];

  return (
    <main className="admin-page" aria-label="Admin Console">
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <nav>
          {adminLinks.map((label) => (
            <a href={`#${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} key={label}>
              {label}
            </a>
          ))}
        </nav>
      </aside>

      <section className="admin-content" aria-labelledby="admin-content-title">
        <h2 id="admin-content-title">Overview</h2>
        <div className="admin-link-list">
          {adminLinks.map((label) => (
            <a href={`#${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} key={label}>
              {label}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}

export default AdminPage;
