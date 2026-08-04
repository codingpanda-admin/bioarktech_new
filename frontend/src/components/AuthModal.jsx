import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

function AuthModal({ onClose, onLoginSuccess, isPopupPage = false }) {
  // authMode can be: 'login', 'register', 'forgot'
  const [authMode, setAuthMode] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    addressLine1: '',
    addressLine2: '',
    aptSuite: '',
    city: '',
    state: '',
    zipcode: '',
    country: 'US'
  });
  const [error, setError] = useState('');
  const [messageType, setMessageType] = useState('error');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isStrongPassword = (password) => (
    password.length >= 8
    && /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z0-9]/.test(password)
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGoogleResponse = async (response) => {
    setLoading(true);
    setError('');
    setMessageType('error');

    try {
      const data = await apiFetch('/api/google-login/', {
        method: 'POST',
        body: { credential: response.credential }
      });

      onLoginSuccess(data.email);
    } catch (err) {
      setMessageType('error');
      setError(err.message || 'Failed to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  const renderGoogleButton = () => {
    if (window.google && (authMode === 'login' || authMode === 'register')) {
      try {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '1047155694294-1a3b4c5d6e7f8g9h0i.apps.googleusercontent.com',
          callback: handleGoogleResponse,
          auto_select: false
        });

        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          { 
            theme: "outline", 
            size: "large", 
            width: "100%", 
            text: authMode === 'register' ? 'signup_with' : 'signin_with' 
          }
        );
      } catch (err) {
        console.error("Error initializing Google Identity Services:", err);
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      renderGoogleButton();
    }, 150);
    return () => clearTimeout(timer);
  }, [authMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessageType('error');

    if (authMode === 'register') {
      if (!isStrongPassword(formData.password)) {
        setError('Create a stronger password with at least 8 characters, including uppercase, lowercase, a number, and a special character.');
        setLoading(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match.');
        setLoading(false);
        return;
      }
    }

    try {
      if (authMode === 'forgot') {
        const data = await apiFetch('/api/password-reset/', {
          method: 'POST',
          body: { email: formData.email }
        });
        setMessageType('success');
        setError(data.detail || 'If your email is registered, you will receive a password reset link shortly.');
      } else {
        const endpoint = authMode === 'register' ? '/api/signup/' : '/api/login/';
        const { confirmPassword, ...payload } = formData;
        const data = await apiFetch(endpoint, {
          method: 'POST',
          body: payload
        });

        if (authMode === 'register') {
          setAuthMode('login');
          setMessageType('success');
          setError('Registration completed successfully. Please sign in.');
        } else {
          onLoginSuccess(formData.email);
        }
      }
    } catch (err) {
      setMessageType('error');
      setError(err.message || 'Operation failed. Please review your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const modalWidth = authMode === 'register' ? 'min(640px, 95%)' : 'min(400px, 90%)';

  const modalInnerContent = (
    <div 
      className="auth-modal-content" 
      style={{ 
        position: 'relative',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      <button className="modal-close" onClick={onClose} style={{ top: '-10px', right: '-10px' }}>&times;</button>
      
      <h2 style={{ fontWeight: 700, borderBottom: '1px solid var(--line)', paddingBottom: '10px', marginBottom: '20px' }}>
        {authMode === 'login' && 'Sign In'}
        {authMode === 'register' && 'Create Account'}
        {authMode === 'forgot' && 'Reset Password'}
      </h2>

      {error && (
        <div className={`alert-banner ${messageType}`} style={{
          padding: '10px 14px',
          borderRadius: '8px',
          fontSize: '13px',
          marginBottom: '20px',
          background: messageType === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
          color: messageType === 'success' ? '#059669' : '#e11d48',
          border: `1px solid ${messageType === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* GOOGLE OAUTH BUTTON */}
        {(authMode === 'login' || authMode === 'register') && (
          <div style={{ marginBottom: '8px' }}>
            <div id="google-signin-btn" style={{ minHeight: '40px', display: 'flex', justifyContent: 'center' }}></div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              textAlign: 'center',
              margin: '16px 0',
              color: 'var(--muted)',
              fontSize: '12px'
            }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--line)' }}></div>
              <span style={{ padding: '0 10px', fontWeight: 500 }}>or also</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--line)' }}></div>
            </div>
          </div>
        )}

        {/* REGISTER FIELDS (GRID LAYOUT) */}
        {authMode === 'register' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--blue)', marginBottom: '12px' }}>🔑 Account Credentials</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label style={{ margin: 0, fontWeight: 500, fontSize: '13px' }}>
                  First Name *
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
                </label>
                <label style={{ margin: 0, fontWeight: 500, fontSize: '13px' }}>
                  Last Name *
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
                </label>
                <label style={{ margin: 0, gridColumn: 'span 2', fontWeight: 500, fontSize: '13px' }}>
                  Email Address *
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                </label>
                <label className="auth-password-field" style={{ margin: 0, fontWeight: 500, fontSize: '13px' }}>
                  Password *
                  <div className="auth-password-input-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      aria-describedby="registration-password-requirements"
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </label>
                <label className="auth-password-field" style={{ margin: 0, fontWeight: 500, fontSize: '13px' }}>
                  Confirm Password *
                  <div className="auth-password-input-wrap">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      minLength={8}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowConfirmPassword((visible) => !visible)}
                      aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
                    >
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </label>
                <p id="registration-password-requirements" className="auth-password-requirements">
                  Create a strong password with at least 8 characters, including uppercase, lowercase, a number, and a special character.
                </p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--blue)', marginBottom: '4px' }}>🚚 Shipping Address (Optional)</h3>
              <p style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '12px' }}>You can leave this blank and add a shipping address later.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <label style={{ margin: 0, gridColumn: 'span 2', fontWeight: 500, fontSize: '13px' }}>
                  Street Address
                  <input type="text" name="addressLine1" value={formData.addressLine1} onChange={handleInputChange} placeholder="e.g. 123 Main St" />
                </label>
                <label style={{ margin: 0, fontWeight: 500, fontSize: '13px' }}>
                  Apt / Suite / Suite
                  <input type="text" name="aptSuite" value={formData.aptSuite} onChange={handleInputChange} placeholder="e.g. Suite 400" />
                </label>
                <label style={{ margin: 0, fontWeight: 500, fontSize: '13px' }}>
                  City
                  <input type="text" name="city" value={formData.city} onChange={handleInputChange} />
                </label>
                <label style={{ margin: 0, fontWeight: 500, fontSize: '13px' }}>
                  State / Province
                  <input type="text" name="state" value={formData.state} onChange={handleInputChange} />
                </label>
                <label style={{ margin: 0, fontWeight: 500, fontSize: '13px' }}>
                  ZIP / Postal Code
                  <input type="text" name="zipcode" value={formData.zipcode} onChange={handleInputChange} />
                </label>
                <label style={{ margin: 0, gridColumn: 'span 2', fontWeight: 500, fontSize: '13px' }}>
                  Country
                  <input type="text" name="country" value={formData.country} onChange={handleInputChange} />
                </label>
              </div>
            </div>
          </div>
        ) : (
          /* LOGIN & FORGOT FIELDS */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label style={{ margin: 0, fontWeight: 500, fontSize: '13px' }}>
              Email Address
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
            </label>
            
            {authMode !== 'forgot' && (
              <label style={{ margin: 0, fontWeight: 500, fontSize: '13px' }}>
                Password
                <input type="password" name="password" value={formData.password} onChange={handleInputChange} required />
              </label>
            )}
          </div>
        )}
        
        <div className="modal-actions" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
          <button 
            type="submit" 
            className="primary-button" 
            disabled={loading} 
            style={{ width: '100%', padding: '12px', borderRadius: '8px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
          >
            {loading ? 'Processing...' : 
              authMode === 'login' ? 'Sign In with Email' : 
              authMode === 'register' ? 'Register Account' : 'Send Reset Link'}
          </button>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--muted)', cursor: 'pointer', marginTop: '4px' }}>
            {authMode === 'login' && (
              <>
                <span onClick={() => { setAuthMode('register'); setError(''); }} style={{ color: 'var(--blue)', fontWeight: 500 }}>Create new account</span>
                <span onClick={() => { setAuthMode('forgot'); setError(''); }}>Forgot password?</span>
              </>
            )}
            {authMode === 'register' && (
              <span onClick={() => { setAuthMode('login'); setError(''); }} style={{ color: 'var(--blue)', fontWeight: 500 }}>Already have an account? Sign In</span>
            )}
            {authMode === 'forgot' && (
              <span onClick={() => { setAuthMode('login'); setError(''); }} style={{ color: 'var(--blue)', fontWeight: 500 }}>Back to Sign In</span>
            )}
          </div>
        </div>
      </form>
    </div>
  );

  if (isPopupPage) {
    return (
      <div 
        style={{ 
          width: modalWidth, 
          background: '#fff', 
          borderRadius: '16px', 
          padding: '32px',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--line)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        {modalInnerContent}
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="auth-modal" 
        style={{ 
          width: modalWidth, 
          maxHeight: '90vh', 
          overflowY: 'auto',
          transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)' 
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        {modalInnerContent}
      </div>
    </div>
  );
}

export default AuthModal;
