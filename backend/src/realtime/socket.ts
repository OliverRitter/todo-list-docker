import type { Server, Socket } from "socket.io";
import { getAuthenticatedUser } from "../auth/session.js";
import { createTodo } from "../todos/service.js";
import { backendTaskSchema } from "../todos/validator.js";

export function configureSocket(io: Server) {
  io.use(async (socket, next) => {
    try {
      const user = await getAuthenticatedUser(socket.handshake.headers.cookie);
      if (!user)
        return next(new Error("Authentication failed: Invalid session"));

      socket.data.userId = user.userId;
      socket.data.userName = user.userName;
      return next();
    } catch (error) {
      console.error("Handshake connection exception:", error);
      return next(new Error("Authentication middleware crash"));
    }
  });

  io.on("connection", (socket: Socket) => {
    socket.on("broadcast-task", async (payload, acknowledge) => {
      try {
        const parsedPayload = backendTaskSchema.parse(payload);
        const rows = await createTodo(
          parsedPayload,
          socket.data.userId,
          socket.data.userName,
        );
        io.emit("task-synced", rows);
        acknowledge?.({ ok: true });
      } catch (error) {
        console.error("Server rejected task broadcast:", error);
        acknowledge?.({
          ok: false,
          message: "The task could not be saved. Please try again.",
        });
        socket.emit("error-alert", {
          message:
            "Input data schema check failed. Rejected by backend firewall.",
        });
      }
    });
  });
}
