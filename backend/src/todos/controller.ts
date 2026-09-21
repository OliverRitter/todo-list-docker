import type { Request, Response } from "express";
import { deleteTodo, findTodos, findTodosInBounds } from "./service.js";
import { mapBoundsSchema, todoIdSchema } from "./validator.js";

export async function listTodos(req: Request, res: Response) {
  try {
    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";
    const timeframe =
      req.query.timeframe === "past" || req.query.timeframe === "future"
        ? req.query.timeframe
        : "all";
    const sortBy =
      req.query.sortBy === "dueDate" || req.query.sortBy === "distance"
        ? req.query.sortBy
        : "createdAt";
    const distanceOrder = req.query.distanceOrder === "desc" ? "desc" : "asc";
    const page = Math.max(
      1,
      Number.parseInt(String(req.query.page || "1"), 10) || 1,
    );
    const limit = Math.min(
      10000,
      Math.max(1, Number.parseInt(String(req.query.limit || "10"), 10) || 10),
    );
    const lat = Number.parseFloat(String(req.query.lat));
    const lng = Number.parseFloat(String(req.query.lng));
    const maxDistanceKm = Number.parseFloat(String(req.query.maxDistanceKm));

    return res.json(
      await findTodos({
        search,
        timeframe,
        sortBy,
        distanceOrder,
        maxDistanceKm,
        page,
        limit,
        lat,
        lng,
      }),
    );
  } catch (error) {
    console.error("Spatial query lookup failure:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch filtered spatial data" });
  }
}

export async function listTodosInBounds(req: Request, res: Response) {
  const parsedBounds = mapBoundsSchema.safeParse({
    minLat: req.query.minLat,
    maxLat: req.query.maxLat,
    minLng: req.query.minLng,
    maxLng: req.query.maxLng,
  });

  if (!parsedBounds.success) {
    return res.status(400).json({ error: "Invalid map bounds" });
  }

  try {
    return res.json(await findTodosInBounds(parsedBounds.data));
  } catch (error) {
    console.error("Map bounds lookup failure:", error);
    return res.status(500).json({ error: "Failed to fetch map data" });
  }
}

export async function removeTodo(
  req: Request,
  res: Response,
  emitDeleted: (id: string) => void,
) {
  try {
    const parsedId = todoIdSchema.safeParse(req.params.id);
    if (!parsedId.success)
      return res.status(400).json({ error: "Invalid task ID" });

    const deleted = await deleteTodo(parsedId.data, res.locals.userId);
    if (!deleted) return res.status(404).json({ error: "Task not found" });

    emitDeleted(parsedId.data);
    return res.status(200).json({ success: true, deletedId: parsedId.data });
  } catch (error) {
    console.error("SQL deletion failure:", error);
    return res.status(500).json({ error: "Database execution error" });
  }
}
