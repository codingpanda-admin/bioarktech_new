#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_JSON_PATH = "C:\\development\\bioarktech\\data\\blog.json";

function parseArgs(argv) {
  const args = {
    jsonPath: DEFAULT_JSON_PATH,
    host: process.env.PGHOST || "127.0.0.1",
    port: Number(process.env.PGPORT || 5432),
    database: process.env.PGDATABASE || "bioone",
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "postgres",
    clear: false,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    const next = () => {
      i += 1;
      if (!argv[i]) {
        throw new Error(`Missing value for ${value}`);
      }
      return argv[i];
    };

    switch (value) {
      case "--json":
        args.jsonPath = next();
        break;
      case "--host":
        args.host = next();
        break;
      case "--port":
        args.port = Number(next());
        break;
      case "--database":
        args.database = next();
        break;
      case "--user":
        args.user = next();
        break;
      case "--password":
        args.password = next();
        break;
      case "--clear":
        args.clear = true;
        break;
      case "--dry-run":
        args.dryRun = true;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break;
      default:
        throw new Error(`Unknown option: ${value}`);
    }
  }

  if (!Number.isInteger(args.port) || args.port <= 0) {
    throw new Error("--port must be a positive integer");
  }

  return args;
}

function printHelp() {
  console.log(`
Import BioArk blog posts from JSON into PostgreSQL.

Usage:
  node import_blogs.js [options]

Options:
  --json <path>       JSON source file. Defaults to ${DEFAULT_JSON_PATH}
  --host <host>       PostgreSQL host. Defaults to 127.0.0.1
  --port <port>       PostgreSQL port. Defaults to 5432
  --database <name>   PostgreSQL database. Defaults to bioone
  --user <user>       PostgreSQL user. Defaults to postgres
  --password <pass>   PostgreSQL password. Defaults to postgres
  --clear             Delete existing rows from blog before importing
  --dry-run           Validate and summarize only; do not write to PostgreSQL
  --help              Show this help
`);
}

function cleanWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function truncate(value, maxLength) {
  const clean = cleanWhitespace(value);
  if (clean.length <= maxLength) {
    return clean;
  }
  return `${clean.slice(0, maxLength - 3).trimEnd()}...`;
}

function parseDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid blog date: ${value}`);
  }
  return date;
}

function loadPosts(jsonPath) {
  const resolvedPath = path.resolve(jsonPath);
  const payload = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));

  if (!Array.isArray(payload.posts)) {
    throw new Error(`${resolvedPath} does not contain a top-level posts array`);
  }

  return payload.posts;
}

function normalizePost(post) {
  if (post.id === undefined || post.id === null) {
    throw new Error(`Blog post is missing id: ${JSON.stringify(post).slice(0, 120)}`);
  }

  const id = Number(post.id);
  if (!Number.isSafeInteger(id)) {
    throw new Error(`Blog id is not a safe integer: ${post.id}`);
  }

  const title = truncate(post.title || `Untitled blog ${id}`, 200);
  const description = truncate(post.excerpt || post.description || title, 150);
  const author = truncate(post.author || "Admin", 30);
  const image = cleanWhitespace(post.coverImage) || null;
  const content = String(post.content || "");
  const datePosted = parseDate(post.date);
  const dateModified = new Date();

  return {
    id,
    title,
    description,
    author,
    image,
    content,
    datePosted,
    dateModified,
  };
}

async function importPosts(args, rows) {
  let Client;
  try {
    ({ Client } = require("pg"));
  } catch (error) {
    throw new Error(
      "Missing dependency: pg. Run `npm.cmd install` in db-conversion, then try again."
    );
  }

  const client = new Client({
    host: args.host,
    port: args.port,
    database: args.database,
    user: args.user,
    password: args.password,
  });

  const upsertSql = `
    INSERT INTO blog (
      id,
      title,
      description,
      author,
      image,
      content,
      date_posted,
      date_modified
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      author = EXCLUDED.author,
      image = EXCLUDED.image,
      content = EXCLUDED.content,
      date_posted = EXCLUDED.date_posted,
      date_modified = EXCLUDED.date_modified;
  `;

  const sequenceSql = `
    SELECT setval(
      pg_get_serial_sequence('blog', 'id'),
      COALESCE((SELECT MAX(id) FROM blog), 1),
      true
    );
  `;

  await client.connect();

  try {
    await client.query("BEGIN");

    if (args.clear) {
      await client.query("DELETE FROM blog;");
    }

    for (const row of rows) {
      await client.query(upsertSql, [
        row.id,
        row.title,
        row.description,
        row.author,
        row.image,
        row.content,
        row.datePosted,
        row.dateModified,
      ]);
    }

    await client.query(sequenceSql);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const posts = loadPosts(args.jsonPath);
  const rows = posts.map(normalizePost);

  console.log(`Loaded ${rows.length} posts from ${path.resolve(args.jsonPath)}`);

  if (rows.length > 0) {
    const sortedDates = rows
      .map((row) => row.datePosted)
      .sort((a, b) => a.getTime() - b.getTime());
    console.log(
      `Date range: ${sortedDates[0].toISOString()} to ${sortedDates[sortedDates.length - 1].toISOString()}`
    );
  }

  if (args.dryRun) {
    console.log("Dry run complete. No database changes were made.");
    return;
  }

  await importPosts(args, rows);
  console.log(`${args.clear ? "Replaced" : "Upserted"} ${rows.length} posts into ${args.database}.blog`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
