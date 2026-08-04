const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const sqlPath = path.join(__dirname, 'populate_product.sql');

const createProductTableSql = `
CREATE TABLE IF NOT EXISTS public.product (
    product_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    external_id VARCHAR(100) NOT NULL UNIQUE,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    product_link TEXT,
    category_external_id VARCHAR(100),
    product_group VARCHAR(100),
    source_type VARCHAR(50),
    display_order INTEGER,
    source_created_at_ms BIGINT,
    source_created_at TIMESTAMPTZ,
    catalog_number VARCHAR(100),
    availability VARCHAR(100),
    list_price VARCHAR(100),
    price_range VARCHAR(100),
    quote_only BOOLEAN NOT NULL DEFAULT FALSE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    show_in_featured BOOLEAN NOT NULL DEFAULT FALSE,
    show_in_gene_editing BOOLEAN NOT NULL DEFAULT FALSE,
    key_features TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    options TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    option_prices JSONB NOT NULL DEFAULT '{}'::JSONB,
    storage_stability TEXT,
    performance_data TEXT,
    data_description TEXT,
    manuals TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    manual_urls TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    images TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    store_link TEXT,
    content_text TEXT,
    hidden BOOLEAN NOT NULL DEFAULT FALSE,
    raw_product JSONB,
    raw_override JSONB,
    raw_detail JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_category_external_id
    ON public.product (category_external_id);

CREATE INDEX IF NOT EXISTS idx_product_display_order
    ON public.product (display_order);

CREATE INDEX IF NOT EXISTS idx_product_catalog_number
    ON public.product (catalog_number);

CREATE INDEX IF NOT EXISTS idx_product_show_in_featured
    ON public.product (show_in_featured)
    WHERE show_in_featured = TRUE;
`;

const client = new Client({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'bioone',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
});

const main = async () => {
  const populateSql = fs.readFileSync(sqlPath, 'utf8');

  await client.connect();

  try {
    await client.query('BEGIN');
    await client.query(createProductTableSql);
    await client.query(populateSql);
    const countResult = await client.query('SELECT COUNT(*)::int AS count FROM public.product;');
    const sampleResult = await client.query(`
      SELECT external_id, product_name, category_external_id, catalog_number
      FROM public.product
      ORDER BY display_order NULLS LAST, external_id
      LIMIT 5;
    `);
    await client.query('COMMIT');

    console.log(`public.product now contains ${countResult.rows[0].count} rows.`);
    console.table(sampleResult.rows);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
