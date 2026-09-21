"use client";

import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

interface GeocodeResult {
  name?: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

interface LocationDropdownProps {
  onLocationSelect: (data: {
    lat: number;
    lng: number;
    city: string;
    country: string;
  }) => void;
}

export default function LocationDropdown({
  onLocationSelect,
}: LocationDropdownProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const executeSearch = async (searchTerm: string = query) => {
    const trimmedQuery = searchTerm.trim();
    if (trimmedQuery.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmedQuery)}&limit=5`,
      );
      if (!response.ok) throw new Error("Geocoding failed");
      const data = await response.json();
      const nextResults = Array.isArray(data.results) ? data.results : [];
      setResults(nextResults);
      setIsOpen(nextResults.length > 0);
    } catch (err) {
      console.error("❌ Geocoding search failed:", err);
      setResults([]);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.includes(",")) return;

    const delayDebounce = setTimeout(() => {
      if (trimmed.length >= 3) {
        executeSearch(query);
      }
    }, 1000);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setQuery(nextValue);
    if (!nextValue.trim()) {
      setResults([]);
      setIsOpen(false);
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
    <div ref={containerRef} className="relative w-full space-y-1">
      <label className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
        LOCATION SEARCH
      </label>

      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Type city (e.g., Wien)..."
            className="w-full text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-3 pr-10 py-2 outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100 shadow-sm"
            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-indigo-500 border-t-transparent" />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => executeSearch()}
          disabled={loading || query.trim().length < 3}
          className="bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 text-white p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer shrink-0 transition-all flex items-center justify-center shadow-sm"
          title="Search Location"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      {isOpen && results.length > 0 && (
        <ul className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          {results.map((item, idx) => {
            const city = item.name || "Unknown City";
            const region = item.admin1 ? `${item.admin1}, ` : "";
            const country = item.country || "Unknown Country";

            return (
              <li
                key={`${city}-${idx}`}
                onClick={() => handleSelect(item)}
                className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer text-left transition-colors"
              >
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  {city}
                </p>
                <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                  {region}
                  {country}
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
}
