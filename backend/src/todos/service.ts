import { and, asc, desc, ilike, or, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { todos } from "../db/schema.js";
import type { NewTodoPayload } from "./validator.js";

export interface TodoFilters {
  search: string;
  timeframe: "all" | "past" | "future";
  sortBy: "createdAt" | "dueDate" | "distance";
  distanceOrder: "asc" | "desc";
  maxDistanceKm: number;
  page: number;
  limit: number;
  lat: number;
  lng: number;
}

export async function findTodos(filters: TodoFilters) {
  const conditions = [];

  if (filters.search) {
    const pattern = `%${filters.search}%`;
    conditions.push(
      or(ilike(todos.title, pattern), ilike(todos.creatorName, pattern)),
    );
  }

  const now = new Date();
  if (filters.timeframe === "future")
    conditions.push(sql`${todos.dueDate} >= ${now}`);
  if (filters.timeframe === "past")
    conditions.push(sql`${todos.dueDate} < ${now}`);

  const hasCenter =
    Number.isFinite(filters.lat) && Number.isFinite(filters.lng);
  const distanceKm = hasCenter
    ? sql<number>`ST_Distance(${todos.location}::geography, ST_SetSRID(ST_MakePoint(${filters.lng}, ${filters.lat}), 4326)::geography) / 1000`
    : sql<number>`NULL`;

  if (
    hasCenter &&
    Number.isFinite(filters.maxDistanceKm) &&
    filters.maxDistanceKm > 0
  ) {
    conditions.push(
      sql`ST_DWithin(${todos.location}::geography, ST_SetSRID(ST_MakePoint(${filters.lng}, ${filters.lat}), 4326)::geography, ${filters.maxDistanceKm * 1000})`,
    );
  }

  const where = conditions.length ? and(...conditions) : undefined;
  const orderBy =
    filters.sortBy === "dueDate"
      ? asc(todos.dueDate)
      : filters.sortBy === "distance" && hasCenter
        ? filters.distanceOrder === "desc"
          ? desc(distanceKm)
          : asc(distanceKm)
        : desc(todos.createdAt);

  const [summary] = await db
    .select({ count: sql<number>`count(*)` })
    .from(todos)
    .where(where);
  const [bounds] = await db
    .select({
      minLat: sql<number>`min(ST_Y(${todos.location}::geometry))`,
      maxLat: sql<number>`max(ST_Y(${todos.location}::geometry))`,
      minLng: sql<number>`min(ST_X(${todos.location}::geometry))`,
      maxLng: sql<number>`max(ST_X(${todos.location}::geometry))`,
    })
    .from(todos)
    .where(where);
  const total = Number(summary.count);
  const mapBounds =
    bounds.minLat === null
      ? null
      : {
          minLat: Number(bounds.minLat),
          maxLat: Number(bounds.maxLat),
          minLng: Number(bounds.minLng),
          maxLng: Number(bounds.maxLng),
        };
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
    .where(where)
    .orderBy(orderBy)
    .limit(filters.limit)
    .offset((filters.page - 1) * filters.limit);

  return {
    items,
    pagination: {
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.max(1, Math.ceil(total / filters.limit)),
    },
    mapBounds,
  };
}

export async function findTodosInBounds(bounds: {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}) {
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
    })
    .from(todos)
    .where(
      sql`${todos.location} && ST_MakeEnvelope(${bounds.minLng}, ${bounds.minLat}, ${bounds.maxLng}, ${bounds.maxLat}, 4326)`,
    )
    .orderBy(desc(todos.createdAt))
    .limit(1000);

  return { items, truncated: items.length === 1000 };
}

export async function createTodo(
  payload: NewTodoPayload,
  creatorId: string,
  creatorName: string,
) {
  const lat = parseFloat(String(payload.lat));
  const lng = parseFloat(String(payload.lng));

  const result = await db.execute(sql`
    INSERT INTO todos (
      title,
      category,
      due_date,
      creator_id,
      creator_name,
      city,
      country,
      location
    )
    VALUES (
      ${payload.title},
      ${payload.category},
      ${new Date(payload.dueDate)},
      ${creatorId},
      ${creatorName},
      ${payload.city || null},
      ${payload.country || null},
      ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
    )
    RETURNING
      id,
      title,
      category,
      due_date,
      creator_id,
      creator_name,
      city,
      country,
      created_at,
      ST_X(location::geometry) AS lng,
      ST_Y(location::geometry) AS lat
  `);

  return result.rows;
}

export async function deleteTodo(id: string, creatorId: string) {
  const result = await db.execute(sql`
    DELETE FROM todos
    WHERE id = ${id} AND creator_id = ${creatorId}
    RETURNING id;
  `);
  return result.rows.at(0) ?? null;
}
