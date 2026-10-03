"use client";

import { motion, AnimatePresence } from "framer-motion";
import TaskForm from "@/components/TaskForm";
import TaskFilters from "@/components/TaskFilters";
import TaskList from "@/components/TaskList";

interface SidebarContentProps {
  view: "form" | "explore";
}

const viewVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
};

export default function SidebarContent({ view }: SidebarContentProps) {
  return (
    <div className="flex-1 min-h-0 relative flex flex-col">
      <AnimatePresence mode="wait">
        {view === "form" ? (
          <motion.div
            key="form-view"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="shrink-0 w-full"
          >
            <TaskForm />
          </motion.div>
        ) : (
          <motion.div
            key="explore-view"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="thin-scrollbar min-h-0 space-y-4 overflow-y-auto flex-1 flex flex-col"
          >
            <TaskFilters />
            <div className="flex h-64 min-h-0 max-h-64 shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex shrink-0 items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">
                  Filtered Tasks
                </h3>
                <span className="text-[10px] font-mono text-slate-400">
                  Live results
                </span>
              </div>
              <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain pt-3 pr-1">
                <TaskList />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
