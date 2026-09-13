import pkg from "pg";
const { Pool } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import * as schema from "./src/db/schema.js";

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://postgres:my-secure-password@database_postgres:5432/fullstack_db";
const pool = new Pool({ connectionString });
const db = drizzle(pool, { schema });

async function seedSpatialCore() {
  console.log("⏳ Starting G2 Spatial Core validation and seeding sequence...");
  try {
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS postgis;`);
    console.log("✅ PostGIS Extension verified/enabled.");

    await db.execute(sql`TRUNCATE TABLE todos, session, "user" CASCADE;`);
    console.log("🧹 Previous development rows purged.");

    const testUserId = "usr_dev_oliver_9999";
    await db.execute(sql`
      INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at)
      VALUES (${testUserId}, 'Oliver Spatial Dev', 'oliver@myhome.local', true, NOW(), NOW());
    `);
    console.log("👤 Test User profile generated successfully.");

    const mockSessionToken = "g2_development_token_secure_xyz_123";
    await db.execute(sql`
      INSERT INTO session (id, token, user_id, expires_at, created_at, updated_at, ip_address, user_agent)
      VALUES ('sess_dev_1111', ${mockSessionToken}, ${testUserId}, NOW() + INTERVAL '30 days', NOW(), NOW(), '127.0.0.1', 'Docker Validation Suite');
    `);
    console.log(`🔑 Valid Session provisioned. Token: ${mockSessionToken}`);

    const points = [
      {
        title: "Deploy Kubernetes Spatial Proxy",
        cat: "Work",
        lng: 10.4049,
        lat: 52.52,
        city: "Hannover",
        country: "Germany",
      },
      {
        title: "Pick up local PostGIS data charts",
        cat: "Shopping",
        lng: 9.415,
        lat: 52.53,
        city: "Stadthagen",
        country: "Germany",
      },
      {
        title: "Review telemetry coordinates",
        cat: "Personal",
        lng: 5.388,
        lat: 52.51,
        city: "Harderwijk",
        country: "Netherlands",
      },
    ];

    for (const pt of points) {
      await db.execute(sql`
        INSERT INTO todos (title, category, due_date, creator_id, creator_name, lat, lng, city, country, location, created_at)
        VALUES (
          ${pt.title}, 
          ${pt.cat}, 
          NOW() + INTERVAL '9 days', 
          ${testUserId}, 
          'Oliver Spatial Dev', 
          ${String(pt.lat)}, 
          ${String(pt.lng)}, 
          ${pt.city}, 
          ${pt.country}, 
          ST_SetSRID(ST_MakePoint(${pt.lng}, ${pt.lat}), 4326), 
          NOW()
        );
      `);
    }
    console.log("📌 Spatial todo points generated around coordinate vectors.");
    console.log("🎉 Seeding routine complete! Your workspace map is hot.");
  } catch (error) {
    console.error("❌ Seeding sequence critically failed:", error);
  } finally {
    await pool.end();
  }
}

seedSpatialCore();
