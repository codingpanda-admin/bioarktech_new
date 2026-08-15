import React from 'react';
import { getCatalogCardPriceDetails } from '../utils/catalogPrice';

export default function CatalogPrice({ item, className = '' }) {
  const price = getCatalogCardPriceDetails(item);

  return (
    <div className={`catalog-card-price ${price.isDiscounted ? 'is-discounted' : ''} ${className}`.trim()}>
      <span className={price.isDiscounted ? 'catalog-discounted-price' : 'catalog-regular-price'}>
        {price.currentPrice}
      </span>
      {price.isDiscounted && (
        <>
          <span className="catalog-original-price" aria-label={`List price ${price.listPrice}`}>
            {price.listPrice}
          </span>
          <span className="catalog-discount-badge">-{price.discountPercent}%</span>
        </>
      )}
      {price.suffix && <span className="catalog-price-suffix">{price.suffix}</span>}
    </div>
  );
}
