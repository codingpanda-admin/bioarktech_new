import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

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

function AdminPage() {
  const [activeSection, setActiveSection] = useState('Overview');
  const [activeUserTab, setActiveUserTab] = useState('Admin User');
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(true);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(true);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminUsersError, setAdminUsersError] = useState('');
  const [customerUsers, setCustomerUsers] = useState([]);
  const [customerUsersLoading, setCustomerUsersLoading] = useState(false);
  const [customerUsersError, setCustomerUsersError] = useState('');
  const homepageSettings = ['Background Images', 'Hero Text', 'CTA Button', 'Metrics'];

  useEffect(() => {
    if (activeSection !== 'Users' || activeUserTab !== 'Admin User') {
      return;
    }

    const loadAdminUsers = async () => {
      setAdminUsersLoading(true);
      setAdminUsersError('');

      try {
        const data = await apiFetch('/api/users/admin-users/');
        const users = data.users || [];
        setAdminUsers(users.filter((user) => user.isAdmin === true || user.is_admin === true));
      } catch (err) {
        setAdminUsersError(err.message || 'Unable to load administrator users.');
      } finally {
        setAdminUsersLoading(false);
      }
    };

    loadAdminUsers();
  }, [activeSection, activeUserTab]);

  useEffect(() => {
    if (activeSection !== 'Users' || activeUserTab !== 'Customers') {
      return;
    }

    const loadCustomerUsers = async () => {
      setCustomerUsersLoading(true);
      setCustomerUsersError('');

      try {
        const data = await apiFetch('/api/users/customer-users/');
        const users = data.users || [];
        setCustomerUsers(users.filter((user) => user.isAdmin === false || user.is_admin === false));
      } catch (err) {
        setCustomerUsersError(err.message || 'Unable to load customers.');
      } finally {
        setCustomerUsersLoading(false);
      }
    };

    loadCustomerUsers();
  }, [activeSection, activeUserTab]);

  return (
    <main className="admin-page" aria-label="Admin Console">
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <nav>
          {adminLinks.map((label) => (
            <a
              className={activeSection === label ? 'is-active' : undefined}
              href={`#${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
              key={label}
              onClick={(event) => {
                event.preventDefault();
                setActiveSection(label);
              }}
            >
              {label}
            </a>
          ))}
        </nav>
      </aside>

      <section className="admin-content" aria-labelledby="admin-content-title">
        {activeSection === 'Homepage' ? (
          <>
            <h2 id="admin-content-title">Homepage Settings</h2>
            <div className="homepage-settings-grid">
              {homepageSettings.map((section) => (
                <article className="homepage-setting-card" key={section}>
                  <h3>{section}</h3>
                </article>
              ))}
            </div>
          </>
        ) : activeSection === 'Users' ? (
          <>
            <h2 id="admin-content-title">Users</h2>
            <div className="admin-tabs" role="tablist" aria-label="User type">
              <button
                className={activeUserTab === 'Admin User' ? 'is-active' : undefined}
                type="button"
                role="tab"
                aria-selected={activeUserTab === 'Admin User'}
                onClick={() => setActiveUserTab('Admin User')}
              >
                Admin User
              </button>
              <button
                className={activeUserTab === 'Customers' ? 'is-active' : undefined}
                type="button"
                role="tab"
                aria-selected={activeUserTab === 'Customers'}
                onClick={() => setActiveUserTab('Customers')}
              >
                Customers
              </button>
            </div>
            {activeUserTab === 'Admin User' ? (
              <section className="admin-form-section collapsible-section" aria-labelledby="add-admin-title">
                <button
                  className="collapsible-header"
                  type="button"
                  aria-expanded={isAddAdminOpen}
                  aria-controls="add-admin-panel"
                  onClick={() => setIsAddAdminOpen((isOpen) => !isOpen)}
                >
                  <span id="add-admin-title">Add Admin</span>
                  <span aria-hidden="true">{isAddAdminOpen ? '−' : '+'}</span>
                </button>
                {isAddAdminOpen && (
                  <form className="admin-user-form" id="add-admin-panel">
                    <label>
                      Email
                      <input type="email" name="adminEmail" placeholder="admin@bioarktech.com" />
                    </label>
                    <label>
                      Full name (optional)
                      <input type="text" name="adminFullName" placeholder="Full name" />
                    </label>
                    <label>
                      Password
                      <input type="password" name="adminPassword" placeholder="Create a password" />
                    </label>
                    <button className="primary-button" type="submit">Add Admin</button>
                  </form>
                )}
                <section className="admin-table-section" aria-labelledby="admin-user-list-title">
                  <h3 id="admin-user-list-title">Administrator Users</h3>
                  {adminUsersLoading ? (
                    <div className="admin-empty-table">Loading administrator users...</div>
                  ) : adminUsersError ? (
                    <div className="alert-banner error">{adminUsersError}</div>
                  ) : adminUsers.length === 0 ? (
                    <div className="admin-empty-table">No administrator users yet.</div>
                  ) : (
                    <div className="admin-data-table-wrap">
                      <table className="admin-data-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Company</th>
                            <th>Phone</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminUsers.map((user) => {
                            const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Not provided';
                            const phone = user.mobile || user.telephone || 'Not provided';

                            return (
                              <tr key={user.id || user.email}>
                                <td>{fullName}</td>
                                <td>{user.email}</td>
                                <td>{user.company || 'Not provided'}</td>
                                <td>{phone}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </section>
            ) : (
              <>
                <section className="admin-form-section collapsible-section" aria-labelledby="add-customer-title">
                  <button
                    className="collapsible-header"
                    type="button"
                    aria-expanded={isAddCustomerOpen}
                    aria-controls="add-customer-panel"
                    onClick={() => setIsAddCustomerOpen((isOpen) => !isOpen)}
                  >
                    <span id="add-customer-title">Add Customer</span>
                    <span aria-hidden="true">{isAddCustomerOpen ? '−' : '+'}</span>
                  </button>
                  {isAddCustomerOpen && (
                    <form className="admin-user-form customer-form" id="add-customer-panel">
                      <label>
                        Email
                        <input type="email" name="customerEmail" placeholder="customer@example.com" />
                      </label>
                      <label>
                        Full name (optional)
                        <input type="text" name="customerFullName" placeholder="Full name" />
                      </label>
                      <label>
                        Password
                        <input type="password" name="customerPassword" placeholder="Create a password" />
                      </label>
                      <label className="full-span">
                        Address (optional)
                        <textarea name="customerAddress" rows="4" placeholder="Street address, city, state, ZIP" />
                      </label>
                      <label>
                        Status
                        <select name="customerStatus" defaultValue="Active">
                          <option>Active</option>
                          <option>Inactive</option>
                          <option>Suspended</option>
                        </select>
                      </label>
                      <button className="primary-button" type="submit">Add Customer</button>
                    </form>
                  )}
                </section>
                <section className="admin-table-section" aria-labelledby="client-user-title">
                  <h3 id="client-user-title">Customers</h3>
                  {customerUsersLoading ? (
                    <div className="admin-empty-table">Loading customers...</div>
                  ) : customerUsersError ? (
                    <div className="alert-banner error">{customerUsersError}</div>
                  ) : customerUsers.length === 0 ? (
                    <div className="admin-empty-table">No customers yet.</div>
                  ) : (
                    <div className="admin-data-table-wrap">
                      <table className="admin-data-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Company</th>
                            <th>Phone</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerUsers.map((user) => {
                            const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Not provided';
                            const phone = user.mobile || user.telephone || 'Not provided';

                            return (
                              <tr key={user.id || user.email}>
                                <td>{fullName}</td>
                                <td>{user.email}</td>
                                <td>{user.company || 'Not provided'}</td>
                                <td>{phone}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            )}
          </>
        ) : activeSection === 'Email (SMTP)' ? (
          <>
            <h2 id="admin-content-title">SMTP Configuration</h2>
            <form className="smtp-form">
              <div className="smtp-grid">
                <label>
                  Host
                  <input type="text" name="smtpHost" defaultValue="smtp.gmail.com" />
                </label>
                <label>
                  Port
                  <input type="text" name="smtpPort" defaultValue="465" />
                </label>
              </div>
              <label className="smtp-check">
                <input type="checkbox" name="smtpSecure" defaultChecked />
                Secure (TLS/SSL)
              </label>
              <div className="smtp-grid">
                <label>
                  User
                  <input type="email" name="smtpUser" defaultValue="wulipeng@gmail.com" />
                </label>
                <label>
                  Password
                  <input type="password" name="smtpPassword" placeholder="SMTP password" />
                </label>
                <label>
                  From Email
                  <input type="email" name="smtpFromEmail" defaultValue="wulipeng@gmail.com" />
                </label>
                <label>
                  Admin To Emails
                  <input type="text" name="smtpAdminEmails" defaultValue="Lipengwu@bioarktech.com" />
                </label>
              </div>

              <section className="smtp-template-section" aria-labelledby="full-form-template-title">
                <h3 id="full-form-template-title">Full Form Email Template</h3>
                <p>Used by the full “Request a Quote” form.</p>
                <label>
                  Subject
                  <input type="text" name="fullSubject" defaultValue="New Quote (Full) from {{firstName}} {{lastName}} — {{serviceType}}" />
                </label>
                <label>
                  HTML Body
                  <textarea
                    name="fullBody"
                    rows="10"
                    defaultValue={`<h2>New Quote (Full) Notification</h2>\n<p><strong>Name:</strong> {{firstName}} {{lastName}}</p>\n<p><strong>Email:</strong> {{email}}</p>\n{{#if phone}}<p><strong>Phone:</strong> {{phone}}</p>{{/if}}\n<p><strong>Company:</strong> {{company}}</p>\n{{#if department}}<p><strong>Department:</strong> {{department}}</p>{{/if}}\n<p><strong>Service:</strong> {{serviceType}}</p>\n<p><strong>Description:</strong> {{projectDescription}}</p>`}
                  />
                </label>
                <button type="button" className="smtp-test-button">Test Full</button>
              </section>

              <section className="smtp-template-section" aria-labelledby="product-template-title">
                <h3 id="product-template-title">Product Quote Email Template</h3>
                <p>Used by the simplified product quote form (name, email, and product info only).</p>
                <label>
                  Subject
                  <input type="text" name="productSubject" defaultValue="New Product Quote from {{firstName}} {{lastName}}" />
                </label>
                <label>
                  HTML Body
                  <textarea
                    name="productBody"
                    rows="8"
                    defaultValue={`<h2>New Product Quote</h2>\n<p><strong>Name:</strong> {{firstName}} {{lastName}}</p>\n<p><strong>Email:</strong> {{email}}</p>\n<hr/>\n<p><strong>Product:</strong> {{projectDescription}}</p>\n{{#if catalogNumber}}<p><strong>Catalog #:</strong> {{catalogNumber}}</p>{{/if}}`}
                  />
                </label>
                <button type="button" className="smtp-test-button">Test Product</button>
              </section>

              <p className="smtp-help">
                {'Template syntax: variables like {{key}}; conditionals {{#if key}}...{{/if}}.'}
                Available keys: firstName, lastName, email, phone, company, department, serviceType, timeline,
                budget, projectDescription, additionalInfo, createdAt, and for product template, catalogNumber.
              </p>

              <div className="smtp-actions">
                <button type="button" className="secondary-admin-button">Send Test (Default)</button>
                <button type="submit" className="primary-button">Save</button>
              </div>

              <p className="smtp-note">
                Note: After deployment, the server will use the above configuration to send emails via SMTP.
                The frontend only stores these settings and exposes them for the server to read/use.
              </p>
            </form>
          </>
        ) : (
          <>
            <h2 id="admin-content-title">{activeSection}</h2>
            <div className="admin-link-list">
              {adminLinks.map((label) => (
                <a
                  href={`#${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                  key={label}
                  onClick={(event) => {
                    event.preventDefault();
                    setActiveSection(label);
                  }}
                >
                  {label}
                </a>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default AdminPage;
