import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';

function AdminSmtp() {
  const [config, setConfig] = useState({
    use_google_oauth: true,
    google_client_id: '',
    google_client_secret: '',
    google_refresh_token: '',
    sender_email: 'wulipeng@gmail.com',
    admin_to_emails: 'Lipengwu@bioarktech.com',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    user: 'wulipeng@gmail.com',
    password: '',
    from_email: 'wulipeng@gmail.com',
    full_subject: 'New Quote (Full) from {{firstName}} {{lastName}} — {{serviceType}}',
    full_body: `<h2>New Quote (Full) Notification</h2>\n<p><strong>Name:</strong> {{firstName}} {{lastName}}</p>\n<p><strong>Email:</strong> {{email}}</p>\n{{#if phone}}<p><strong>Phone:</strong> {{phone}}</p>{{/if}}\n<p><strong>Company:</strong> {{company}}</p>\n{{#if department}}<p><strong>Department:</strong> {{department}}</p>{{/if}}\n<p><strong>Service:</strong> {{serviceType}}</p>\n<p><strong>Description:</strong> {{projectDescription}}</p>`,
    product_subject: 'New Product Quote from {{firstName}} {{lastName}}',
    product_body: `<h2>New Product Quote</h2>\n<p><strong>Name:</strong> {{firstName}} {{lastName}}</p>\n<p><strong>Email:</strong> {{email}}</p>\n<hr/>\n<p><strong>Product:</strong> {{projectDescription}}</p>\n{{#if catalogNumber}}<p><strong>Catalog #:</strong> {{catalogNumber}}</p>{{/if}}`,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [authCode, setAuthCode] = useState('');
  const [exchangingCode, setExchangingCode] = useState(false);
  const [selectedRedirectUri, setSelectedRedirectUri] = useState('https://developers.google.com/oauthplayground');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/admin-panel/smtp-config/');
      if (data) {
        setConfig(prev => ({
          ...prev,
          ...data,
          password: data.password || '',
          google_client_secret: data.google_client_secret || '',
          google_refresh_token: data.google_refresh_token || '',
        }));
      }
    } catch (err) {
      console.error('Failed to load Email config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await apiFetch('/api/admin-panel/smtp-config/update/', {
        method: 'POST',
        body: config
      });
      setMessage({ type: 'success', text: res.message || 'Email & Google OAuth 2.0 configuration saved successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to save configuration.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async (templateType) => {
    setTesting(templateType);
    setMessage({ type: '', text: '' });

    try {
      const res = await apiFetch('/api/admin-panel/smtp-config/send-test/', {
        method: 'POST',
        body: { template_type: templateType }
      });
      setMessage({ type: 'success', text: res.message || 'Test email sent successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to send test email.' });
    } finally {
      setTesting('');
    }
  };

  if (loading) {
    return <div className="admin-spinner">Loading Email settings...</div>;
  }

  return (
    <>
      <h2 id="admin-content-title">Email Notification Configuration</h2>

      {message.text && (
        <div className={`alert-banner ${message.type === 'error' ? 'error' : 'success'}`}>
          {message.text}
        </div>
      )}

      <form className="smtp-form" onSubmit={handleSubmit}>
        <section className="smtp-template-section" style={{ marginBottom: '24px', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 8px 0', color: 'var(--blue)' }}>🔑 Google OAuth 2.0 Email Dispatch</h3>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '16px' }}>
            Use Google Console OAuth 2.0 credentials (Client ID, Client Secret, Refresh Token) to dispatch automated notification emails securely without basic SMTP passwords.
          </p>

          <label className="smtp-check" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            <input
              type="checkbox"
              name="use_google_oauth"
              checked={config.use_google_oauth}
              onChange={handleChange}
            />
            Enable Google OAuth 2.0 Email Sending (XOAUTH2)
          </label>

          {config.use_google_oauth && (
            <div className="smtp-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <label style={{ gridColumn: 'span 2' }}>
                Sender Email Address (Authorized Gmail / Google Workspace)
                <input
                  type="email"
                  name="sender_email"
                  value={config.sender_email}
                  onChange={handleChange}
                  placeholder="e.g. wulipeng@gmail.com"
                  required={config.use_google_oauth}
                />
              </label>
              <label>
                Google Client ID
                <input
                  type="text"
                  name="google_client_id"
                  value={config.google_client_id || ''}
                  onChange={handleChange}
                  placeholder="1047155694294-xxx.apps.googleusercontent.com"
                  required={config.use_google_oauth}
                />
              </label>
              <label>
                Google Client Secret
                <input
                  type="password"
                  name="google_client_secret"
                  value={config.google_client_secret || ''}
                  onChange={handleChange}
                  placeholder="GOCSPX-xxx"
                  required={config.use_google_oauth}
                />
              </label>
              <div style={{ gridColumn: 'span 2', background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontWeight: 600, margin: 0 }}>Google Refresh Token</label>
                  <button
                    type="button"
                    className="secondary-admin-button"
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                    onClick={() => {
                      if (!config.google_client_id) {
                        alert('Por favor ingresa primero tu Google Client ID.');
                        return;
                      }
                      const cleanClientId = config.google_client_id.trim();
                      const redirectUri = selectedRedirectUri || 'https://developers.google.com/oauthplayground';
                      const scope = encodeURIComponent('https://mail.google.com/');
                      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(cleanClientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
                      window.open(authUrl, '_blank');
                      setShowCodeModal(true);
                    }}
                  >
                    ⚡ Generar Google Refresh Token automáticamente
                  </button>
                </div>

                <div style={{ margin: '8px 0 12px 0', fontSize: '12px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span>Redirect URI a usar en Google Console:</span>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', margin: 0, fontWeight: 500 }}>
                    <input
                      type="radio"
                      name="redirect_choice"
                      checked={selectedRedirectUri === 'https://developers.google.com/oauthplayground'}
                      onChange={() => setSelectedRedirectUri('https://developers.google.com/oauthplayground')}
                    />
                    OAuth Playground (https://developers.google.com/oauthplayground)
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', margin: 0, fontWeight: 500 }}>
                    <input
                      type="radio"
                      name="redirect_choice"
                      checked={selectedRedirectUri === window.location.origin}
                      onChange={() => setSelectedRedirectUri(window.location.origin)}
                    />
                    Local ({window.location.origin})
                  </label>
                </div>

                <textarea
                  name="google_refresh_token"
                  rows="3"
                  value={config.google_refresh_token || ''}
                  onChange={handleChange}
                  placeholder="1//04xxx... El Refresh Token se guardará aquí automáticamente al generar"
                />
              </div>
            </div>
          )}
        </section>

        {showCodeModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: 'min(520px, 90%)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginTop: 0, color: 'var(--blue)' }}>🔑 Intercambiar Código de Autorización de Google</h3>
              <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: '1.4' }}>
                1. Al hacer clic se abrió la ventana de autorización.<br/>
                2. Copia el código de autorización otorgado por Google (ej. <code>4/0AX4Xf...</code>).<br/>
                3. Pégalo aquí abajo para generar y autoguardar tu Refresh Token:
              </p>

              <label style={{ display: 'block', margin: '16px 0 8px 0', fontWeight: 600 }}>
                Authorization Code / URL
                <input
                  type="text"
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  placeholder="Pegue aquí el código o la URL completa con code=..."
                  style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '6px', border: '1px solid #ccc' }}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="secondary-admin-button"
                  onClick={() => setShowCodeModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="primary-button"
                  disabled={exchangingCode || !authCode}
                  onClick={async () => {
                    setExchangingCode(true);
                    try {
                      let rawCode = authCode.trim();
                      if (rawCode.includes('code=')) {
                        const urlObj = new URL(rawCode.startsWith('http') ? rawCode : 'http://dummy/' + rawCode);
                        rawCode = urlObj.searchParams.get('code') || rawCode;
                      }

                      const res = await apiFetch('/api/admin-panel/smtp-config/exchange-code/', {
                        method: 'POST',
                        body: {
                          code: rawCode,
                          client_id: config.google_client_id.trim(),
                          client_secret: config.google_client_secret.trim(),
                          redirect_uri: selectedRedirectUri
                        }
                      });

                      if (res.refresh_token) {
                        setConfig(prev => ({ ...prev, google_refresh_token: res.refresh_token }));
                        setMessage({ type: 'success', text: '¡Google Refresh Token generado y vinculado exitosamente!' });
                        setShowCodeModal(false);
                        setAuthCode('');
                      } else {
                        alert(res.message || 'No se obtuvo el refresh token.');
                      }
                    } catch (err) {
                      alert('Error al generar el refresh token: ' + (err.message || 'Verifica Client ID y Secret'));
                    } finally {
                      setExchangingCode(false);
                    }
                  }}
                >
                  {exchangingCode ? 'Generando...' : 'Obtener y Guardar Token'}
                </button>
              </div>
            </div>
          </div>
        )}

        <section className="smtp-template-section" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0 }}>Admin Notification Recipients</h3>
            <button
              type="button"
              className="secondary-admin-button"
              style={{ fontSize: '13px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              onClick={() => {
                const current = (config.admin_to_emails || '').split(',').map(e => e.strip ? e.strip() : e.trim()).filter(Boolean);
                current.push('');
                setConfig(prev => ({ ...prev, admin_to_emails: current.join(', ') }));
              }}
            >
              ➕ Add Recipient
            </button>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px' }}>
            Each email listed below will receive automated notifications when a new quote request is submitted.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {((config.admin_to_emails || '').split(',').map(e => e.trim()).length > 0
              ? (config.admin_to_emails || '').split(',').map(e => e.trim())
              : ['']
            ).map((emailItem, index, arr) => (
              <div key={index} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="email"
                  value={emailItem}
                  placeholder="e.g. admin@bioarktech.com"
                  onChange={(e) => {
                    const newArr = [...arr];
                    newArr[index] = e.target.value;
                    setConfig(prev => ({ ...prev, admin_to_emails: newArr.join(', ') }));
                  }}
                  required={index === 0}
                  style={{ flex: 1 }}
                />
                {arr.length > 1 && (
                  <button
                    type="button"
                    style={{
                      background: 'rgba(244, 63, 94, 0.1)',
                      color: '#e11d48',
                      border: '1px solid rgba(244, 63, 94, 0.3)',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      const newArr = arr.filter((_, i) => i !== index);
                      setConfig(prev => ({ ...prev, admin_to_emails: newArr.join(', ') }));
                    }}
                  >
                    🗑️ Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>


        {!config.use_google_oauth && (
          <section className="smtp-template-section" style={{ marginBottom: '24px' }}>
            <h3>Legacy SMTP Backup Configuration</h3>
            <div className="smtp-grid">
              <label>
                Host
                <input
                  type="text"
                  name="host"
                  value={config.host}
                  onChange={handleChange}
                  placeholder="smtp.gmail.com"
                />
              </label>
              <label>
                Port
                <input
                  type="number"
                  name="port"
                  value={config.port}
                  onChange={handleChange}
                  placeholder="465"
                />
              </label>
            </div>

            <label className="smtp-check">
              <input
                type="checkbox"
                name="secure"
                checked={config.secure}
                onChange={handleChange}
              />
              Secure (TLS/SSL)
            </label>

            <div className="smtp-grid">
              <label>
                User
                <input
                  type="email"
                  name="user"
                  value={config.user}
                  onChange={handleChange}
                  placeholder="wulipeng@gmail.com"
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  name="password"
                  value={config.password}
                  onChange={handleChange}
                  placeholder="App Password"
                />
              </label>
            </div>
          </section>
        )}

        <section className="smtp-template-section" aria-labelledby="full-form-template-title">
          <h3 id="full-form-template-title">Full Form Email Template</h3>
          <p>Used by the full “Request a Quote” form.</p>
          <label>
            Subject
            <input
              type="text"
              name="full_subject"
              value={config.full_subject}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            HTML Body
            <textarea
              name="full_body"
              rows="10"
              value={config.full_body}
              onChange={handleChange}
              required
            />
          </label>
          <button
            type="button"
            className="smtp-test-button"
            disabled={testing === 'full'}
            onClick={() => handleTestEmail('full')}
          >
            {testing === 'full' ? 'Sending...' : 'Test Full'}
          </button>
        </section>

        <section className="smtp-template-section" aria-labelledby="product-template-title">
          <h3 id="product-template-title">Product Quote Email Template</h3>
          <p>Used by the simplified product quote form (name, email, and product info only).</p>
          <label>
            Subject
            <input
              type="text"
              name="product_subject"
              value={config.product_subject}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            HTML Body
            <textarea
              name="product_body"
              rows="8"
              value={config.product_body}
              onChange={handleChange}
              required
            />
          </label>
          <button
            type="button"
            className="smtp-test-button"
            disabled={testing === 'product'}
            onClick={() => handleTestEmail('product')}
          >
            {testing === 'product' ? 'Sending...' : 'Test Product'}
          </button>
        </section>

        <p className="smtp-help">
          {'Template syntax: variables like {{key}}; conditionals {{#if key}}...{{/if}}.'}
          <br />
          Available keys: firstName, lastName, email, phone, company, department, serviceType, timeline,
          budget, projectDescription, additionalInfo, createdAt, and for product template, catalogNumber.
        </p>

        <div className="smtp-actions">
          <button
            type="button"
            className="secondary-admin-button"
            disabled={testing === 'default'}
            onClick={() => handleTestEmail('default')}
          >
            {testing === 'default' ? 'Sending...' : 'Send Test (Default)'}
          </button>
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        <p className="smtp-note">
          Note: The server will use the above configuration to send real notification emails via SMTP whenever a quote request is submitted.
        </p>
      </form>
    </>
  );
}

export default AdminSmtp;
