"use client";

import { useEffect, useState } from "react";
import {
  type SortBy,
  type Timeframe,
  type DistanceOrder,
  useSpatialStore,
} from "@/store/useSpatialStore";

export default function TaskFilters() {
  const filters = useSpatialStore((state) => state.filters);
  const setFilters = useSpatialStore((state) => state.setFilters);
  const [locationStatus, setLocationStatus] = useState("");
  const pagination = useSpatialStore((state) => state.pagination);
  const updateFilters = (updates: Parameters<typeof setFilters>[0]) => {
    setFilters(updates);
  };

  const requestCurrentLocation = (onLocated?: () => void) => {
    if (!navigator.geolocation) {
      setLocationStatus("Location unavailable");
      return;
    }

    setLocationStatus("Locating...");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setFilters({ lat: coords.latitude, lng: coords.longitude });
        setLocationStatus("Distance ready");
        onLocated?.();
      },
      () => setLocationStatus("Location permission denied"),
    );
  };

  useEffect(() => {
    if (filters.lat !== undefined && filters.lng !== undefined) return;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setFilters({ lat: coords.latitude, lng: coords.longitude });
        setLocationStatus("Distance ready");
      },
      () => setLocationStatus("Location permission denied"),
    );
  }, [filters.lat, filters.lng, setFilters]);

  return (
    <section className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-4 shadow-sm">
      <div>
        <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">
          Task Filters
        </h3>
        <p className="text-[10px] font-mono text-slate-400">
          Refine the spatial task stream
        </p>
      </div>

      <input
        value={filters.search}
        onChange={(event) => updateFilters({ search: event.target.value })}
        placeholder="Search title or creator"
        className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100"
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="space-y-1 text-xs font-mono font-bold text-slate-400">
          TIMEFRAME
          <select
            value={filters.timeframe}
            onChange={(event) =>
              updateFilters({ timeframe: event.target.value as Timeframe })
            }
            className="w-full mt-1 text-sm font-sans font-normal bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
          >
            <option value="all">All tasks</option>
            <option value="future">Future</option>
            <option value="past">Past</option>
          </select>
        </label>

        <label className="space-y-1 text-xs font-mono font-bold text-slate-400">
          SORT BY
          <select
            value={filters.sortBy}
            onChange={(event) => {
              const sortBy = event.target.value as SortBy;
              updateFilters({ sortBy });
              if (
                sortBy === "distance" &&
                (filters.lat === undefined || filters.lng === undefined)
              ) {
                requestCurrentLocation();
              }
            }}
            className="w-full mt-1 text-sm font-sans font-normal bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100"
          >
            <option value="createdAt">Newest</option>
            <option value="dueDate">Due date</option>
            <option value="distance">Distance</option>
          </select>
        </label>

        <label className="space-y-1 text-xs font-mono font-bold text-slate-400">
          RESULTS
          <div className="mt-1 flex overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            {[4, 6, 10].map((limit) => (
              <button
                key={limit}
                type="button"
                onClick={() => updateFilters({ limit })}
                className={`min-w-0 flex-1 px-2 py-2 text-sm font-sans font-bold transition-colors cursor-pointer ${
                  filters.limit === limit
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {limit}
              </button>
            ))}
          </div>
        </label>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
        <div className="flex items-center justify-between gap-3">
          <label className="text-xs font-mono font-bold text-slate-400">
            MAX DISTANCE
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="1"
              max="20000"
              value={filters.maxDistanceKm ?? 100}
              onChange={(event) =>
                updateFilters({
                  maxDistanceKm: Math.min(
                    20000,
                    Math.max(1, Number(event.target.value) || 1),
                  ),
                })
              }
              className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-right text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <span className="text-[10px] font-mono text-slate-400">km</span>
          </div>
        </div>
        <input
          type="range"
          min="1"
          max="20000"
          step="10"
          value={filters.maxDistanceKm ?? 100}
          onChange={(event) =>
            updateFilters({ maxDistanceKm: Number(event.target.value) })
          }
          className="w-full accent-indigo-600"
          aria-label="Maximum distance in kilometers"
        />
        <label className="block text-xs font-mono font-bold text-slate-400">
          DISTANCE ORDER
          <select
            value={filters.distanceOrder}
            onChange={(event) =>
              updateFilters({
                distanceOrder: event.target.value as DistanceOrder,
              })
            }
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-sans font-normal text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="asc">Nearest first</option>
            <option value="desc">Farthest first</option>
          </select>
        </label>
        {filters.lat === undefined || filters.lng === undefined ? (
          <p className="text-[10px] font-mono text-amber-600">
            Set your current location to enable distance filtering.
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => requestCurrentLocation()}
        className="w-full text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 rounded-xl px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors cursor-pointer"
      >
        Use current location for distance
      </button>
      {locationStatus && (
        <p className="text-[10px] font-mono text-slate-400">{locationStatus}</p>
      )}

      <div className="flex items-center justify-between gap-3 pt-1">
        <button
          type="button"
          disabled={pagination.page <= 1}
          onClick={() => setFilters({ page: pagination.page - 1 })}
          className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="text-[10px] font-mono text-slate-400 text-center">
          Page {pagination.page} of {pagination.totalPages || 1}
          <br />
          {pagination.total} total
        </span>
        <button
          type="button"
          disabled={pagination.page >= (pagination.totalPages || 1)}
          onClick={() => setFilters({ page: pagination.page + 1 })}
          className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </section>
  );
}
