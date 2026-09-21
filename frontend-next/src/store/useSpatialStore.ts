import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import { backendUrl } from "@/lib/backend-url";

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

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
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
  mapBounds: MapBounds | null;
  selectedTaskLocation: [number, number] | null;
  crosshairPosition: [number, number] | null;
  initStore: () => (() => void) | undefined;
  fetchMapTodos: (bounds: MapBounds) => Promise<void>;
  fetchTodos: (overrides?: Partial<TodoFilters>) => Promise<void>;
  setFilters: (filters: Partial<TodoFilters>) => void;
  setTaskLocation: (lat: number, lng: number) => void;
  setCrosshairPosition: (lat: number, lng: number) => void;
  removeTodo: (id: string) => void;
}

let latestFetchId = 0;
let latestMapFetchId = 0;
let mapRequestController: AbortController | null = null;
let todosRequestController: AbortController | null = null;

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
  mapBounds: null,
  selectedTaskLocation: null,
  crosshairPosition: null,

  fetchMapTodos: async (bounds) => {
    const fetchId = ++latestMapFetchId;
    mapRequestController?.abort();
    const requestController = new AbortController();
    mapRequestController = requestController;

    const url = new URL(`${backendUrl}/api/todos/map`);
    url.search = new URLSearchParams({
      minLat: String(bounds.minLat),
      maxLat: String(bounds.maxLat),
      minLng: String(bounds.minLng),
      maxLng: String(bounds.maxLng),
    }).toString();

    try {
      const response = await fetch(url, {
        signal: requestController.signal,
      });
      if (!response.ok) throw new Error("Failed to fetch visible map tasks");

      const data = await response.json();
      if (fetchId !== latestMapFetchId) return;
      set({ todos: data.items ?? [] });
    } catch (error) {
      if (requestController.signal.aborted) return;
      throw error;
    }
  },

  fetchTodos: async (overrides = {}) => {
    const filters = { ...get().filters, ...overrides };
    const fetchId = ++latestFetchId;
    todosRequestController?.abort();
    const requestController = new AbortController();
    todosRequestController = requestController;

    const url = new URL(`${backendUrl}/api/todos`);
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

    url.search = params.toString();

    try {
      const response = await fetch(url, {
        signal: requestController.signal,
      });
      if (!response.ok) throw new Error("Failed to fetch spatial tasks");

      const data = await response.json();
      if (fetchId !== latestFetchId) return;

      set({
        filters,
        filteredTodos: data.items ?? [],
        mapBounds: data.mapBounds ?? null,
        pagination: data.pagination ?? {
          total: data.items?.length ?? 0,
          page: filters.page,
          limit: filters.limit,
          totalPages: 1,
        },
      });
    } catch (error) {
      if (requestController.signal.aborted) return;
      throw error;
    }
  },

  setFilters: (updates) => {
    const currentFilters = get().filters;

    // 1. Check if the user is changing pages vs changing query parameters
    const isPageChange = "page" in updates || "limit" in updates;

    // 2. Safely calculate the targeted page layer
    const targetPage = isPageChange ? (updates.page ?? currentFilters.page) : 1;
    const targetLimit = updates.limit ?? currentFilters.limit;

    const nextFilters = {
      ...currentFilters,
      ...updates,
      page: targetPage,
      limit: targetLimit,
    };

    // 3. Keep BOTH in sync so the backend API data doesn't break your UI
    set({
      filters: nextFilters,
      pagination: {
        ...get().pagination,
        page: targetPage,
        limit: targetLimit,
      },
    });

    // 4. Trigger backend refresh with the fresh filters mapping
    void get().fetchTodos(nextFilters);
  },

  initStore: () => {
    if (get().socket) return;

    get()
      .fetchTodos()
      .catch((err) => console.error("❌ Failed filtered spatial fetch:", err));

    const socketInstance = io(backendUrl, {
      withCredentials: true,
      transports: ["polling", "websocket"],
    });

    const taskSyncedHandler = (newRows: SpatialTodo[] | SpatialTodo) => {
      const rowsArray = Array.isArray(newRows) ? newRows : [newRows];
      set((state) => ({
        todos: [...rowsArray, ...state.todos],
      }));
      void get().fetchTodos();
    };

    const taskDeletedHandler = (deletedId: string) => {
      get().removeTodo(deletedId);
    };

    socketInstance.on("task-synced", taskSyncedHandler);
    socketInstance.on("task-deleted", taskDeletedHandler);

    set({ socket: socketInstance });

    return () => {
      socketInstance.off("task-synced", taskSyncedHandler);
      socketInstance.off("task-deleted", taskDeletedHandler);
      socketInstance.disconnect();
      set({ socket: null });
    };
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
