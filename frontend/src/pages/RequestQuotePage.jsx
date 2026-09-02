import React, { useEffect, useState } from 'react';
import QuoteRequestForm from '../components/QuoteRequestForm';

function RequestQuotePage({ navigate, cart, onClearCart, currentUser, currentUserProfile, quotePrefill, mode = 'quote' }) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const isContactPage = mode === 'contact';
  const quoteContext = `${mode}:${quotePrefill?.toString() || 'default'}`;
  const isCartQuote = !isContactPage && quotePrefill?.get('source') === 'cart';

  useEffect(() => {
    if (isContactPage) {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [isContactPage]);

  const handleConfirmationClose = () => {
    setShowConfirmation(false);
    navigate('/');
  };

  return (
    <main className="quote-page">
      <section className="quote-hero">
        <h1>{isContactPage ? 'Contact Us' : 'Request a Quote'}</h1>
        <p>
          {isContactPage
            ? 'Have a question? Send us a message and our team will be happy to help.'
            : 'Get a customized quote for our products and services tailored to your research needs.'}
        </p>
      </section>

      {showConfirmation && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="quote-confirmation-title">
          <div className="quote-confirmation-modal">
            <h2 id="quote-confirmation-title">{isContactPage ? 'Message Sent' : 'Quote Request Submitted'}</h2>
            <p>
              {isContactPage
                ? 'Your message has been sent successfully. A member of our team will contact you shortly.'
                : 'Your quote request has been submitted successfully. Our team will review the details and contact you shortly.'}
            </p>
            <button type="button" className="primary-button" onClick={handleConfirmationClose}>
              Close
            </button>
          </div>
        </div>
      )}

      <section className="quote-layout" aria-labelledby="quote-form-title">
        <div className="quote-panel">
          <QuoteRequestForm
            key={quoteContext}
            cart={isCartQuote ? cart : []}
            onClearCart={isCartQuote ? onClearCart : undefined}
            currentUser={currentUser}
            currentUserProfile={currentUserProfile}
            quotePrefill={quotePrefill}
            variant={mode}
            onSubmitted={() => setShowConfirmation(true)}
          />
        </div>

        <aside className="quote-aside">
          <h2>What happens next?</h2>
          <p>
            {isContactPage
              ? 'Our team will review your message and connect you with the right BioArkTech specialist.'
              : 'We review your request, confirm any technical details, and prepare a tailored quote for your team.'}
          </p>
          {isContactPage ? (
            <ul>
              <li>Product and service questions</li>
              <li>Technical guidance and support</li>
              <li>Order and account assistance</li>
            </ul>
          ) : (
            <ul>
              <li>Product selection and availability guidance</li>
              <li>Bulk pricing and custom service options</li>
              <li>Support from BioArkTech specialists</li>
            </ul>
          )}
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
