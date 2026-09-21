"use client";

import { motion } from "framer-motion";

interface SidebarHeaderProps {
  view: "form" | "explore";
  setView: (view: "form" | "explore") => void;
}

export default function SidebarHeader({ view, setView }: SidebarHeaderProps) {
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
      <button
        type="button"
        onClick={() => setView("form")}
        className={`relative flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-colors duration-200 cursor-pointer z-10 outline-none ${
          view === "form"
            ? "text-white"
            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        }`}
      >
        {view === "form" && (
          <motion.div
            layoutId="activeSidebarTab"
            className="absolute inset-0 bg-indigo-600 rounded-lg -z-10"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
        Constructor
      </button>

      <button
        type="button"
        onClick={() => setView("explore")}
        className={`relative flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-colors duration-200 cursor-pointer z-10 outline-none ${
          view === "explore"
            ? "text-white"
            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        }`}
      >
        {view === "explore" && (
          <motion.div
            layoutId="activeSidebarTab"
            className="absolute inset-0 bg-indigo-600 rounded-lg -z-10"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
        Explore
      </button>
    </div>
  );
}
