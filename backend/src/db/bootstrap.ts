import { pool } from "./client.js";

const statements = [
  `CREATE EXTENSION IF NOT EXISTS postgis`,
  `CREATE TABLE IF NOT EXISTS "user" (
    id text PRIMARY KEY,
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    email_verified boolean NOT NULL DEFAULT false,
    image text,
    created_at timestamp NOT NULL,
    updated_at timestamp NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "session" (
    id text PRIMARY KEY,
    expires_at timestamp NOT NULL,
    token text NOT NULL UNIQUE,
    created_at timestamp NOT NULL,
    updated_at timestamp NOT NULL,
    ip_address text,
    user_agent text,
    user_id text NOT NULL REFERENCES "user" (id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS account (
    id text PRIMARY KEY,
    account_id text NOT NULL,
    provider_id text NOT NULL,
    user_id text NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
    access_token text,
    refresh_token text,
    id_token text,
    access_token_expires_at timestamp,
    refresh_token_expires_at timestamp,
    scope text,
    password text,
    created_at timestamp NOT NULL,
    updated_at timestamp NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS verification (
    id text PRIMARY KEY,
    identifier text NOT NULL,
    value text NOT NULL,
    expires_at timestamp NOT NULL,
    created_at timestamp,
    updated_at timestamp
  )`,
  `CREATE TABLE IF NOT EXISTS todos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    category text NOT NULL,
    due_date timestamp NOT NULL,
    creator_id text NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
    creator_name text NOT NULL,
    city text,
    country text,
    location geometry(Point, 4326) NOT NULL,
    created_at timestamp NOT NULL DEFAULT now()
  )`,
  // Drop stale lat/lng columns left over from before location switched to a single geometry column
  `ALTER TABLE todos DROP COLUMN IF EXISTS lat`,
  `ALTER TABLE todos DROP COLUMN IF EXISTS lng`,
];

for (const statement of statements) {
  await pool.query(statement);
}

await pool.end();
console.log("Database schema is ready.");
