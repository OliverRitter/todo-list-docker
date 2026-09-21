"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import type { SpatialTodo } from "@/store/useSpatialStore";

interface MapControllerProps {
  todos: SpatialTodo[];
  filteredTodos: SpatialTodo[];
  filterKey: string;
  sidebarOpen: boolean;
}

export function MapController({
  todos,
  filteredTodos,
  filterKey,
  sidebarOpen,
}: MapControllerProps) {
  const map = useMap();
  const previousFilterKey = useRef(filterKey);
  const hasInitialized = useRef(false);

  useEffect(() => {
    map.invalidateSize();
    const resizeTimer = window.setTimeout(() => {
      map.invalidateSize({ animate: false, pan: false });
    }, 350);
    return () => window.clearTimeout(resizeTimer);
  }, [map, sidebarOpen]);

  useEffect(() => {
    const fitTarget = filteredTodos.length > 0 ? filteredTodos : todos;
    const fitTodos = (source: SpatialTodo[]) => {
      const points = source
        .filter(
          (todo) =>
            Number.isFinite(Number(todo.lat)) &&
            Number.isFinite(Number(todo.lng)),
        )
        .map(
          (todo) => [Number(todo.lat), Number(todo.lng)] as [number, number],
        );

      if (points.length > 0) {
        map.fitBounds(points, { padding: [100, 100], maxZoom: 10 });
      }
    };

    if (!hasInitialized.current && fitTarget.length > 0) {
      fitTodos(fitTarget);
      hasInitialized.current = true;
    } else if (
      hasInitialized.current &&
      previousFilterKey.current !== filterKey &&
      fitTarget.length > 0
    ) {
      fitTodos(fitTarget);
    }

    previousFilterKey.current = filterKey;
  }, [filterKey, filteredTodos, map, todos]);

  return null;
}
