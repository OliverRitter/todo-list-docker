import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { createTodoRouter } from "./todos/routes.js";
import { configureSocket } from "./realtime/socket.js";

const app = express();
const httpServer = createServer(app);
const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(express.json());

const io = new Server(httpServer, {
  cors: {
    origin: frontendOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  },
  allowEIO3: true,
  transports: ["polling", "websocket"],
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.use(
  "/api/todos",
  createTodoRouter((id) => io.emit("task-deleted", id)),
);
configureSocket(io);

httpServer.listen(4000, () => {
  console.log("Real-Time Spatial Backend running on port 4000");
});
