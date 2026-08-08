const isUnavailablePrice = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'number') return !Number.isFinite(value) || value <= 0;

  const text = String(value).trim();
  if (!text || /^contact(?:\s+us)?(?:\s+for)?\s+(?:a\s+)?quote$/i.test(text)) return true;

  const numericValue = Number(text.replace(/[$,\s]/g, ''));
  return Number.isFinite(numericValue) && numericValue <= 0;
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

export const getCatalogCardPrice = (item) => {
  const listPrice = formatCatalogPrice(item?.list_price);
  if (listPrice) return listPrice;

  const firstOptionPrice = formatCatalogPrice(getFirstOptionPrice(item));
  return firstOptionPrice ? `${firstOptionPrice} and more...` : 'Contact for Quote';
};
