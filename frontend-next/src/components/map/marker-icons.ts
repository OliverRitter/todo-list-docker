import L from "leaflet";

export function createPulseIcon(category: string) {
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
    popupAnchor: [0, -10],
  });
}

export function createMutedIcon() {
  return L.divIcon({
    html: '<span class="block h-3 w-3 rounded-full border border-slate-400 bg-slate-400/60 shadow-sm"></span>',
    className: "muted-leaflet-marker",
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}
