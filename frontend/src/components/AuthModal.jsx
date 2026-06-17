import React, { useState } from 'react';
import { apiFetch } from '../utils/api';

function AuthModal({ onClose, onLoginSuccess }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isRegisterMode ? '/api/signup/' : '/api/login/';
      const data = await apiFetch(endpoint, {
        method: 'POST',
        body: formData
      });

      if (isRegisterMode) {
        setIsRegisterMode(false);
        setError('¡Registro completado con éxito! Por favor inicia sesión.');
      } else {
        onLoginSuccess(formData.email);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Error en la autenticación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>{isRegisterMode ? 'Crear Cuenta' : 'Iniciar Sesión'}</h2>

        {error && (
          <div className={`alert-banner ${error.includes('éxito') ? 'success' : 'error'}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegisterMode && (
            <>
              <label>
                Nombre
                <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
              </label>
              <label>
                Apellido
                <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
              </label>
            </>
          )}
          <label>
            Email
            <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
          </label>
          <label>
            Contraseña
            <input type="password" name="password" value={formData.password} onChange={handleInputChange} required />
          </label>
          
          <div className="modal-actions">
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? 'Procesando...' : isRegisterMode ? 'Registrarme' : 'Entrar'}
            </button>
            <div className="auth-toggle-mode" onClick={() => setIsRegisterMode(!isRegisterMode)}>
              {isRegisterMode ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AuthModal;
