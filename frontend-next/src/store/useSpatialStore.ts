import { create } from "zustand";
import { io, type Socket } from "socket.io-client";

export type Timeframe = "all" | "future" | "past";
export type SortBy = "createdAt" | "dueDate" | "distance";
export type DistanceOrder = "asc" | "desc";

export interface TodoFilters {
  search: string;
  timeframe: Timeframe;
  sortBy: SortBy;
  distanceOrder: DistanceOrder;
  maxDistanceKm?: number;
  page: number;
  limit: number;
  lat?: number;
  lng?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SpatialTodo {
  id: string;
  title: string;
  category: string;
  due_date: string;
  creator_id: string;
  creator_name: string;
  city: string | null;
  country: string | null;
  created_at: string;
  lat: number;
  lng: number;
  distanceKm?: number | null;
}

interface SpatialState {
  socket: Socket | null;
  todos: SpatialTodo[];
  filteredTodos: SpatialTodo[];
  filters: TodoFilters;
  pagination: PaginationMeta;

  selectedTaskLocation: [number, number] | null;
  crosshairPosition: [number, number] | null;

  initStore: () => void;
  fetchAllTodos: () => Promise<void>;
  fetchTodos: (overrides?: Partial<TodoFilters>) => Promise<void>;
  setFilters: (filters: Partial<TodoFilters>) => void;
  setTaskLocation: (lat: number, lng: number) => void;
  setCrosshairPosition: (lat: number, lng: number) => void;

  removeTodo: (id: string) => void;
}

let latestFetchId = 0;

export const useSpatialStore = create<SpatialState>((set, get) => ({
  socket: null,
  todos: [],
  filteredTodos: [],
  filters: {
    search: "",
    timeframe: "all",
    sortBy: "createdAt",
    distanceOrder: "asc",
    page: 1,
    limit: 10,
  },
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  },
  selectedTaskLocation: null,
  crosshairPosition: null,

  fetchAllTodos: async () => {
    const response = await fetch(
      "http://localhost:4000/api/todos?timeframe=all&sortBy=createdAt&page=1&limit=10000",
    );
    if (!response.ok) throw new Error("Failed to fetch all spatial tasks");

    const data = await response.json();
    set({ todos: data.items ?? [] });
  },

  fetchTodos: async (overrides = {}) => {
    const filters = { ...get().filters, ...overrides };
    const fetchId = ++latestFetchId;
    const params = new URLSearchParams({
      search: filters.search,
      timeframe: filters.timeframe,
      sortBy: filters.sortBy,
      distanceOrder: filters.distanceOrder,
      page: String(filters.page),
      limit: String(filters.limit),
    });

    if (filters.lat !== undefined && filters.lng !== undefined) {
      params.set("lat", String(filters.lat));
      params.set("lng", String(filters.lng));
    }
    if (filters.maxDistanceKm !== undefined) {
      params.set("maxDistanceKm", String(filters.maxDistanceKm));
    }

    const response = await fetch(`http://localhost:4000/api/todos?${params}`);
    if (!response.ok) throw new Error("Failed to fetch spatial tasks");

    const data = await response.json();
    if (fetchId !== latestFetchId) return;

    set({
      filters,
      filteredTodos: data.items ?? [],
      pagination: data.pagination ?? {
        total: data.items?.length ?? 0,
        page: filters.page,
        limit: filters.limit,
        totalPages: 1,
      },
    });
  },

  setFilters: (updates) => {
    const nextFilters = { ...get().filters, ...updates };
    set({
      filters: nextFilters,
      pagination: {
        ...get().pagination,
        page: nextFilters.page,
        limit: nextFilters.limit,
      },
    });
    void get().fetchTodos(nextFilters);
  },

  initStore: () => {
    if (get().socket) return;

    get().fetchAllTodos().catch((err) =>
      console.error("❌ Failed full spatial fetch:", err),
    );
    get().fetchTodos().catch((err) =>
      console.error("❌ Failed filtered spatial fetch:", err),
    );

    const socketInstance = io("http://localhost:4000", {
      withCredentials: true,
      transports: ["polling", "websocket"],
    });

    socketInstance.on("task-synced", (newRows: SpatialTodo[] | SpatialTodo) => {
      const rowsArray = Array.isArray(newRows) ? newRows : [newRows];
      set((state) => ({
        todos: [...rowsArray, ...state.todos],
      }));
      void get().fetchTodos();
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
      filteredTodos: state.filteredTodos.filter((todo) => todo.id !== id),
    }));
  },
}));
