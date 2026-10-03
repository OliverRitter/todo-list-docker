"use client";

import { LayoutGroup, motion } from "framer-motion";

interface SidebarHeaderProps {
  view: "form" | "explore";
  setView: (view: "form" | "explore") => void;
}

export default function SidebarHeader({ view, setView }: SidebarHeaderProps) {
  return (
    <LayoutGroup id="sidebar-tabs">
      <div className="flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-slate-100/80 p-1 dark:border-slate-800 dark:bg-slate-900/80">
        <button
          type="button"
          onClick={() => setView("form")}
          aria-pressed={view === "form"}
          className={`relative isolate flex-1 cursor-pointer rounded-lg px-3 py-2.5 text-xs font-bold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
            view === "form"
              ? "text-white"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          {view === "form" && (
            <motion.span
              layoutId="activeSidebarTab"
              className="absolute inset-0 -z-10 rounded-lg bg-indigo-600 shadow-sm shadow-indigo-950/20"
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
            />
          )}
          <span className="relative">Constructor</span>
        </button>

        <button
          type="button"
          onClick={() => setView("explore")}
          aria-pressed={view === "explore"}
          className={`relative isolate flex-1 cursor-pointer rounded-lg px-3 py-2.5 text-xs font-bold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
            view === "explore"
              ? "text-white"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          {view === "explore" && (
            <motion.span
              layoutId="activeSidebarTab"
              className="absolute inset-0 -z-10 rounded-lg bg-indigo-600 shadow-sm shadow-indigo-950/20"
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
            />
          )}
          <span className="relative">Explorer</span>
        </button>
      </div>
    </LayoutGroup>
  );
}
