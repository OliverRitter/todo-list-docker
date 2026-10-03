import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import pkg from "pg";
const { Pool } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgres://postgres:my-secure-password@database_postgres:5432/fullstack_db",
});
const db = drizzle(pool, { schema });

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  trustedOrigins: [process.env.FRONTEND_ORIGIN || "http://localhost:8080"],
  emailAndPassword: {
    enabled: true,
  },
});
