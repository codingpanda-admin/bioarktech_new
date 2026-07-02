import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';
import { SERVICES_CATEGORIES } from '../data/catalogCategories';

const SERVICE_TYPE_OPTIONS = [
  'Products',
  ...SERVICES_CATEGORIES.map(category => category.label)
];

const emptyQuoteForm = {
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
};

function QuoteRequestForm({
  cart,
  onClearCart,
  currentUser,
  currentUserProfile,
  quotePrefill,
  initialProjectDescription = '',
  initialServiceType = '',
  onSubmitted
}) {
  const [formData, setFormData] = useState(emptyQuoteForm);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const projectDescription = quotePrefill?.get('projectDescription') || initialProjectDescription;
    if (!projectDescription && !initialServiceType) {
      return;
    }

    setFormData(prev => ({
      ...prev,
      projectDescription: prev.projectDescription || projectDescription,
      serviceType: prev.serviceType || initialServiceType,
    }));
  }, [quotePrefill, initialProjectDescription, initialServiceType]);

  useEffect(() => {
    if (cart && cart.length > 0) {
      // Create a nice text list of products
      const itemsList = cart.map(item =>
        `- ${item.name} (${item.sku})${item.unitSize ? ` - ${item.unitSize}` : ''} x${item.quantity} ($${(item.price * item.quantity).toFixed(2)})`
      ).join('\n');

      const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

      // Separate items into groups to calculate shipping
      const consumableItems = cart.filter(item => item.shippingCost === 100);
      const reagentItems = cart.filter(item => item.shippingCost !== 100 && item.shippingCost !== 0);

      const subtotalConsumables = consumableItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const subtotalReagents = reagentItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

      let shippingConsumables = 0;
      let shippingReagents = 0;
      const hasConsumables = consumableItems.length > 0;
      const hasReagents = reagentItems.length > 0;

      if (hasConsumables) {
        const shippingSubtotal = subtotalConsumables + subtotalReagents;
        if (shippingSubtotal <= 2000) {
          shippingConsumables = 100;
        } else {
          shippingConsumables = Math.min(700, 100 + Math.ceil((shippingSubtotal - 2000) / 1000) * 60);
        }
      } else if (hasReagents) {
        if (subtotalReagents <= 1000) {
          shippingReagents = 60;
        } else {
          shippingReagents = Math.min(300, 60 + Math.ceil((subtotalReagents - 1000) / 500) * 30);
        }
      }

      const totalShipping = shippingConsumables + shippingReagents;
      const grandTotal = subtotal + totalShipping;

      const cartSummaryText = `[Productos Seleccionados]:\n${itemsList}\n\nSubtotal: $${subtotal.toFixed(2)}\nEnvio Consumibles: $${shippingConsumables.toFixed(2)}\nEnvio Reactivos: $${shippingReagents.toFixed(2)}\nEnvio Total: $${totalShipping.toFixed(2)}\nTotal Estimado: $${grandTotal.toFixed(2)}`;

      setFormData(prev => ({
        ...prev,
        projectDescription: prev.projectDescription || cartSummaryText,
        serviceType: prev.serviceType || 'Products',
      }));
    }
  }, [cart]);

  useEffect(() => {
    if (!currentUser && !currentUserProfile) {
      return;
    }

    setFormData(prev => ({
      ...prev,
      firstName: prev.firstName || currentUserProfile?.first_name || '',
      lastName: prev.lastName || currentUserProfile?.last_name || '',
      email: prev.email || currentUserProfile?.email || currentUser || '',
      phone: prev.phone || currentUserProfile?.mobile || currentUserProfile?.telephone || '',
      company: prev.company || currentUserProfile?.company || '',
      department: prev.department || currentUserProfile?.department || '',
    }));
  }, [currentUser, currentUserProfile]);

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
        message: `Departamento: ${formData.department || 'N/A'}\nTiempo: ${formData.timeline}\nPresupuesto: ${formData.budget}\nDescripcion: ${formData.projectDescription}\nInformacion Adicional: ${formData.additionalInformation || 'Ninguna'}`
      };

      await apiFetch('/api/quotes/', {
        method: 'POST',
        body: payload
      });

      if (onClearCart) {
        onClearCart();
      }
      setFormData(emptyQuoteForm);
      setStatus({ type: '', message: '' });
      if (onSubmitted) {
        onSubmitted();
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Ocurrio un error al enviar el formulario.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
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
            {SERVICE_TYPE_OPTIONS.map(serviceType => (
              <option key={serviceType} value={serviceType}>{serviceType}</option>
            ))}
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
    </>
  );
}

export default QuoteRequestForm;
