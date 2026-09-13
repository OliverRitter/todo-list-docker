import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import pkg from "pg";
const { Pool } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";
import { and, asc, desc, ilike, or, sql } from "drizzle-orm";
import { parse as parseCookie } from "cookie-es";
import * as schema from "./db/schema.js";
import { todos } from "./db/schema.js";
import { z } from "zod";

const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  allowEIO3: true,
  transports: ["polling", "websocket"],
  pingTimeout: 60000,
  pingInterval: 25000,
});

const backendTaskSchema = z.object({
  title: z.string().min(3),
  category: z.enum(["Work", "Shopping", "Personal"]),
  dueDate: z.string().min(1),
  lat: z.number().or(z.string().refine((val) => !isNaN(parseFloat(val)))),
  lng: z.number().or(z.string().refine((val) => !isNaN(parseFloat(val)))),
  city: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
});

function getCookieValue(cookieHeader: string, name: string): string | null {
  if (!cookieHeader) return null;
  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const [key, value] = pair.split("=");
    if (key && key.trim() === name && value) {
      const decodedValue = decodeURIComponent(value.trim());
      return decodedValue.split(".").at(0) || decodedValue;
    }
  }
  return null;
}

io.use(async (socket, next) => {
  try {
    const rawCookies = socket.handshake.headers.cookie;
    if (!rawCookies)
      return next(new Error("Authentication failed: No cookies"));

    const parsed = parseCookie(rawCookies);
    const rawToken = parsed["better-auth.session_token"];
    if (!rawToken)
      return next(new Error("Authentication failed: No session token"));

    const sessionToken = rawToken.split(".").at(0) || rawToken;

    const sessionResult = await db.execute(sql`
      SELECT s.user_id, u.name as user_name 
      FROM "session" s
      INNER JOIN "user" u ON s.user_id = u.id
      WHERE s.token = ${sessionToken} AND s.expires_at > CURRENT_TIMESTAMP
      LIMIT 1;
    `);

    if (!sessionResult?.rows?.length)
      return next(new Error("Authentication failed: Invalid session"));

    const activeRow = sessionResult.rows.at(0);
    if (!activeRow)
      return next(new Error("Authentication failed: Malformed row payload"));

    (socket as any).userId = activeRow.user_id;
    (socket as any).userName = activeRow.user_name;

    next();
  } catch (err: any) {
    console.error("❌ Handshake connection exception:", err?.message || err);
    next(new Error("Authentication middleware crash"));
  }
});

app.get("/api/todos", async (req, res) => {
  try {
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const timeframe = req.query.timeframe === "past" || req.query.timeframe === "future"
      ? req.query.timeframe
      : "all";
    const sortBy = req.query.sortBy === "dueDate" || req.query.sortBy === "distance"
      ? req.query.sortBy
      : "createdAt";
    const distanceOrder = req.query.distanceOrder === "desc" ? "desc" : "asc";
    const maxDistanceKm = Number.parseFloat(String(req.query.maxDistanceKm));
    const page = Math.max(1, Number.parseInt(String(req.query.page || "1"), 10) || 1);
    const limit = Math.min(10000, Math.max(1, Number.parseInt(String(req.query.limit || "10"), 10) || 10));
    const centerLat = Number.parseFloat(String(req.query.lat));
    const centerLng = Number.parseFloat(String(req.query.lng));
    const hasCenter = Number.isFinite(centerLat) && Number.isFinite(centerLng);
    const now = new Date();
    const filters = [];

    if (search) {
      const pattern = `%${search}%`;
      filters.push(or(ilike(todos.title, pattern), ilike(todos.creatorName, pattern)));
    }
    if (timeframe === "future") filters.push(sql`${todos.dueDate} >= ${now}`);
    if (timeframe === "past") filters.push(sql`${todos.dueDate} < ${now}`);

    const distanceKm = hasCenter
      ? sql<number>`ST_Distance(${todos.location}::geography, ST_SetSRID(ST_MakePoint(${centerLng}, ${centerLat}), 4326)::geography) / 1000`
      : sql<number>`NULL`;
    if (hasCenter && Number.isFinite(maxDistanceKm) && maxDistanceKm > 0) {
      filters.push(sql`ST_DWithin(${todos.location}::geography, ST_SetSRID(ST_MakePoint(${centerLng}, ${centerLat}), 4326)::geography, ${maxDistanceKm * 1000})`);
    }
    const filteredWhereClause = filters.length ? and(...filters) : undefined;
    const orderBy = sortBy === "dueDate"
      ? asc(todos.dueDate)
      : sortBy === "distance" && hasCenter
        ? distanceOrder === "desc" ? desc(distanceKm) : asc(distanceKm)
        : desc(todos.createdAt);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(todos)
      .where(filteredWhereClause);
    const total = Number(count);
    const items = await db
      .select({
        id: todos.id,
        title: todos.title,
        category: todos.category,
        due_date: todos.dueDate,
        creator_id: todos.creatorId,
        creator_name: todos.creatorName,
        city: todos.city,
        country: todos.country,
        created_at: todos.createdAt,
        lng: sql<number>`ST_X(${todos.location}::geometry)`,
        lat: sql<number>`ST_Y(${todos.location}::geometry)`,
        distanceKm,
      })
      .from(todos)
      .where(filteredWhereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset((page - 1) * limit);

    return res.json({
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (err) {
    console.error("❌ Spatial query lookup failure:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch filtered spatial data track" });
  }
});

app.delete("/api/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.execute(sql`
      DELETE FROM todos WHERE id = ${id} RETURNING id;
    `);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Task node not found" });
    }

    io.emit("task-deleted", id);

    return res.status(200).json({ success: true, deletedId: id });
  } catch (err) {
    console.error("❌ SQL Deletion crash:", err);
    return res.status(500).json({ error: "Database execution error" });
  }
});

io.on("connection", (socket) => {
  socket.on("broadcast-task", async (payload) => {
    try {
      const parsedPayload = backendTaskSchema.parse(payload);

      const { title, category, dueDate, city, country } = parsedPayload;
      const lat = parseFloat(String(parsedPayload.lat));
      const lng = parseFloat(String(parsedPayload.lng));

      const creatorId = (socket as any).userId;
      const creatorName = (socket as any).userName;
      const parsedDate = new Date(dueDate);

      const newTodoRows = await db.execute(sql`
        INSERT INTO todos (title, category, due_date, creator_id, creator_name, lat, lng, city, country, location)
        VALUES (${title}, ${category}, ${parsedDate}, ${creatorId}, ${creatorName}, ${String(lat)}, ${String(lng)}, ${city || null}, ${country || null}, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326))
        RETURNING id, title, category, due_date, creator_id, creator_name, city, country, created_at,
                  ST_X(location::geometry) as lng,
                  ST_Y(location::geometry) as lat
      `);

      io.emit("task-synced", newTodoRows.rows);
    } catch (err: any) {
      console.error("❌ Server Rejected Task Broadcast:", err?.message || err);
      socket.emit("error-alert", {
        message:
          "Input data schema check failed. Rejected by backend firewall.",
      });
    }
  });
});

httpServer.listen(4000, () => {
  console.log("🚀 Real-Time Spatial Backend running on port 4000");
});
