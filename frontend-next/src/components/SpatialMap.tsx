"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FitBoundsButton } from "./FitBoundsButton";
import { MapController } from "./map/MapController";
import { MapViewportController } from "./map/MapViewportController";
import { TaskMarker } from "./map/TaskMarker";
import type { MapBounds, SpatialTodo } from "@/store/useSpatialStore";

interface MapProps {
  todos: SpatialTodo[];
  filteredTodos: SpatialTodo[];
  taskCount: number;
  mapBounds: MapBounds | null;
  filterKey: string;
  sidebarOpen: boolean;
}

export default function SpatialMap({
  todos,
  filteredTodos,
  taskCount,
  mapBounds,
  filterKey,
  sidebarOpen,
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const filteredIds = new Set(filteredTodos.map((todo) => todo.id));

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="relative z-0 h-full min-h-0 w-full overflow-hidden border-l border-slate-200 shadow-sm dark:border-slate-800">
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
        <MapViewportController />
        <FitBoundsButton
          todos={todos}
          filteredTodos={filteredTodos}
          taskCount={taskCount}
          bounds={mapBounds}
        />
        {todos.map((todo) => (
          <TaskMarker
            key={todo.id}
            todo={todo}
            isFiltered={filteredIds.has(todo.id)}
            onClose={() => mapRef.current?.closePopup()}
          />
        ))}
      </MapContainer>
    </div>
  );
}
