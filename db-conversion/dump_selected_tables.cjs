const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const TABLES = ['quote', 'product_category', 'product', 'blog'];
const outputPath = path.join(__dirname, 'bioone_selected_tables_dump.sql');

const client = new Client({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'bioone',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
});

const quoteIdent = (value) => `"${String(value).replace(/"/g, '""')}"`;
const quoteLiteral = (value) => `'${String(value).replace(/'/g, "''")}'`;

const formatValue = (value) => {
  if (value === null || value === undefined) return 'NULL';
  if (value instanceof Date) return quoteLiteral(value.toISOString());
  if (Buffer.isBuffer(value)) return `decode('${value.toString('hex')}', 'hex')`;
  if (Array.isArray(value)) return `ARRAY[${value.map(formatValue).join(', ')}]`;
  if (typeof value === 'object') return `${quoteLiteral(JSON.stringify(value))}::jsonb`;
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  return quoteLiteral(value);
};

const getTables = async () => {
  const result = await client.query(
    `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[])
      ORDER BY array_position($1::text[], table_name);
    `,
    [TABLES]
  );

  return result.rows.map((row) => row.table_name);
};

const getColumns = async (tableName) => {
  const result = await client.query(
    `
      SELECT
        c.column_name,
        c.data_type,
        c.udt_name,
        c.character_maximum_length,
        c.numeric_precision,
        c.numeric_scale,
        c.datetime_precision,
        c.is_nullable,
        c.column_default,
        c.ordinal_position
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.table_name = $1
      ORDER BY c.ordinal_position;
    `,
    [tableName]
  );

  return result.rows;
};

const getColumnType = (column) => {
  if (column.data_type === 'ARRAY') {
    const baseType = column.udt_name.replace(/^_/, '');
    return `${baseType}[]`;
  }

  if (column.data_type === 'character varying') {
    return column.character_maximum_length
      ? `character varying(${column.character_maximum_length})`
      : 'character varying';
  }

  if (column.data_type === 'character') {
    return column.character_maximum_length
      ? `character(${column.character_maximum_length})`
      : 'character';
  }

  if (column.data_type === 'numeric') {
    return column.numeric_precision
      ? `numeric(${column.numeric_precision},${column.numeric_scale || 0})`
      : 'numeric';
  }

  if (column.data_type === 'timestamp with time zone') return 'timestamp with time zone';
  if (column.data_type === 'timestamp without time zone') return 'timestamp without time zone';
  if (column.data_type === 'USER-DEFINED') return column.udt_name;

  return column.data_type;
};

const getConstraints = async (tableName) => {
  const result = await client.query(
    `
      SELECT conname, pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
      WHERE conrelid = ('public.' || quote_ident($1))::regclass
      ORDER BY contype DESC, conname;
    `,
    [tableName]
  );

  return result.rows;
};

const getIndexes = async (tableName) => {
  const result = await client.query(
    `
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = $1
        AND indexname NOT IN (
          SELECT conname
          FROM pg_constraint
          WHERE conrelid = ('public.' || quote_ident($1))::regclass
        )
      ORDER BY indexname;
    `,
    [tableName]
  );

  return result.rows;
};

const getIdentityResets = async (tableName) => {
  const result = await client.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
        AND is_identity = 'YES'
      ORDER BY ordinal_position;
    `,
    [tableName]
  );

  return result.rows.map((row) => row.column_name);
};

const buildCreateTable = async (tableName) => {
  const columns = await getColumns(tableName);
  const constraints = await getConstraints(tableName);
  const lines = columns.map((column) => {
    const defaultClause = column.column_default ? ` DEFAULT ${column.column_default}` : '';
    const nullClause = column.is_nullable === 'NO' ? ' NOT NULL' : '';
    return `    ${quoteIdent(column.column_name)} ${getColumnType(column)}${defaultClause}${nullClause}`;
  });

  for (const constraint of constraints) {
    lines.push(`    CONSTRAINT ${quoteIdent(constraint.conname)} ${constraint.definition}`);
  }

  return `CREATE TABLE IF NOT EXISTS public.${quoteIdent(tableName)} (\n${lines.join(',\n')}\n);\n`;
};

const buildInsertData = async (tableName) => {
  const rows = await client.query(`SELECT * FROM public.${quoteIdent(tableName)};`);
  if (!rows.rowCount) return `-- No data for public.${tableName}.\n`;

  const columns = rows.fields.map((field) => field.name);
  const columnSql = columns.map(quoteIdent).join(', ');
  const values = rows.rows.map((row) => {
    const rowValues = columns.map((column) => formatValue(row[column])).join(', ');
    return `    (${rowValues})`;
  });

  return `INSERT INTO public.${quoteIdent(tableName)} (${columnSql}) VALUES\n${values.join(',\n')};\n`;
};

const buildIdentityReset = async (tableName) => {
  const columns = await getIdentityResets(tableName);
  return columns
    .map((column) => (
      `SELECT setval(pg_get_serial_sequence('public.${tableName}', '${column}'), COALESCE((SELECT MAX(${quoteIdent(column)}) FROM public.${quoteIdent(tableName)}), 1), true);`
    ))
    .join('\n');
};

const main = async () => {
  await client.connect();

  try {
    const existingTables = await getTables();
    const missingTables = TABLES.filter((table) => !existingTables.includes(table));
    const sections = [
      '-- SQL dump for selected bioone public tables',
      `-- Generated at ${new Date().toISOString()}`,
      `-- Tables: ${TABLES.map((table) => `public.${table}`).join(', ')}`,
      '',
      'BEGIN;',
      '',
      'SET session_replication_role = replica;',
      '',
    ];

    if (missingTables.length) {
      sections.push(`-- Missing tables skipped: ${missingTables.map((table) => `public.${table}`).join(', ')}`, '');
    }

    for (const tableName of existingTables) {
      sections.push(`-- ============================================================`);
      sections.push(`-- public.${tableName}`);
      sections.push(`-- ============================================================`);
      sections.push(`DROP TABLE IF EXISTS public.${quoteIdent(tableName)} CASCADE;`);
      sections.push(await buildCreateTable(tableName));
      sections.push(await buildInsertData(tableName));

      const indexes = await getIndexes(tableName);
      for (const index of indexes) {
        sections.push(`${index.indexdef};`);
      }

      const identityReset = await buildIdentityReset(tableName);
      if (identityReset) sections.push(identityReset);
      sections.push('');
    }

    sections.push('SET session_replication_role = DEFAULT;');
    sections.push('');
    sections.push('COMMIT;');
    sections.push('');

    fs.writeFileSync(outputPath, sections.join('\n'), 'utf8');
    console.log(`Wrote ${outputPath}`);
    console.log(`Dumped tables: ${existingTables.map((table) => `public.${table}`).join(', ') || '(none)'}`);
    if (missingTables.length) console.log(`Missing tables: ${missingTables.map((table) => `public.${table}`).join(', ')}`);
  } finally {
    await client.end();
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
