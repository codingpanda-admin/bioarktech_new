const isUnavailablePrice = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'number') return !Number.isFinite(value) || value <= 0;

  const text = String(value).trim();
  if (!text || /^contact(?:\s+us)?(?:\s+for)?\s+(?:a\s+)?quote$/i.test(text)) return true;

  const numericValue = Number(text.replace(/[$,\s]/g, ''));
  return Number.isFinite(numericValue) && numericValue <= 0;
};

export const parseCatalogPrice = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : null;
  if (value === null || value === undefined) return null;

  const normalized = String(value).trim().replace(/^\$\s*/, '').replace(/,/g, '');
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

export const formatCatalogPrice = (value) => {
  if (isUnavailablePrice(value)) return '';
  if (typeof value === 'number') return `$${value.toFixed(2)}`;

  const text = String(value).trim();
  if (/^[$]/.test(text) || /[a-z]/i.test(text) || /\s*-\s*/.test(text)) return text;
  if (/^\d+(?:\.\d+)?$/.test(text.replace(/,/g, ''))) return `$${text}`;
  return text;
};

const getFirstOptionPrice = (item) => {
  if (!isUnavailablePrice(item?.first_option_price)) return item.first_option_price;

  const options = Array.isArray(item?.options)
    ? item.options.map((option) => String(option || '').trim()).filter(Boolean)
    : [];
  const optionPrices = (
    item?.option_prices
    && typeof item.option_prices === 'object'
    && !Array.isArray(item.option_prices)
  ) ? item.option_prices : {};

  const firstOption = options[0];
  if (firstOption && !isUnavailablePrice(optionPrices[firstOption])) {
    return optionPrices[firstOption];
  }

  return Object.values(optionPrices).find((price) => !isUnavailablePrice(price)) || '';
};

const getFirstOptionPricePair = (item) => {
  const options = Array.isArray(item?.options)
    ? item.options.map((option) => String(option || '').trim()).filter(Boolean)
    : [];
  const optionPrices = (
    item?.option_prices
    && typeof item.option_prices === 'object'
    && !Array.isArray(item.option_prices)
  ) ? item.option_prices : {};
  const optionDiscounts = (
    item?.option_discounted_prices
    && typeof item.option_discounted_prices === 'object'
    && !Array.isArray(item.option_discounted_prices)
  ) ? item.option_discounted_prices : {};
  const firstOption = options[0] || Object.keys(optionPrices)[0] || Object.keys(optionDiscounts)[0];
  const firstOptionDiscount = firstOption ? optionDiscounts[firstOption] : undefined;
  const hasFirstOptionDiscount = ![undefined, null, ''].includes(firstOptionDiscount);

  return {
    listPrice: (
      (firstOption && optionPrices[firstOption])
      || item?.first_option_price
      || getFirstOptionPrice(item)
      || ''
    ),
    discountedPrice: hasFirstOptionDiscount
      ? firstOptionDiscount
      : (item?.first_option_discounted_price ?? ''),
  };
};

const formatDiscountedCatalogPrice = (value) => {
  const numericValue = parseCatalogPrice(value);
  if (numericValue === null) return '';
  if (typeof value === 'string' && String(value).trim().startsWith('$')) return String(value).trim();
  return `$${String(value).trim()}`;
};

const buildPriceDetails = (listValue, discountedValue, suffix = '') => {
  const listPrice = parseCatalogPrice(listValue);
  const discountedPrice = parseCatalogPrice(discountedValue);
  const formattedListPrice = formatCatalogPrice(listValue);
  const isDiscounted = (
    formattedListPrice
    && listPrice !== null
    && listPrice > 0
    && discountedPrice !== null
    && discountedPrice < listPrice
  );

  if (isDiscounted) {
    return {
      currentPrice: formatDiscountedCatalogPrice(discountedValue),
      listPrice: formattedListPrice,
      discountPercent: Math.round(((listPrice - discountedPrice) / listPrice) * 100),
      isDiscounted: true,
      suffix,
    };
  }

  return {
    currentPrice: formattedListPrice,
    listPrice: '',
    discountPercent: 0,
    isDiscounted: false,
    suffix,
  };
};

export const getCatalogCardPriceDetails = (item) => {
  const listPrice = formatCatalogPrice(item?.list_price);
  if (listPrice) {
    return buildPriceDetails(item.list_price, item?.discounted_price);
  }

  const firstOption = getFirstOptionPricePair(item);
  const optionDetails = buildPriceDetails(
    firstOption.listPrice,
    firstOption.discountedPrice,
    firstOption.listPrice ? 'and more...' : '',
  );
  if (optionDetails.currentPrice) return optionDetails;

  return {
    currentPrice: 'Contact for Quote',
    listPrice: '',
    discountPercent: 0,
    isDiscounted: false,
    suffix: '',
  };
};

export const getCatalogCardPrice = (item) => {
  const details = getCatalogCardPriceDetails(item);
  return `${details.currentPrice}${details.suffix ? ` ${details.suffix}` : ''}`;
};
