import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';

function RequestQuotePage({ navigate, cart, onClearCart }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    department: '',
    serviceType: '',
    timeline: '',
    budget: '',
    projectDescription: '',
    additionalInformation: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (cart && cart.length > 0) {
      setFormData(prev => ({
        ...prev,
        serviceType: prev.serviceType || 'Featured Products',
      }));
    }
  }, [cart]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      // Map frontend fields to Django quote endpoint
      const payload = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        company: formData.company,
        department: formData.department,
        timeline: formData.timeline,
        budget: formData.budget,
        projectDescription: formData.projectDescription,
        additionalInfo: formData.additionalInformation,
        institution: formData.company,
        productType: formData.serviceType,
        serviceType: formData.serviceType,
        message: `Departamento: ${formData.department || 'N/A'}\nTiempo: ${formData.timeline}\nPresupuesto: ${formData.budget}\nDescripción: ${formData.projectDescription}\nInformación Adicional: ${formData.additionalInformation || 'Ninguna'}`
      };

      await apiFetch('/api/quote/', {
        method: 'POST',
        body: payload
      });

      setStatus({ type: 'success', message: '¡Tu cotización ha sido enviada con éxito! Nos pondremos en contacto contigo en breve.' });
      if (onClearCart) {
        onClearCart();
      }
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        department: '',
        serviceType: '',
        timeline: '',
        budget: '',
        projectDescription: '',
        additionalInformation: ''
      });
      setShowConfirmation(true);
      setStatus({ type: '', message: '' });
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Ocurrió un error al enviar el formulario.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    navigate('/');
  };

  return (
    <main className="quote-page">
      <section className="quote-hero">
        <h1>Request a Quote</h1>
        <p>Get a customized quote for our products and services tailored to your research needs.</p>
      </section>

      {showConfirmation && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="quote-confirmation-title">
          <div className="quote-confirmation-modal">
            <h2 id="quote-confirmation-title">Quote Request Submitted</h2>
            <p>Your quote request has been submitted successfully. Our team will review the details and contact you shortly.</p>
            <button type="button" className="primary-button" onClick={handleConfirmationClose}>
              Close
            </button>
          </div>
        </div>
      )}

      <section className="quote-layout" aria-labelledby="quote-form-title">
        <div className="quote-panel">
          <h2 id="quote-form-title">Quote Request Form</h2>
          <p className="quote-form-intro">Please provide detailed information about your project requirements</p>
          
          {status.message && (
            <div className={`alert-banner ${status.type}`}>
              {status.message}
            </div>
          )}

          <form className="quote-form" onSubmit={handleFormSubmit}>
            <label>
              First Name *
              <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
            </label>
            <label>
              Last Name *
              <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
            </label>
            <label>
              Email *
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
            </label>
            <label>
              Phone Number
              <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} />
            </label>
            <label>
              Company/Institution *
              <input type="text" name="company" value={formData.company} onChange={handleInputChange} required />
            </label>
            <label>
              Department
              <input type="text" name="department" value={formData.department} onChange={handleInputChange} />
            </label>
            <label className="full-span">
              Service Type *
              <select name="serviceType" value={formData.serviceType} onChange={handleInputChange} required>
                <option value="">Select service type</option>
                <option value="Featured Products">Featured Products</option>
                <option value="Gene Editing Products">Gene Editing Products</option>
                <option value="Services">Services</option>
                <option value="Bulk Pricing">Bulk Pricing</option>
              </select>
            </label>
            <label>
              Preferred Timeline
              <select name="timeline" value={formData.timeline} onChange={handleInputChange}>
                <option value="">Select timeline</option>
                <option value="As soon as possible">As soon as possible</option>
                <option value="Within 2 weeks">Within 2 weeks</option>
                <option value="Within 1 month">Within 1 month</option>
                <option value="Flexible">Flexible</option>
              </select>
            </label>
            <label>
              Budget Range (USD)
              <select name="budget" value={formData.budget} onChange={handleInputChange}>
                <option value="">Select budget range</option>
                <option value="Under $1,000">Under $1,000</option>
                <option value="$1,000 - $5,000">$1,000 - $5,000</option>
                <option value="$5,000 - $25,000">$5,000 - $25,000</option>
                <option value="$25,000+">$25,000+</option>
              </select>
            </label>
            <label className="full-span">
              Project Description *
              <textarea name="projectDescription" value={formData.projectDescription} onChange={handleInputChange} rows="6" placeholder="Please describe your project requirements..." required />
            </label>
            <label className="full-span">
              Additional Information
              <textarea name="additionalInformation" value={formData.additionalInformation} onChange={handleInputChange} rows="5" placeholder="Any additional details..." />
            </label>
            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting ? 'Sending...' : 'Submit Request'}
            </button>
          </form>
        </div>

        <aside className="quote-aside">
          <h2>What happens next?</h2>
          <p>We review your request, confirm any technical details, and prepare a tailored quote for your team.</p>
          <ul>
            <li>Product selection and availability guidance</li>
            <li>Bulk pricing and custom service options</li>
            <li>Support from BioArkTech specialists</li>
          </ul>
          <div className="immediate-assistance">
            <h2>Need Immediate Assistance?</h2>
            <p>Contact our team directly for urgent requests or technical consultations</p>
            <div className="assistance-grid">
              <div className="assistance-card">
                <strong>Phone</strong>
                <span>1-734-604-2386</span>
              </div>
              <div className="assistance-card">
                <strong>Email</strong>
                <span>support@bioarktech.com</span>
              </div>
              <div className="assistance-card">
                <strong>Response Time</strong>
                <span>Within 24 hours</span>
              </div>
            </div>
          </div>
          <a href="/" className="secondary-link" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Back to homepage</a>
        </aside>
      </section>
    </main>
  );
}

export default RequestQuotePage;
