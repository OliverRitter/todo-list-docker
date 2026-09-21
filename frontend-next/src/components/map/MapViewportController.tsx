"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import { useSpatialStore, type MapBounds } from "@/store/useSpatialStore";

export function MapViewportController() {
  const map = useMap();
  const fetchMapTodos = useSpatialStore((state) => state.fetchMapTodos);
  const requestId = useRef(0);

  const fetchVisibleTodos = useCallback(() => {
    const rawBounds = map.getBounds();
    const southWest = map.wrapLatLng(rawBounds.getSouthWest());
    const northEast = map.wrapLatLng(rawBounds.getNorthEast());

    let minLng = southWest.lng;
    let maxLng = northEast.lng;

    if (minLng > maxLng) {
      minLng = -180;
      maxLng = 180;
    }

    const bounds: MapBounds = {
      minLat: Math.max(-90, southWest.lat),
      maxLat: Math.min(90, northEast.lat),
      minLng,
      maxLng,
    };

    const currentRequestId = ++requestId.current;

    void fetchMapTodos(bounds).catch((error) => {
      if (currentRequestId === requestId.current) {
        console.error("Failed to fetch visible map tasks:", error);
      }
    });
  }, [fetchMapTodos, map]);

  useMapEvents({ moveend: fetchVisibleTodos });

  useEffect(() => {
    fetchVisibleTodos();
  }, [fetchVisibleTodos]);

  return null;
}
