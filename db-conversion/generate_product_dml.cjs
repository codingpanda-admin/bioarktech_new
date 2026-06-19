const fs = require('fs');
const path = require('path');

const inputPath = 'C:\\development\\bioarktech\\data\\products.JSON';
const outputPath = path.join(__dirname, 'populate_product.sql');
const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

const productsById = new Map();
const productRows = data.products || [];
const overrides = data.overrides || {};
const details = data.details || {};
const groups = data.groupsConfig || {};
const hidden = new Set(data.hidden || []);

for (const row of productRows) {
  if (row?.id) productsById.set(row.id, row);
}

for (const source of [overrides, details, groups]) {
  for (const id of Object.keys(source)) {
    if (!productsById.has(id)) productsById.set(id, { id });
  }
}

for (const id of hidden) {
  if (!productsById.has(id)) productsById.set(id, { id });
}

const sqlString = (value) => {
  if (value === undefined || value === null) return 'NULL';
  return `'${String(value).replace(/'/g, "''")}'`;
};

const sqlBool = (value, fallback = false) => (
  value === undefined || value === null ? (fallback ? 'TRUE' : 'FALSE') : value ? 'TRUE' : 'FALSE'
);
const sqlInt = (value) => (Number.isFinite(Number(value)) ? String(Number(value)) : 'NULL');
const sqlArray = (value) => {
  const items = Array.isArray(value) ? value : [];
  if (!items.length) return 'ARRAY[]::TEXT[]';
  return `ARRAY[${items.map(sqlString).join(', ')}]::TEXT[]`;
};
const sqlJson = (value) => {
  if (value === undefined || value === null) return 'NULL';
  return `${sqlString(JSON.stringify(value))}::JSONB`;
};
const sourceCreatedAt = (ms) => (Number.isFinite(Number(ms)) ? `to_timestamp(${Number(ms)} / 1000.0)` : 'NULL');
const getCreatedAt = (base, detail) => detail.createdAt ?? base.createdAt;
const getOrder = (base, override, detail) => detail.order ?? override.order ?? base.order;

const columns = [
  'external_id',
  'product_name',
  'description',
  'image_url',
  'product_link',
  'category_external_id',
  'product_group',
  'source_type',
  'display_order',
  'source_created_at_ms',
  'source_created_at',
  'catalog_number',
  'availability',
  'list_price',
  'price_range',
  'quote_only',
  'is_featured',
  'show_in_featured',
  'show_in_gene_editing',
  'key_features',
  'options',
  'option_prices',
  'storage_stability',
  'performance_data',
  'data_description',
  'manuals',
  'manual_urls',
  'images',
  'store_link',
  'content_text',
  'hidden',
  'raw_product',
  'raw_override',
  'raw_detail',
];

const values = [...productsById.keys()]
  .sort((a, b) => {
    const aBase = productsById.get(a) || {};
    const bBase = productsById.get(b) || {};
    const aOverride = overrides[a] || {};
    const bOverride = overrides[b] || {};
    const aDetail = details[a] || {};
    const bDetail = details[b] || {};
    const aOrder = getOrder(aBase, aOverride, aDetail);
    const bOrder = getOrder(bBase, bOverride, bDetail);

    if (Number.isFinite(Number(aOrder)) && Number.isFinite(Number(bOrder)) && Number(aOrder) !== Number(bOrder)) {
      return Number(aOrder) - Number(bOrder);
    }

    return a.localeCompare(b);
  })
  .map((id) => {
    const base = productsById.get(id) || {};
    const override = overrides[id] || {};
    const detail = details[id] || {};
    const merged = { ...base, ...override };
    const createdAtMs = getCreatedAt(base, detail);
    const imageUrl = merged.imageUrl || detail.images?.[0] || null;
    const productName = merged.name || detail.catalogNumber || id;
    const sourceType = merged.__type || null;
    const rowValues = [
      sqlString(id),
      sqlString(productName),
      sqlString(merged.description),
      sqlString(imageUrl),
      sqlString(merged.link),
      sqlString(merged.category),
      sqlString(groups[id]),
      sqlString(sourceType),
      sqlInt(getOrder(base, override, detail)),
      sqlInt(createdAtMs),
      sourceCreatedAt(createdAtMs),
      sqlString(detail.catalogNumber),
      sqlString(detail.availability),
      sqlString(detail.listPrice),
      sqlString(detail.priceRange),
      sqlBool(detail.quoteOnly),
      sqlBool(detail.isFeatured),
      sqlBool(detail.showInFeatured),
      sqlBool(detail.showInGeneEditing),
      sqlArray(detail.keyFeatures),
      sqlArray(detail.options),
      detail.optionPrices === undefined ? "'{}'::JSONB" : sqlJson(detail.optionPrices),
      sqlString(detail.storageStability),
      sqlString(detail.performanceData),
      sqlString(detail.dataDescription),
      sqlArray(detail.manuals),
      sqlArray(detail.manualUrls),
      sqlArray(detail.images),
      sqlString(detail.storeLink),
      sqlString(detail.contentText),
      sqlBool(hidden.has(id)),
      sqlJson(base.id ? base : null),
      sqlJson(overrides[id]),
      sqlJson(details[id]),
    ];

    return `    (${rowValues.join(', ')})`;
  });

const updateColumns = columns.filter((column) => column !== 'external_id');
const sql = `-- Populate public.product from ${inputPath}
-- Generated from products, overrides, details, hidden, and groupsConfig.

INSERT INTO public.product (
    ${columns.join(',\n    ')}
) VALUES
${values.join(',\n')}
ON CONFLICT (external_id)
DO UPDATE SET
    ${updateColumns.map((column) => `${column} = EXCLUDED.${column}`).join(',\n    ')},
    updated_at = NOW();
`;

fs.writeFileSync(outputPath, sql, 'utf8');
console.log(`Wrote ${values.length} product rows to ${outputPath}`);
