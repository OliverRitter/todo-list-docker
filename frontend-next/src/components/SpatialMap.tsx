"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FitBoundsButton } from "./FitBoundsButton";

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
    iconSize: [25, 41],
    popupAnchor: [0, -10],
  });
};

function MapController({ latestTodo }: { latestTodo: any }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.invalidateSize();

    if (latestTodo?.lat && latestTodo?.lng) {
      const latFloat = parseFloat(latestTodo.lat);
      const lngFloat = parseFloat(latestTodo.lng);

      if (!isNaN(latFloat) && !isNaN(lngFloat)) {
        map.flyTo([latFloat, lngFloat], 13, { animate: true, duration: 1.2 });
      }
    }
  }, [latestTodo, map]);

  return null;
}

interface MapProps {
  todos: any[];
}

export default function SpatialMap({ todos }: MapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const latestTodo = todos[0];

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  if (!isMounted) {
    return (
      <div className="w-full h-[400px] bg-slate-100 dark:bg-slate-900 rounded-2xl animate-pulse" />
    );
  }

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm z-0 relative h-[400px]">
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

        <MapController latestTodo={latestTodo} />
        <FitBoundsButton todos={todos} />

        {todos.map((todo) => {
          if (!todo.lat || !todo.lng) return null;

          return (
            <Marker
              key={todo.id || Math.random()}
              position={[parseFloat(todo.lat), parseFloat(todo.lng)]}
              icon={createPulseIcon(todo.category)}
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
