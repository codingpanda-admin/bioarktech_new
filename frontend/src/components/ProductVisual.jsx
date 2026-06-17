import React from 'react';

function ProductVisual({ type }) {
  return (
    <div className={`product-visual visual-${type}`} aria-hidden="true">
      <span className="cap" />
      <span className="label" />
      <span className="detail detail-one" />
      <span className="detail detail-two" />
      <span className="detail detail-three" />
    </div>
  );
}

export default ProductVisual;
