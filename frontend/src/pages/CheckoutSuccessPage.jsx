import React, { useState, useEffect } from 'react';
import { API_URL, apiFetch } from '../utils/api';

function CheckoutSuccessPage({ navigate, onClearCart }) {
  const [status, setStatus] = useState('loading');
  const [sessionData, setSessionData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');

    if (!sessionId) {
      setStatus('error');
      setError('No session ID found.');
      return;
    }

    const verifyPayment = async () => {
      try {
        const data = await apiFetch(`/api/orders/stripe/checkout-success/?session_id=${sessionId}`);

        if (data.status === 'success') {
          setStatus('success');
          setSessionData(data);
          if (onClearCart) {
            onClearCart();
          }
        } else {
          setStatus('pending');
        }
      } catch (err) {
        setStatus('error');
        setError(err.message || 'Could not verify payment status.');
      }
    };

    verifyPayment();
  }, []);

  return (
    <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{
        maxWidth: '560px',
        width: '100%',
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid var(--line)',
        padding: '48px 36px',
        textAlign: 'center',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
      }}>
        {status === 'loading' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <h2 style={{ fontWeight: 700, marginBottom: '8px' }}>Verifying Payment...</h2>
            <p style={{ color: 'var(--muted)' }}>Please wait while we confirm your payment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }} aria-hidden="true">
              <span style={{
                width: '64px',
                height: '64px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                border: '2px solid #00A866',
                background: '#ECFDF5',
              }}>
                <span style={{
                  width: '15px',
                  height: '29px',
                  marginTop: '-7px',
                  borderRight: '5px solid #00A866',
                  borderBottom: '5px solid #00A866',
                  borderRadius: '2px',
                  transform: 'rotate(45deg)',
                }} />
              </span>
            </div>
            <h2 style={{ fontWeight: 700, marginBottom: '8px', color: '#059669' }}>Payment Successful!</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '24px', lineHeight: 1.6 }}>
              Thank you for your purchase. Your order has been confirmed and is being processed.
            </p>

            {sessionData && (
              <div style={{
                background: 'var(--panel)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--muted)', fontSize: '14px' }}>Session ID</span>
                  <span style={{ fontSize: '14px', fontWeight: 500, fontFamily: 'monospace' }}>{sessionData.session_id?.substring(0, 20)}...</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--muted)', fontSize: '14px' }}>Amount Paid</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--blue)' }}>${sessionData.amount_total?.toFixed(2)} {sessionData.currency?.toUpperCase()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)', fontSize: '14px' }}>Email</span>
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{sessionData.customer_email}</span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {sessionData?.order_id && (
                <a
                  href={`${API_URL}/api/orders/invoice/${sessionData.order_id}/html/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="primary-button"
                  style={{ padding: '12px 24px', borderRadius: '8px', fontWeight: 600, textDecoration: 'none' }}
                >
                  View Invoice
                </a>
              )}
              <button
                type="button"
                className="primary-button"
                onClick={() => navigate('/profile?tab=orders')}
                style={{ padding: '12px 24px', borderRadius: '8px', fontWeight: 600 }}
              >
                View My Orders
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
          </>
        )}

        {status === 'pending' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <h2 style={{ fontWeight: 700, marginBottom: '8px' }}>Payment Processing</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>
              Your payment is being processed. This may take a few moments.
            </p>
            <button
              type="button"
              className="primary-button"
              onClick={() => window.location.reload()}
              style={{ padding: '12px 24px', borderRadius: '8px', fontWeight: 600 }}
            >
              Refresh Status
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
            <h2 style={{ fontWeight: 700, marginBottom: '8px', color: '#dc2626' }}>Verification Failed</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '24px' }}>{error}</p>
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
                Go Home
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default CheckoutSuccessPage;
