"use client";

import { useMap } from "react-leaflet";
import L from "leaflet";

interface FitBoundsButtonProps {
  todos: any[];
}

export function FitBoundsButton({ todos }: FitBoundsButtonProps) {
  const map = useMap();
  const handleCenterAll = () => {
    if (!todos || todos.length === 0) return;

    const points = todos
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

    const bounds = L.latLngBounds(points as L.LatLngExpression[]);

    map.invalidateSize();

    map.flyToBounds(bounds, {
      padding: [20, 20],
      maxZoom: 15,
      animate: true,
      duration: 1.5,
    });
  };

  return (
    <button
      onClick={handleCenterAll}
      type="button"
      className="absolute bottom-4 right-4 z-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-mono font-bold px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
    >
      🗺️ Center All Tasks ({todos.length})
    </button>
  );
}
