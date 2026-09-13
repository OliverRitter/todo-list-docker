import { create } from "zustand";
import { io } from "socket.io-client";

interface SpatialState {
  socket: any | null;
  todos: any[];

  selectedTaskLocation: [number, number] | null;
  crosshairPosition: [number, number] | null;

  initStore: () => void;
  setTaskLocation: (lat: number, lng: number) => void;
  setCrosshairPosition: (lat: number, lng: number) => void;

  removeTodo: (id: string) => void;
}

export const useSpatialStore = create<SpatialState>((set, get) => ({
  socket: null,
  todos: [],
  selectedTaskLocation: null,
  crosshairPosition: null,

  initStore: () => {
    if (get().socket) return;

    fetch("http://localhost:4000/api/todos")
      .then((res) => res.json())
      .then((data) => {
        set({ todos: data });
      })
      .catch((err) =>
        console.error("❌ Failed initial REST spatial fetch:", err),
      );

    const socketInstance = io("http://localhost:4000", {
      withCredentials: true,
      transports: ["polling", "websocket"],
    });

    socketInstance.on("task-synced", (newRows: any) => {
      const rowsArray = Array.isArray(newRows) ? newRows : [newRows];
      set((state) => ({ todos: [...rowsArray, ...state.todos] }));
    });

    socketInstance.on("task-deleted", (deletedId: string) => {
      get().removeTodo(deletedId);
    });

    set({ socket: socketInstance });
  },

  setTaskLocation: (lat, lng) => {
    set({ selectedTaskLocation: [lat, lng] });
  },

  setCrosshairPosition: (lat, lng) => {
    const current = get().crosshairPosition;
    if (current) {
      const deltaLat = Math.abs(current[0] - lat);
      const deltaLng = Math.abs(current[1] - lng);
      if (deltaLat < 0.00001 && deltaLng < 0.00001) return;
    }
    set({ crosshairPosition: [lat, lng] });
  },

  removeTodo: (id) => {
    set((state) => ({
      todos: state.todos.filter((todo) => todo.id !== id),
    }));
  },
}));
