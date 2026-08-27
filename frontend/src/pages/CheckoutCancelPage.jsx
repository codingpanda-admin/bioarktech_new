import { useEffect } from 'react';
import { apiFetch } from '../utils/api';

function CheckoutCancelPage({ navigate }) {
  useEffect(() => {
    const checkoutAttemptId = new URLSearchParams(window.location.search).get('attempt_id');
    if (!checkoutAttemptId) return;

    apiFetch('/api/orders/stripe/checkout-cancel/', {
      method: 'POST',
      body: { checkout_attempt_id: checkoutAttemptId },
    }).catch((error) => {
      console.error('Unable to close the cancelled checkout attempt:', error);
    });
  }, []);

  return (
    <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid var(--line)',
        padding: '48px 36px',
        textAlign: 'center',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</div>
        <h2 style={{ fontWeight: 700, marginBottom: '8px' }}>Payment Cancelled</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '32px', lineHeight: 1.6 }}>
          Your payment was not completed. Your cart items are still saved.
          You can try again whenever you're ready.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="primary-button"
            onClick={() => navigate('/cart')}
            style={{ padding: '12px 24px', borderRadius: '8px', fontWeight: 600 }}
          >
            Back to Cart
          </button>
          <button
            type="button"
            className="secondary-button checkout-secondary-button"
            onClick={() => navigate('/')}
            style={{ padding: '12px 24px', borderRadius: '8px', fontWeight: 600 }}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </main>
  );
}

export default CheckoutCancelPage;
