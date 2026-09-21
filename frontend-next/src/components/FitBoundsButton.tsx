"use client";

import { useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { type MapBounds, type SpatialTodo } from "@/store/useSpatialStore";

interface FitBoundsButtonProps {
  todos: SpatialTodo[];
  filteredTodos: SpatialTodo[];
  taskCount: number;
  bounds: MapBounds | null;
}

export function FitBoundsButton({
  todos,
  filteredTodos,
  taskCount,
  bounds: taskBounds,
}: FitBoundsButtonProps) {
  const map = useMap();
  const [isCentering, setIsCentering] = useState(false);

  const handleCenterAll = () => {
    const targetTodos = filteredTodos.length > 0 ? filteredTodos : todos;

    if (!targetTodos || targetTodos.length === 0) {
      if (!taskBounds) return;

      map.invalidateSize();
      map.flyToBounds(
        L.latLngBounds(
          [taskBounds.minLat, taskBounds.minLng],
          [taskBounds.maxLat, taskBounds.maxLng],
        ),
        {
          padding: [80, 80],
          maxZoom: 10,
          animate: true,
          duration: 2.5,
        },
      );
      return;
    }

    const points = targetTodos
      .map((t) => [
        typeof t.lat === "number" ? t.lat : parseFloat(t.lat),
        typeof t.lng === "number" ? t.lng : parseFloat(t.lng),
      ])
      .filter(
        ([lat, lng]) =>
          !isNaN(lat) &&
          !isNaN(lng) &&
          lat >= -90 &&
          lat <= 90 &&
          lng >= -180 &&
          lng <= 180,
      );

    if (points.length === 0) return;

    const visibleBounds = L.latLngBounds(points as L.LatLngExpression[]);
    setIsCentering(true);

    try {
      map.invalidateSize();
      map.flyToBounds(visibleBounds, {
        padding: [80, 80],
        maxZoom: 10,
        animate: true,
        duration: 1.5,
      });
    } finally {
      setIsCentering(false);
    }
  };

  return (
    <button
      onClick={handleCenterAll}
      type="button"
      disabled={isCentering || taskCount === 0}
      className="absolute bottom-4 right-4 z-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-mono font-bold px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 mb-4"
    >
      {isCentering
        ? "Loading all tasks..."
        : `🗺️ Center All Tasks (${taskCount})`}
    </button>
  );
}
