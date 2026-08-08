/**
 * Supabase SQL migration runner
 *
 * Applies `supabase/migrations/*.sql` in filename order to the Supabase
 * database, tracking applied files in a `schema_migrations` table so reruns
 * are safe and idempotent.
 *
 * It connects ONE of two ways (first match wins):
 *   1. A Postgres connection string via  `DATABASE_URL` (or `POSTGRES_URL`,
 *      `SUPABASE_DB_URL`, `DIRECT_URL`)  — requires the `pg` package:
 *          npm i -D pg @types/pg
 *      Connection string example (Supabase dashboard → Project Settings → Database):
 *          postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
 *   2. The Supabase Management API via `SUPABASE_ACCESS_TOKEN` (a personal
 *      access token from https://supabase.com/dashboard/account/tokens) plus
 *      the existing `NEXT_PUBLIC_SUPABASE_URL`. No extra dependencies needed.
 *
 * Usage:
 *   npx tsx scripts/apply-migrations.ts --dry-run   # list what would run
 *   npx tsx scripts/apply-migrations.ts             # apply pending migrations
 *   npx tsx scripts/apply-migrations.ts 012         # only files matching "012"
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const require = createRequire(import.meta.url);

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FILTER = args.find((a) => !a.startsWith('--'));

const MIGRATIONS_DIR = join(process.cwd(), 'supabase', 'migrations');
const TRACKING_TABLE = 'schema_migrations';

// ─── Minimal .env loader (no dotenv dependency) ───────────────────────────────

function loadEnvFile(file: string): void {
  if (!existsSync(file)) return;
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(join(process.cwd(), '.env'));
loadEnvFile(join(process.cwd(), '.env.local'));

// ─── Executors ─────────────────────────────────────────────────────────────────

type Executor = (sql: string) => Promise<unknown>;

function makeManagementApiExecutor(
  projectRef: string,
  accessToken: string,
): Executor {
  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
  return async (sql: string) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Management API ${res.status}: ${text.slice(0, 2000)}`);
    }
    return res.json();
  };
}

async function makePgExecutor(connectionString: string): Promise<Executor> {
  try {
    const pg = require('pg');
    const client = new pg.Client({ connectionString });
    await client.connect();
    return async (sql: string) => client.query(sql);
  } catch (err) {
    throw new Error(
      `Could not load 'pg'. Install it and retry:\n  npm i -D pg @types/pg\n` +
        `\nOriginal error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

function resolveConnection(): Promise<{ mode: string; execute: Executor }> {
  const dbUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.DIRECT_URL;
  if (dbUrl) {
    return makePgExecutor(dbUrl).then((execute) => ({
      mode: 'Postgres (DATABASE_URL)',
      execute,
    }));
  }

  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (accessToken && supabaseUrl) {
    const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
    return Promise.resolve({
      mode: `Supabase Management API (project ${projectRef})`,
      execute: makeManagementApiExecutor(projectRef, accessToken),
    });
  }

  return Promise.reject(
    new Error(
      'No Supabase SQL connection configured. Add ONE of the following to .env.local:\n' +
        '  - DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres"\n' +
        '  - SUPABASE_ACCESS_TOKEN="<personal access token>"  (uses existing NEXT_PUBLIC_SUPABASE_URL)',
    ),
  );
}

// ─── Runner ────────────────────────────────────────────────────────────────────

async function ensureTrackingTable(execute: Executor): Promise<void> {
  const sql = `CREATE TABLE IF NOT EXISTS "${TRACKING_TABLE}" (
    "name" text primary key,
    "appliedAt" timestamptz default now()
  );`;
  await execute(sql);
}

async function appliedMigrations(execute: Executor): Promise<Set<string>> {
  const raw = await execute(
    `SELECT "name" FROM "${TRACKING_TABLE}"`,
  );
  const rows: Array<{ name: string }> = Array.isArray(raw)
    ? raw
    : ((raw as any)?.rows ?? []);
  return new Set(rows.map((r) => r.name));
}

async function run() {
  const { mode, execute } = await resolveConnection();
  console.log(`\n🔌 Connected via: ${mode}\n`);

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (FILTER) {
    const matched = files.filter((f) => f.includes(FILTER));
    if (matched.length === 0) {
      console.error(`No migration files match "${FILTER}".`);
      process.exit(1);
    }
    files.splice(0, files.length, ...matched);
  }

  await ensureTrackingTable(execute);
  const done = await appliedMigrations(execute);

  const pending = files.filter((f) => !done.has(f));

  if (pending.length === 0) {
    console.log('✅ All migrations already applied.');
    return;
  }

  console.log(`${pending.length} pending migration(s):`);
  pending.forEach((f) => console.log(`  - ${f}`));

  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN — nothing executed.\n');
    return;
  }

  for (const file of pending) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8').trim();
    try {
      await execute(`BEGIN;${sql}\nCOMMIT;`);
      await execute(
        `INSERT INTO "${TRACKING_TABLE}" ("name") VALUES ('${file.replace(/'/g, "''")}')`,
      );
      console.log(`  ✔ applied ${file}`);
    } catch (err) {
      console.error(`  ✘ FAILED ${file}:`, err instanceof Error ? err.message : err);
      console.error(
        '\nThe transaction for this file was rolled back. Fix it, then rerun.',
      );
      process.exit(1);
    }
  }

  console.log('\n✅ Migrations applied.\n');
}

run().catch((err) => {
  console.error('Migration runner failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
