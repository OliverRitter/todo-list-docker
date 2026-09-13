"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useSession, authClient } from "@/lib/auth-client";
import { useSpatialStore } from "@/store/useSpatialStore";
import ThemeToggle from "@/components/ThemeToggle";
import TaskForm from "@/components/TaskForm";
import TaskFilters from "@/components/TaskFilters";
import TaskList from "@/components/TaskList";
import IdentityPortal from "@/components/IdentityPortal";
import { Button } from "@/components/ui/button";
import { LogOut, MapPin, PanelLeftClose, PanelLeftOpen } from "lucide-react";
const SpatialMap = dynamic(() => import("@/components/SpatialMap"), {
  ssr: false,
  loading: () => (
    <div
      className="h-full w-full bg-slate-100 dark:bg-slate-900 animate-pulse flex items-center justify-center text-xs font-mono text-slate-400"
    >
      Initializing map layers...
    </div>
  ),
});

export default function Home() {
  const { data: session, isPending } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarView, setSidebarView] = useState<"form" | "explore">("form");
  const todos = useSpatialStore((state) => state.todos);
  const filteredTodos = useSpatialStore((state) => state.filteredTodos);
  const filters = useSpatialStore((state) => state.filters);
  const initStore = useSpatialStore((state) => state.initStore);
  const filterKey = [
    filters.search,
    filters.timeframe,
    filters.sortBy,
    filters.distanceOrder,
    filters.maxDistanceKm ?? "",
    filters.page,
    filters.limit,
    filters.lat ?? "",
    filters.lng ?? "",
  ].join("|");
  const handleAuthSuccess = () => {
    window.location.reload();
  };

  useEffect(() => {
    if (session?.user) {
      initStore();
    }
  }, [session, initStore]);

  if (isPending) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-sm font-mono text-slate-400 animate-pulse">
          Verifying secure credentials...
          <div className="w-16 h-1 bg-indigo-500 mx-auto mt-2 rounded" />
        </div>
      </div>
    );
  }

  if (!session?.user) {
    const ComponentSafeMap = IdentityPortal;
    return <ComponentSafeMap onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-50">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg text-white">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-black bg-gradient-to-r from-indigo-500 to-emerald-400 bg-clip-text text-transparent tracking-wider">
              G2 SPATIAL CORE
            </h1>
            <p className="text-[10px] font-mono text-slate-400">
              Authenticated as:{" "}
              <span className="text-indigo-400 font-bold">
                {session.user.email}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button
            variant="outline"
            size="icon"
            onClick={async () => {
              await authClient.signOut();
              window.location.reload();
            }}
            className="rounded-xl border-slate-200 dark:border-slate-800 cursor-pointer text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            title="Terminate Core Session"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="relative flex min-h-0 flex-1">
        <aside
          className={`absolute inset-y-0 left-0 z-20 flex w-[min(90vw,380px)] min-h-0 flex-col gap-4 overflow-y-auto border-r border-slate-200 bg-slate-50 p-4 shadow-2xl transition-[transform,width] duration-300 ease-out dark:border-slate-800 dark:bg-slate-950 lg:relative lg:shrink-0 lg:overflow-hidden lg:p-5 lg:shadow-none ${
            isSidebarOpen
              ? "translate-x-0 lg:w-[380px]"
              : "-translate-x-full lg:w-0 lg:border-r-0 lg:p-0"
          }`}
        >
          <div className="flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setSidebarView("form")}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                sidebarView === "form"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Constructor
            </button>
            <button
              type="button"
              onClick={() => setSidebarView("explore")}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                sidebarView === "explore"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              Explore
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="absolute right-3 top-3 z-10 inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            title="Hide sidebar"
            aria-label="Hide sidebar"
          >
            <PanelLeftClose className="size-4" />
          </button>
          {sidebarView === "form" ? (
            <div className="shrink-0">
              <TaskForm />
            </div>
          ) : (
            <div className="min-h-0 space-y-4 overflow-y-auto">
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
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pt-3 pr-1">
              <TaskList />
            </div>
                </div>
              </div>
          )}
        </aside>

        {!isSidebarOpen && (
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="absolute left-4 top-4 z-20 inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white/95 text-slate-600 shadow-lg backdrop-blur transition-colors hover:bg-white dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-300 dark:hover:bg-slate-800"
            title="Show sidebar"
            aria-label="Show sidebar"
          >
            <PanelLeftOpen className="size-5" />
          </button>
        )}

        <div className="min-h-0 min-w-0 flex-1">
          <SpatialMap
            todos={todos}
            filteredTodos={filteredTodos}
            filterKey={filterKey}
            sidebarOpen={isSidebarOpen}
          />
        </div>
      </main>
    </div>
  );
}
