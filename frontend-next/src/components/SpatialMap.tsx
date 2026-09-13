"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FitBoundsButton } from "./FitBoundsButton";
import type { SpatialTodo } from "@/store/useSpatialStore";

const createPulseIcon = (category: string) => {
  const colorMap: Record<string, string> = {
    Work: "bg-indigo-500 border-indigo-200",
    Shopping: "bg-emerald-500 border-emerald-200",
    Personal: "bg-rose-500 border-rose-200",
  };
  const selectedColor = colorMap[category] || "bg-amber-500 border-amber-200";

  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center w-6 h-6">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${selectedColor} opacity-75"></span>
        <span class="relative inline-flex rounded-full h-3 w-3 ${selectedColor} border-2 shadow-md"></span>
      </div>
    `,
    className: "custom-pulse-leaflet-marker",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [0, -10],
  });
};

const createMutedIcon = () =>
  L.divIcon({
    html: '<span class="block h-3 w-3 rounded-full border border-slate-400 bg-slate-400/60 shadow-sm"></span>',
    className: "muted-leaflet-marker",
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });

function MapController({
  todos,
  filteredTodos,
  filterKey,
  sidebarOpen,
}: {
  todos: SpatialTodo[];
  filteredTodos: SpatialTodo[];
  filterKey: string;
  sidebarOpen: boolean;
}) {
  const map = useMap();
  const previousFilterKey = useRef(filterKey);
  const previousTodoIds = useRef<string[]>([]);
  const previousFilteredTodoIds = useRef<string[]>([]);
  const needsFilterFit = useRef(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!map) return;
    map.invalidateSize();

    const resizeTimer = window.setTimeout(() => {
      map.invalidateSize({ animate: false, pan: false });
    }, 350);

    return () => window.clearTimeout(resizeTimer);
  }, [map, sidebarOpen]);

  useEffect(() => {
    if (!map) return;

    const todoIds = todos.map((todo) => todo.id);
    if (previousFilterKey.current !== filterKey) {
      previousFilterKey.current = filterKey;
      needsFilterFit.current = true;
    }

    const previousIds = previousTodoIds.current;
    const filteredTodoIds = filteredTodos.map((todo) => todo.id);
    const previousFilteredIds = previousFilteredTodoIds.current;
    const filteredIdsChanged =
      previousFilteredIds.length !== filteredTodoIds.length ||
      previousFilteredIds.some((id, index) => id !== filteredTodoIds[index]);

    const fitTodos = (source: SpatialTodo[]) => {
      const points = source
        .filter(
          (todo) =>
            Number.isFinite(Number(todo.lat)) &&
            Number.isFinite(Number(todo.lng)),
        )
        .map((todo) => [Number(todo.lat), Number(todo.lng)] as [number, number]);

      if (points.length > 0) {
        map.fitBounds(points, { padding: [100, 100], maxZoom: 10 });
      }
    };

    if (!hasInitialized.current && todos.length > 0) {
      fitTodos(todos);
      hasInitialized.current = true;
    } else if (
      hasInitialized.current &&
      needsFilterFit.current &&
      filteredIdsChanged
    ) {
      fitTodos(filteredTodos);
      needsFilterFit.current = false;
    } else if (hasInitialized.current) {
      const previousIdSet = new Set(previousIds);
      const newTodo = todos.find((todo) => !previousIdSet.has(todo.id));
      if (
        newTodo &&
        Number.isFinite(Number(newTodo.lat)) &&
        Number.isFinite(Number(newTodo.lng))
      ) {
        map.flyTo([Number(newTodo.lat), Number(newTodo.lng)], 13, {
          animate: true,
          duration: 1.2,
        });
      }
    }

    previousTodoIds.current = todoIds;
    previousFilteredTodoIds.current = filteredTodoIds;
  }, [filterKey, filteredTodos, map, todos]);

  return null;
}

interface MapProps {
  todos: SpatialTodo[];
  filteredTodos: SpatialTodo[];
  filterKey: string;
}

export default function SpatialMap({
  todos,
  filteredTodos,
  filterKey,
  sidebarOpen,
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="relative z-0 h-full w-full overflow-hidden border-l border-slate-200 shadow-sm dark:border-slate-800">
      <MapContainer
        center={[0, 0]}
        zoom={2}
        style={{ height: "100%", width: "100%" }}
        ref={(mapInstance) => {
          if (mapInstance) mapRef.current = mapInstance;
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController
          todos={todos}
          filteredTodos={filteredTodos}
          filterKey={filterKey}
          sidebarOpen={sidebarOpen}
        />
        <FitBoundsButton todos={todos} />

        {todos.map((todo) => {
          if (!todo.lat || !todo.lng) return null;

          return (
            <Marker
              key={todo.id}
              position={[Number(todo.lat), Number(todo.lng)]}
              icon={
                filteredTodos.some((filteredTodo) => filteredTodo.id === todo.id)
                  ? createPulseIcon(todo.category)
                  : createMutedIcon()
              }
            >
              <Popup>
                <div className="text-slate-900 font-sans p-1 min-w-[140px] space-y-2">
                  <div>
                    <p className="font-bold text-sm mb-0.5 leading-tight">
                      {todo.title}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      Type: {todo.category}
                    </p>
                  </div>

                  {todo.city && (
                    <p className="text-[10px] font-semibold text-indigo-600 bg-indigo-50/50 px-1.5 py-0.5 rounded w-fit">
                      🏙️ {todo.city}, {todo.country || ""}
                    </p>
                  )}

                  {todo.distanceKm !== null && todo.distanceKm !== undefined && (
                    <p className="text-[10px] font-mono text-emerald-600">
                      {Number(todo.distanceKm).toFixed(2)} km away
                    </p>
                  )}

                  <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[9px] text-slate-400 font-mono">
                      {todo.due_date
                        ? new Date(todo.due_date).toLocaleDateString()
                        : "No Date"}
                    </span>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          if (mapRef.current) {
                            mapRef.current.closePopup();
                          }

                          const res = await fetch(
                            `http://localhost:4000/api/todos/${todo.id}`,
                            {
                              method: "DELETE",
                            },
                          );

                          if (!res.ok) {
                            console.error(
                              "❌ Backend rejected deletion request",
                            );
                          }
                        } catch (err) {
                          console.error(
                            "❌ Failed deleting target spatial task:",
                            err,
                          );
                        }
                      }}
                      className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
