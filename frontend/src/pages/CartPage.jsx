import React from 'react';
import { logo, formatAssetUrl } from '../utils/api';

function CartPage({ navigate, cart, onUpdateQty, onRemoveItem, onClearCart }) {
  const isCartEmpty = cart.length === 0;

  // Totals calculations
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const hasConsumable = cart.some(item => item.shippingCost === 100);
  const totalShipping = isCartEmpty ? 0 : (hasConsumable ? 100 : 40);
  const grandTotal = subtotal + totalShipping;

  return (
    <main style={{ minHeight: '60vh' }}>
      <div style={{ width: 'min(1200px, calc(100% - 48px))', margin: '40px auto' }}>
        <h2 style={{ marginBottom: '24px' }}>Shopping Cart</h2>
        
        {isCartEmpty ? (
          <div className="cart-items-panel" style={{ textAlign: 'center', padding: '60px 24px' }}>
            <p style={{ fontSize: '18px', color: 'var(--muted)', marginBottom: '24px' }}>
              Your cart is empty.
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
          <div className="cart-container">
            {/* Items Panel */}
            <div className="cart-items-panel">
              <div className="cart-item-row" style={{ fontWeight: 'bold', borderBottom: '2px solid var(--line)', paddingBottom: '10px' }}>
                <div></div>
                <div>Product</div>
                <div>Quantity</div>
                <div>Price</div>
                <div>Shipping Class</div>
                <div>Total</div>
              </div>
              
              {cart.map((item, index) => {
                const itemTotal = item.price * item.quantity;
                const isConsumable = item.shippingCost === 100;
                
                return (
                  <div className="cart-item-row" key={`${item.sku}-${item.unitSize}-${index}`}>
                    <div className="cart-item-image">
                      <img src={item.image ? formatAssetUrl(item.image) : logo} alt={item.name} />
                    </div>
                    <div className="cart-item-details">
                      <h4>{item.name}</h4>
                      <span>SKU: {item.sku}</span>
                      {item.unitSize && <span style={{ display: 'block', marginTop: '2px' }}>Spec: {item.unitSize}</span>}
                    </div>
                    <div className="cart-qty-ctrl">
                      <button type="button" onClick={() => onUpdateQty(item.sku, item.unitSize, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => onUpdateQty(item.sku, item.unitSize, item.quantity + 1)}>+</button>
                    </div>
                    <div>
                      <span style={{ fontWeight: 'bold' }}>${item.price.toFixed(2)}</span>
                    </div>
                    <div>
                      <span style={{ color: isConsumable ? '#e53935' : 'var(--green)', fontSize: '14px', fontWeight: 'bold' }}>
                        {isConsumable ? '$100 Class' : '$40 Class'}
                      </span>
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--muted)', fontStyle: 'italic' }}>
                        {isConsumable ? 'Consumable' : 'Reagent'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--blue)' }}>${itemTotal.toFixed(2)}</span>
                      <button 
                        type="button" 
                        onClick={() => onRemoveItem(item.sku, item.unitSize)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#f44336',
                          cursor: 'pointer',
                          fontSize: '18px',
                          padding: '0 8px'
                        }}
                        title="Remove item"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                <button 
                  type="button" 
                  className="secondary-button" 
                  onClick={() => navigate('/')}
                  style={{ border: '1px solid var(--line)', background: 'transparent' }}
                >
                  Continue Shopping
                </button>
                <button 
                  type="button" 
                  className="secondary-button" 
                  onClick={onClearCart}
                  style={{ border: '1px solid #f44336', background: 'transparent', color: '#f44336' }}
                >
                  Clear Cart
                </button>
              </div>
            </div>
            
            {/* Summary Card */}
            <div className="cart-summary-card">
              <h3>Order Summary</h3>
              <div className="summary-row">
                <span>Items Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping ({hasConsumable ? 'Flat Consumable' : 'Flat Reagent'}):</span>
                <span>${totalShipping.toFixed(2)}</span>
              </div>
              
              <div className="summary-row total">
                <span>Grand Total:</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>
              
              <button 
                type="button" 
                className="primary-button" 
                style={{ width: '100%', marginTop: '20px', padding: '14px' }}
                onClick={() => {
                  navigate('/request-quote');
                }}
              >
                Request Quote with Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default CartPage;
