import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/api';

const PRODUCT_SERVICE_TYPE = { id: 'products', label: 'Products' };

const emptyQuoteForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  company: '',
  department: '',
  serviceType: '',
  projectDescription: '',
  additionalInformation: ''
};

function QuoteRequestForm({
  cart,
  onClearCart,
  currentUser,
  currentUserProfile,
  quotePrefill,
  variant = 'quote',
  initialProjectDescription = '',
  initialServiceType = '',
  initialServiceCategoryId = '',
  onSubmitted
}) {
  const isContactForm = variant === 'contact';
  const [formData, setFormData] = useState(() => ({
    ...emptyQuoteForm,
    serviceType: isContactForm ? 'Contact Us' : '',
  }));
  const [serviceTypeOptions, setServiceTypeOptions] = useState([PRODUCT_SERVICE_TYPE]);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isContactForm) {
      return undefined;
    }

    let isMounted = true;

    apiFetch('/api/products/get-nav-catalog/')
      .then((catalog) => {
        if (!isMounted) return;

        const seen = new Set();
        const activeServiceCategories = (Array.isArray(catalog) ? catalog : [])
          .filter((category) => {
            const hasActiveService = (category?.subcategories || []).some((subcategory) => (
              (subcategory?.products || []).some((item) => (
                String(item?.product_id || '').startsWith('svc-')
              ))
            ));
            return Boolean(
              category?.category_id
              && category?.product_type === 'service'
              && hasActiveService
              && String(category?.category_name || '').trim()
            );
          })
          .map((category) => ({
            id: String(category.external_id || category.externalId || category.category_id),
            label: String(category.category_name).trim(),
          }))
          .filter((category) => {
            const key = category.label.toLocaleLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });

        const options = [PRODUCT_SERVICE_TYPE, ...activeServiceCategories];
        setServiceTypeOptions(options);
        setFormData((current) => {
          const normalizedCategoryId = String(initialServiceCategoryId || '').toLocaleLowerCase();
          const normalizedInitialType = String(initialServiceType || '').toLocaleLowerCase();
          const normalizedCurrentType = String(current.serviceType || '').toLocaleLowerCase();
          const selectedOption = options.find((option) => (
            (normalizedCategoryId && option.id.toLocaleLowerCase() === normalizedCategoryId)
            || (normalizedInitialType && option.label.toLocaleLowerCase() === normalizedInitialType)
            || (normalizedCurrentType && option.label.toLocaleLowerCase() === normalizedCurrentType)
          ));

          return {
            ...current,
            serviceType: selectedOption?.label || '',
          };
        });
      })
      .catch(() => {
        if (!isMounted) return;
        setServiceTypeOptions([PRODUCT_SERVICE_TYPE]);
        setFormData((current) => ({
          ...current,
          serviceType: current.serviceType === PRODUCT_SERVICE_TYPE.label
            ? current.serviceType
            : '',
        }));
      });

    return () => {
      isMounted = false;
    };
  }, [initialServiceCategoryId, initialServiceType, isContactForm]);

  useEffect(() => {
    if (isContactForm) {
      return;
    }

    const projectDescription = quotePrefill?.get('projectDescription') || initialProjectDescription;
    if (!projectDescription && !initialServiceType) {
      return;
    }

    setFormData(prev => ({
      ...prev,
      projectDescription: prev.projectDescription || projectDescription,
      serviceType: prev.serviceType || initialServiceType,
    }));
  }, [quotePrefill, initialProjectDescription, initialServiceType, isContactForm]);

  useEffect(() => {
    if (isContactForm) {
      return;
    }

    if (cart && cart.length > 0) {
      // Create a nice text list of products
      const itemsList = cart.map(item =>
        `- ${item.name} (${item.sku})${item.unitSize ? ` - ${item.unitSize}` : ''} x${item.quantity} ($${(item.price * item.quantity).toFixed(2)})`
      ).join('\n');

      const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const cartSummaryText = `[Productos Seleccionados]:\n${itemsList}\n\nSubtotal: $${subtotal.toFixed(2)}`;

      setFormData(prev => ({
        ...prev,
        projectDescription: prev.projectDescription || cartSummaryText,
        serviceType: prev.serviceType || 'Products',
      }));
    }
  }, [cart, isContactForm]);

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
      const payload = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        company: formData.company,
        department: formData.department,
        projectDescription: isContactForm ? '' : formData.projectDescription,
        additionalInfo: formData.additionalInformation,
        institution: formData.company,
        productType: isContactForm ? 'Contact Us' : formData.serviceType,
        serviceType: isContactForm ? 'Contact Us' : formData.serviceType
      };

      await apiFetch('/api/quotes/', {
        method: 'POST',
        body: payload
      });

      if (onClearCart) {
        onClearCart();
      }
      setFormData({
        ...emptyQuoteForm,
        serviceType: isContactForm ? 'Contact Us' : '',
      });
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
      <h2 id="quote-form-title">{isContactForm ? 'Contact Us Form' : 'Quote Request Form'}</h2>
      <p className="quote-form-intro">
        {isContactForm
          ? 'Send us a message and a member of our team will get back to you.'
          : 'Please provide detailed information about your project requirements'}
      </p>

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
        {!isContactForm && (
          <>
            <label className="full-span">
              Service Type *
              <select name="serviceType" value={formData.serviceType} onChange={handleInputChange} required>
                <option value="">Select service type</option>
                {serviceTypeOptions.map(serviceType => (
                  <option key={serviceType.id} value={serviceType.label}>{serviceType.label}</option>
                ))}
              </select>
            </label>
            <label className="full-span">
              Project Description *
              <textarea name="projectDescription" value={formData.projectDescription} onChange={handleInputChange} rows="6" placeholder="Please describe your project requirements..." required />
            </label>
          </>
        )}
        <label className="full-span">
          {isContactForm ? 'Message' : 'Additional Information'}
          <textarea
            name="additionalInformation"
            value={formData.additionalInformation}
            onChange={handleInputChange}
            rows="5"
            placeholder={isContactForm ? 'How can we help?' : 'Any additional details...'}
          />
        </label>
        <button type="submit" className="primary-button" disabled={submitting}>
          {submitting ? 'Sending...' : (isContactForm ? 'Send Message' : 'Submit Request')}
        </button>
      </form>
    </>
  );
}

export default QuoteRequestForm;
