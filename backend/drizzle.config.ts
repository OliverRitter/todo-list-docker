import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  tablesFilter: ["user", "session", "account", "verification", "todos"],
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      "postgres://postgres:my-secure-password@database_postgres:5432/fullstack_db",
  },
});
