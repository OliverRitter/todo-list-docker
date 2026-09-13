"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { Search } from "lucide-react";

interface GeocodeResult {
  name?: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

interface GeocodeResponse {
  results?: GeocodeResult[];
}

export interface LocationDropdownHandle {
  clear: () => void;
}

interface LocationDropdownProps {
  onLocationSelect: (data: {
    lat: number;
    lng: number;
    city: string;
    country: string;
  }) => void;
}

const LocationDropdown = forwardRef<
  LocationDropdownHandle,
  LocationDropdownProps
>(({ onLocationSelect }, ref) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useImperativeHandle(ref, () => ({
    clear: () => {
      setQuery("");
      setResults([]);
      setIsOpen(false);
    },
  }));

  const executeSearch = async () => {
    if (query.trim().length < 3) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&addressdetails=1&limit=5`,
      );
      const data = await response.json();
      setResults(data.results ?? []);
      setIsOpen(true);
    } catch (err) {
      console.error("❌ Geocoding search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item: GeocodeResult) => {
    const city = item.name || "Unknown City";
    const country = item.country || "Unknown Country";

    const displayLabel = item.admin1
      ? `${city}, ${item.admin1}, ${country}`
      : `${city}, ${country}`;

    setQuery(displayLabel);
    setIsOpen(false);

    onLocationSelect({
      lat: item.latitude,
      lng: item.longitude,
      city,
      country,
    });
  };

  return (
    <div className="relative w-full space-y-1">
      <label className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
        LOCATION SEARCH
      </label>

      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type city (e.g., Wien)..."
          className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100 shadow-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              executeSearch();
            }
          }}
        />

        <button
          type="button"
          onClick={executeSearch}
          disabled={loading || query.trim().length < 3}
          className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer shrink-0 transition-all flex items-center justify-center"
          title="Search Location"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      {isOpen === true && results.length > 0 && (
        <ul className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {results.map((item, idx) => {
            console.log(item);
            return (
              <li
                key={idx}
                onClick={() => handleSelect(item)}
                className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-left transition-colors"
              >
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {item.admin1}
                </p>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {item.country}
                </p>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  📍 {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});

LocationDropdown.displayName = "LocationDropdown";

export default LocationDropdown;
