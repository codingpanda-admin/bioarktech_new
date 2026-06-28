import React from 'react';
import { formatAssetUrl, logo } from '../utils/api';

function CartPage({ 
  navigate, 
  cart, 
  onUpdateQty, 
  onRemoveItem, 
  onClearCart,
  currentUser,
  onOpenAuth
}) {
  const isCartEmpty = cart.length === 0;

  // 1. Classify Items
  const consumableItems = cart.filter((item) => item.shippingCost === 100);
  const reagentItems = cart.filter((item) => item.shippingCost === 60);
  const serviceItems = cart.filter((item) => !item.shippingCost || item.shippingCost === 0);

  // 2. Subtotals
  const subtotalConsumables = consumableItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const subtotalReagents = reagentItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const subtotalServices = serviceItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const subtotal = subtotalConsumables + subtotalReagents + subtotalServices;

  // 3. Shipping Cost Calculations
  let shippingConsumables = 0;
  let explanationConsumables = '';
  let shippingReagents = 0;
  let explanationReagents = '';

  const hasConsumables = consumableItems.length > 0;
  const hasReagents = reagentItems.length > 0;

  if (hasConsumables) {
    // Treat the entire shipping subtotal (consumables + reagents) under consumables rules
    const shippingSubtotal = subtotalConsumables + subtotalReagents;
    
    if (shippingSubtotal <= 2000) {
      shippingConsumables = 100;
      explanationConsumables = `Base fee $100.00 (Shipping Subtotal <= $2,000.00)`;
    } else {
      const additionalBlocks = Math.ceil((shippingSubtotal - 2000) / 1000);
      const calculated = 100 + additionalBlocks * 60;
      shippingConsumables = Math.min(700, calculated);
      
      if (calculated >= 700) {
        explanationConsumables = `Maximum fee reached: $700.00 (Starting from $12,000.00)`;
      } else {
        explanationConsumables = `Base $100.00 + $60.00 x ${additionalBlocks} block(s) of $1000 over $2000`;
      }
    }
    
    if (hasReagents) {
      explanationReagents = `Included in Consumables shipping fee`;
    }
  } else if (hasReagents) {
    // Only reagents in cart
    if (subtotalReagents <= 1000) {
      shippingReagents = 60;
      explanationReagents = `Base fee $60.00 (Reagents Subtotal <= $1,000.00)`;
    } else {
      const additionalBlocks = Math.ceil((subtotalReagents - 1000) / 500);
      const calculated = 60 + additionalBlocks * 30;
      shippingReagents = Math.min(300, calculated);
      
      if (calculated >= 300) {
        explanationReagents = `Maximum fee reached: $300.00 (Starting from $5,000.00)`;
      } else {
        explanationReagents = `Base $60.00 + $30.00 x ${additionalBlocks} block(s) of $500 over $1000`;
      }
    }
  }

  const totalShipping = shippingConsumables + shippingReagents;
  const grandTotal = subtotal + totalShipping;

  return (
    <main style={{ minHeight: '60vh', paddingBottom: '60px' }}>
      {/* Premium Inline Styles */}
      <style>{`
        .shipping-rule-card {
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.03), rgba(30, 41, 59, 0.01));
          border: 1px dashed var(--line);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
          font-size: 14px;
          color: var(--ink);
        }
        .shipping-rule-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          margin-bottom: 8px;
          color: var(--blue);
        }
        .shipping-rule-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 768px) {
          .shipping-rule-grid {
            grid-template-columns: 1fr;
          }
        }
        .shipping-rule-item {
          background: #fff;
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 12px;
        }
        .shipping-rule-item strong {
          color: var(--ink);
          display: block;
          margin-bottom: 4px;
        }
        .category-group-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--panel);
          border-radius: 12px;
          margin-top: 24px;
          margin-bottom: 12px;
          border-left: 4px solid var(--blue);
        }
        .category-group-header.consumables {
          border-left-color: #f43f5e;
          background: rgba(244, 63, 94, 0.03);
        }
        .category-group-header.reagents {
          border-left-color: #10b981;
          background: rgba(16, 185, 129, 0.03);
        }
        .category-group-header.services {
          border-left-color: #3b82f6;
          background: rgba(59, 130, 246, 0.03);
        }
        .category-title {
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .category-subtotal-bar {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 24px;
          padding: 16px;
          background: rgba(0,0,0,0.01);
          border-top: 1px solid var(--line);
          font-size: 14px;
          color: var(--muted);
        }
        .category-shipping-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          font-weight: 500;
          font-size: 13px;
        }
        .category-shipping-badge.consumables {
          background: rgba(244, 63, 94, 0.1);
          color: #e11d48;
        }
        .category-shipping-badge.reagents {
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
        }
        .category-shipping-badge.services {
          background: rgba(59, 130, 246, 0.1);
          color: #2563eb;
        }
        .shipping-detail-explanation {
          display: block;
          font-size: 11px;
          color: var(--muted);
          margin-top: 2px;
          font-style: italic;
        }
      `}</style>

      <div style={{ width: 'min(1200px, calc(100% - 48px))', margin: '40px auto' }}>
        <h2 style={{ marginBottom: '24px', fontWeight: 700 }}>Shopping Cart</h2>
        
        {isCartEmpty ? (
          <div className="cart-items-panel" style={{ textAlign: 'center', padding: '60px 24px' }}>
            <p style={{ fontSize: '18px', color: 'var(--muted)', marginBottom: '24px' }}>
              Your shopping cart is empty.
            </p>
            <button 
              type="button" 
              className="primary-button" 
              onClick={() => navigate('/')}
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div>
            {/* Shipping Rules Information Card */}
            <div className="shipping-rule-card">
              <div className="shipping-rule-header">
                <span>🚚 Applied Shipping Rates & Rules</span>
              </div>
              <div className="shipping-rule-grid">
                <div className="shipping-rule-item">
                  <strong>📦 Consumables</strong>
                  Base rate of <strong>$100.00</strong> if subtotal &le; $2,000.00.<br />
                  Additional <strong>$60.00</strong> for each additional $1,000.00.<br />
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Maximum shipping fee: $700.00 (starting from $12,000.00).</span>
                </div>
                <div className="shipping-rule-item">
                  <strong>🧪 Other Reagents</strong>
                  Base rate of <strong>$60.00</strong> if subtotal &le; $1,000.00.<br />
                  Additional <strong>$30.00</strong> for each additional $500.00.<br />
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Maximum shipping fee: $300.00 (starting from $5,000.00).</span>
                </div>
              </div>
            </div>

            <div className="cart-container">
              {/* Items Panel */}
              <div className="cart-items-panel" style={{ padding: '8px 24px 24px' }}>
                <div className="cart-item-row" style={{ fontWeight: 600, borderBottom: '2px solid var(--line)', padding: '16px 0 10px', fontSize: '14px', color: 'var(--muted)' }}>
                  <div></div>
                  <div>Product</div>
                  <div>Quantity</div>
                  <div>Price</div>
                  <div>Category</div>
                  <div style={{ textAlign: 'right' }}>Total</div>
                </div>

                {/* 1. Consumables Section */}
                {consumableItems.length > 0 && (
                  <div>
                    <div className="category-group-header consumables">
                      <div className="category-title" style={{ color: '#e11d48' }}>
                        <span>📦 Consumables</span>
                      </div>
                      <span className="category-shipping-badge consumables">
                        Shipping: ${shippingConsumables.toFixed(2)}
                      </span>
                    </div>

                    {consumableItems.map((item, index) => {
                      const itemTotal = item.price * item.quantity;
                      return (
                        <div className="cart-item-row" key={`${item.sku}-${item.unitSize}-${index}`}>
                          <div 
                            className="cart-item-image" 
                            style={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/product/${item.sku}`)}
                          >
                            <img src={item.image ? formatAssetUrl(item.image) : logo} alt={item.name} />
                          </div>
                          <div className="cart-item-details">
                            <h4 
                              style={{ cursor: 'pointer', transition: 'color 0.2s', fontSize: '15px' }}
                              onMouseEnter={(e) => e.target.style.color = 'var(--blue)'}
                              onMouseLeave={(e) => e.target.style.color = 'inherit'}
                              onClick={() => navigate(`/product/${item.sku}`)}
                            >
                              {item.name}
                            </h4>
                            <span>SKU: {item.sku}</span>
                            {item.unitSize && <span style={{ display: 'block', marginTop: '2px' }}>Size: {item.unitSize}</span>}
                          </div>
                          <div className="cart-qty-ctrl">
                            <button type="button" onClick={() => onUpdateQty(item.sku, item.unitSize, item.quantity - 1)}>-</button>
                            <span style={{ fontWeight: 600 }}>{item.quantity}</span>
                            <button type="button" onClick={() => onUpdateQty(item.sku, item.unitSize, item.quantity + 1)}>+</button>
                          </div>
                          <div>
                            <span style={{ fontWeight: 500 }}>${item.price.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="category-shipping-badge consumables" style={{ fontSize: '11px', padding: '2px 8px' }}>
                              Consumable
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--blue)', width: '100%', textAlign: 'right' }}>${itemTotal.toFixed(2)}</span>
                            <button 
                              type="button" 
                              onClick={() => onRemoveItem(item.sku, item.unitSize)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#f44336',
                                cursor: 'pointer',
                                fontSize: '18px',
                                padding: '0 0 0 12px'
                              }}
                              title="Remove item"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <div className="category-subtotal-bar">
                      <div>Section Subtotal: <strong>${subtotalConsumables.toFixed(2)}</strong></div>
                      <div>
                        Section Shipping: <strong style={{ color: '#e11d48' }}>${shippingConsumables.toFixed(2)}</strong>
                        <span className="shipping-detail-explanation">{explanationConsumables}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Reagents Section */}
                {reagentItems.length > 0 && (
                  <div>
                    <div className="category-group-header reagents">
                      <div className="category-title" style={{ color: '#059669' }}>
                        <span>🧪 Other Reagents</span>
                      </div>
                      <span className="category-shipping-badge reagents">
                        Shipping: ${shippingReagents.toFixed(2)}
                      </span>
                    </div>

                    {reagentItems.map((item, index) => {
                      const itemTotal = item.price * item.quantity;
                      return (
                        <div className="cart-item-row" key={`${item.sku}-${item.unitSize}-${index}`}>
                          <div 
                            className="cart-item-image" 
                            style={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/product/${item.sku}`)}
                          >
                            <img src={item.image ? formatAssetUrl(item.image) : logo} alt={item.name} />
                          </div>
                          <div className="cart-item-details">
                            <h4 
                              style={{ cursor: 'pointer', transition: 'color 0.2s', fontSize: '15px' }}
                              onMouseEnter={(e) => e.target.style.color = 'var(--blue)'}
                              onMouseLeave={(e) => e.target.style.color = 'inherit'}
                              onClick={() => navigate(`/product/${item.sku}`)}
                            >
                              {item.name}
                            </h4>
                            <span>SKU: {item.sku}</span>
                            {item.unitSize && <span style={{ display: 'block', marginTop: '2px' }}>Size: {item.unitSize}</span>}
                          </div>
                          <div className="cart-qty-ctrl">
                            <button type="button" onClick={() => onUpdateQty(item.sku, item.unitSize, item.quantity - 1)}>-</button>
                            <span style={{ fontWeight: 600 }}>{item.quantity}</span>
                            <button type="button" onClick={() => onUpdateQty(item.sku, item.unitSize, item.quantity + 1)}>+</button>
                          </div>
                          <div>
                            <span style={{ fontWeight: 500 }}>${item.price.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="category-shipping-badge reagents" style={{ fontSize: '11px', padding: '2px 8px' }}>
                              Reagent
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--blue)', width: '100%', textAlign: 'right' }}>${itemTotal.toFixed(2)}</span>
                            <button 
                              type="button" 
                              onClick={() => onRemoveItem(item.sku, item.unitSize)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#f44336',
                                cursor: 'pointer',
                                fontSize: '18px',
                                padding: '0 0 0 12px'
                              }}
                              title="Remove item"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <div className="category-subtotal-bar">
                      <div>Section Subtotal: <strong>${subtotalReagents.toFixed(2)}</strong></div>
                      <div>
                        Section Shipping: <strong style={{ color: '#059669' }}>${shippingReagents.toFixed(2)}</strong>
                        <span className="shipping-detail-explanation">{explanationReagents}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Services Section */}
                {serviceItems.length > 0 && (
                  <div>
                    <div className="category-group-header services">
                      <div className="category-title" style={{ color: '#2563eb' }}>
                        <span>⚙️ Services & Support</span>
                      </div>
                      <span className="category-shipping-badge services">
                        Shipping: Free
                      </span>
                    </div>

                    {serviceItems.map((item, index) => {
                      const itemTotal = item.price * item.quantity;
                      return (
                        <div className="cart-item-row" key={`${item.sku}-${item.unitSize}-${index}`}>
                          <div 
                            className="cart-item-image" 
                            style={{ cursor: 'pointer' }}
                            onClick={() => navigate(`/product/${item.sku}`)}
                          >
                            <img src={item.image ? formatAssetUrl(item.image) : logo} alt={item.name} />
                          </div>
                          <div className="cart-item-details">
                            <h4 
                              style={{ cursor: 'pointer', transition: 'color 0.2s', fontSize: '15px' }}
                              onMouseEnter={(e) => e.target.style.color = 'var(--blue)'}
                              onMouseLeave={(e) => e.target.style.color = 'inherit'}
                              onClick={() => navigate(`/product/${item.sku}`)}
                            >
                              {item.name}
                            </h4>
                            <span>SKU: {item.sku}</span>
                            {item.unitSize && <span style={{ display: 'block', marginTop: '2px' }}>Size: {item.unitSize}</span>}
                          </div>
                          <div className="cart-qty-ctrl">
                            <button type="button" onClick={() => onUpdateQty(item.sku, item.unitSize, item.quantity - 1)}>-</button>
                            <span style={{ fontWeight: 600 }}>{item.quantity}</span>
                            <button type="button" onClick={() => onUpdateQty(item.sku, item.unitSize, item.quantity + 1)}>+</button>
                          </div>
                          <div>
                            <span style={{ fontWeight: 500 }}>${item.price.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="category-shipping-badge services" style={{ fontSize: '11px', padding: '2px 8px' }}>
                              Service
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--blue)', width: '100%', textAlign: 'right' }}>${itemTotal.toFixed(2)}</span>
                            <button 
                              type="button" 
                              onClick={() => onRemoveItem(item.sku, item.unitSize)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#f44336',
                                cursor: 'pointer',
                                fontSize: '18px',
                                padding: '0 0 0 12px'
                              }}
                              title="Remove item"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <div className="category-subtotal-bar">
                      <div>Section Subtotal: <strong>${subtotalServices.toFixed(2)}</strong></div>
                      <div>Section Shipping: <strong style={{ color: '#2563eb' }}>$0.00</strong></div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
                  <button 
                    type="button" 
                    className="secondary-button" 
                    onClick={() => navigate('/')}
                    style={{ border: '1px solid var(--line)', background: 'transparent', padding: '10px 20px', borderRadius: '8px', fontWeight: 500 }}
                  >
                    ← Continue Shopping
                  </button>
                  <button 
                    type="button" 
                    className="secondary-button" 
                    onClick={onClearCart}
                    style={{ border: '1px solid #f44336', background: 'transparent', color: '#f44336', padding: '10px 20px', borderRadius: '8px', fontWeight: 500 }}
                  >
                    Clear Cart
                  </button>
                </div>
              </div>
              
              {/* Summary Card */}
              <div className="cart-summary-card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--line)' }}>
                <h3 style={{ borderBottom: '1px solid var(--line)', paddingBottom: '12px', marginBottom: '20px', fontWeight: 700 }}>Order Summary</h3>
                
                <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span>Products Subtotal:</span>
                  <span style={{ fontWeight: 600 }}>${subtotal.toFixed(2)}</span>
                </div>

                {shippingConsumables > 0 && (
                  <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: 'var(--muted)' }}>
                    <span>Consumables Shipping:</span>
                    <span>${shippingConsumables.toFixed(2)}</span>
                  </div>
                )}

                {shippingReagents > 0 && (
                  <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: 'var(--muted)' }}>
                    <span>Reagents Shipping:</span>
                    <span>${shippingReagents.toFixed(2)}</span>
                  </div>
                )}

                <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--line)' }}>
                  <span>Total Shipping Cost:</span>
                  <span style={{ fontWeight: 600 }}>${totalShipping.toFixed(2)}</span>
                </div>
                
                <div className="summary-row total" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', fontSize: '20px', fontWeight: 700 }}>
                  <span>Estimated Total:</span>
                  <span style={{ color: 'var(--blue)' }}>${grandTotal.toFixed(2)}</span>
                </div>
                
                {!currentUser && (
                  <div style={{ color: '#e53935', fontSize: '13px', marginBottom: '12px', textAlign: 'center', fontWeight: 500 }}>
                    ⚠️ You must sign in to request a quote.
                  </div>
                )}

                <button 
                  type="button" 
                  className="primary-button" 
                  style={{ 
                    width: '100%', 
                    padding: '14px', 
                    borderRadius: '8px', 
                    fontSize: '15px', 
                    fontWeight: 600, 
                    cursor: 'pointer',
                    background: !currentUser ? '#f43f5e' : 'var(--blue)'
                  }}
                  onClick={() => {
                    if (currentUser) {
                      navigate('/request-quote');
                    } else {
                      if (onOpenAuth) onOpenAuth();
                    }
                  }}
                >
                  {currentUser ? 'Request Quote with Cart' : 'Sign In to Request Quote'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default CartPage;
