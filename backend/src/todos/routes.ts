import { Router } from "express";
import { requireAuthenticatedUser } from "../auth/session.js";
import { listTodos, listTodosInBounds, removeTodo } from "./controller.js";

export function createTodoRouter(emitDeleted: (id: string) => void) {
  const router = Router();
  router.get("/map", listTodosInBounds);
  router.get("/", listTodos);
  router.delete("/:id", requireAuthenticatedUser, (req, res) =>
    removeTodo(req, res, emitDeleted),
  );
  return router;
}
