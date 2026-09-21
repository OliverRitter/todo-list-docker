"use client";

import type L from "leaflet";
import { Marker, Popup } from "react-leaflet";
import type { SpatialTodo } from "@/store/useSpatialStore";
import { backendUrl } from "@/lib/backend-url";
import { createMutedIcon, createPulseIcon } from "./marker-icons";

interface TaskMarkerProps {
  todo: SpatialTodo;
  isFiltered: boolean;
  onClose: () => void;
}

export function TaskMarker({ todo, isFiltered, onClose }: TaskMarkerProps) {
  if (!todo.lat || !todo.lng) return null;

  const icon = isFiltered ? createPulseIcon(todo.category) : createMutedIcon();

  const handleDelete = async () => {
    try {
      onClose();
      const response = await fetch(`${backendUrl}/api/todos/${todo.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) console.error("Backend rejected deletion request");
    } catch (error) {
      console.error("Failed deleting target spatial task:", error);
    }
  };

  return (
    <Marker
      position={[Number(todo.lat), Number(todo.lng)]}
      icon={icon as L.Icon}
    >
      <Popup>
        <div className="text-slate-900 font-sans p-1 min-w-35 space-y-2">
          <div>
            <p className="font-bold text-sm mb-0.5 leading-tight">
              {todo.title}
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              Type: {todo.category}
            </p>
            <p className="text-[10px] text-slate-500">
              Created by:{" "}
              <span className="font-semibold text-slate-700">
                {todo.creator_name || "Unknown user"}
              </span>
            </p>
          </div>
          {todo.city && (
            <p className="text-[10px] font-semibold text-indigo-600 bg-indigo-50/50 px-1.5 py-0.5 rounded w-fit">
              {todo.city}, {todo.country || ""}
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
              onClick={handleDelete}
              className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded transition-colors cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
