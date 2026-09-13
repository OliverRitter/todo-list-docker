"use client";

import { useSpatialStore } from "@/store/useSpatialStore";

export default function TaskList() {
  const todos = useSpatialStore((state) => state.filteredTodos);

  return (
    <section className="space-y-2">
      {todos.map((todo) => (
        <article
          key={todo.id}
          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-xs font-bold truncate text-slate-800 dark:text-slate-100">
                {todo.title}
              </h4>
              <p className="text-[10px] font-mono text-slate-400">
                {todo.category} · {todo.city || "Unmapped"}
              </p>
            </div>
            {todo.distanceKm !== null && todo.distanceKm !== undefined && (
              <span className="shrink-0 text-[10px] font-mono font-bold text-emerald-600">
                {Number(todo.distanceKm).toFixed(2)} km
              </span>
            )}
          </div>
        </article>
      ))}
      {todos.length === 0 && (
        <p className="p-4 text-center text-xs font-mono text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
          No tasks match these filters.
        </p>
      )}
    </section>
  );
}
