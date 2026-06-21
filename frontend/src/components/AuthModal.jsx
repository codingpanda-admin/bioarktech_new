import React, { useState } from 'react';
import { apiFetch } from '../utils/api';

function AuthModal({ onClose, onLoginSuccess }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [error, setError] = useState('');
  const [messageType, setMessageType] = useState('error');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessageType('error');

    if (isRegisterMode && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const endpoint = isRegisterMode ? '/api/signup/' : '/api/login/';
      const { confirmPassword, ...payload } = formData;
      const data = await apiFetch(endpoint, {
        method: 'POST',
        body: payload
      });

      if (isRegisterMode) {
        setIsRegisterMode(false);
        setMessageType('success');
        setError('Registration completed successfully. Please sign in.');
      } else {
        onLoginSuccess(formData.email);
        onClose();
      }
    } catch (err) {
      setMessageType('error');
      setError(isRegisterMode ? (err.message || 'Authentication failed.') : 'Failed to login, please check username and password again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>{isRegisterMode ? 'Create Account' : 'Sign In'}</h2>

        {error && (
          <div className={`alert-banner ${messageType}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegisterMode && (
            <>
              <label>
                First Name
                <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
              </label>
              <label>
                Last Name
                <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
              </label>
            </>
          )}
          <label>
            Email
            <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
          </label>
          <label>
            Password
            <input type="password" name="password" value={formData.password} onChange={handleInputChange} required />
          </label>
          {isRegisterMode && (
            <label>
              Confirm Password
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required />
            </label>
          )}
          
          <div className="modal-actions">
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Processing...' : isRegisterMode ? 'Create Account' : 'Login'}
            </button>
            <div className="auth-toggle-mode" onClick={() => setIsRegisterMode(!isRegisterMode)}>
              {isRegisterMode ? 'Already have an account? Sign in' : 'Need an account? Create one'}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AuthModal;
