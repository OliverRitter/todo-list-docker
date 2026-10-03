"use client";
import dynamic from "next/dynamic";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useSession, authClient } from "@/lib/auth-client";
import { useSpatialStore } from "@/store/useSpatialStore";
import ThemeToggle from "@/components/ThemeToggle";
// import TaskForm from "@/components/TaskForm";
// import TaskFilters from "@/components/TaskFilters";
// import TaskList from "@/components/TaskList";
import IdentityPortal from "@/components/IdentityPortal";
import { Button } from "@/components/ui/button";
import { LogOut, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import SidebarHeader from "@/components/SidebarHeader";
import SidebarContent from "@/components/SidebarContent";

const subscribeToDesktopBreakpoint = (callback: () => void) => {
  const mediaQuery = window.matchMedia("(min-width: 1024px)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
};

const getDesktopBreakpoint = () =>
  window.matchMedia("(min-width: 1024px)").matches;

const SpatialMap = dynamic(() => import("@/components/SpatialMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-100 dark:bg-slate-900 animate-pulse flex items-center justify-center text-xs font-mono text-slate-400">
      Initializing map layers...
    </div>
  ),
});

export default function Home() {
  const { data: session, isPending } = useSession();
  const isDesktop = useSyncExternalStore(
    subscribeToDesktopBreakpoint,
    getDesktopBreakpoint,
    () => false,
  );
  const [sidebarOpenOverride, setSidebarOpenOverride] = useState<boolean | null>(
    null,
  );
  const isSidebarOpen = sidebarOpenOverride ?? isDesktop;
  const [sidebarView, setSidebarView] = useState<"form" | "explore">("form");
  const todos = useSpatialStore((state) => state.todos);
  const filteredTodos = useSpatialStore((state) => state.filteredTodos);
  const pagination = useSpatialStore((state) => state.pagination);
  const mapBounds = useSpatialStore((state) => state.mapBounds);
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
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-50">
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-3 dark:border-slate-800 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <motion.button
            type="button"
            onClick={() => setSidebarOpenOverride(!isSidebarOpen)}
            className="relative inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 sm:size-10"
            animate={{ rotate: isSidebarOpen ? 90 : 0 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 360, damping: 22 }}
            aria-label={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
            aria-expanded={isSidebarOpen}
            aria-controls="task-sidebar"
            title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
          >
            <motion.span
              className="absolute h-0.5 w-[18px] rounded-full bg-current"
              animate={{ y: isSidebarOpen ? 0 : -6, rotate: isSidebarOpen ? 45 : 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 24 }}
            />
            <motion.span
              className="absolute h-0.5 w-[18px] rounded-full bg-current"
              animate={{ opacity: isSidebarOpen ? 0 : 1, scaleX: isSidebarOpen ? 0.4 : 1 }}
              transition={{ duration: 0.16 }}
            />
            <motion.span
              className="absolute h-0.5 w-[18px] rounded-full bg-current"
              animate={{ y: isSidebarOpen ? 0 : 6, rotate: isSidebarOpen ? -45 : 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 24 }}
            />
          </motion.button>
          <div className="shrink-0 rounded-xl bg-indigo-600 p-2 text-white shadow-lg sm:p-2.5">
            <MapPin className="size-4 sm:size-5" />
          </div>
          <div className="min-w-0">
            <h1 className="block truncate text-sm font-black spatial-gradient bg-clip-text text-transparent tracking-wider animate-smooth-gradient sm:text-xl">
              G2 SPATIAL CORE
            </h1>
            <p className="hidden truncate text-[10px] font-mono text-slate-400 sm:block">
              Authenticated as:{" "}
              <span className="text-indigo-400 font-bold">
                {session.user.email}
              </span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
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

      <main className="relative flex h-[calc(100dvh-4rem)] min-h-0">
        <motion.aside
          id="task-sidebar"
          className="absolute inset-y-0 left-0 z-20 flex min-h-0 flex-col overflow-hidden border-r border-slate-200 bg-slate-50 shadow-2xl dark:border-slate-800 dark:bg-slate-950 lg:relative lg:shrink-0 lg:shadow-none"
          animate={{
            width: isDesktop
              ? isSidebarOpen
                ? 380
                : 0
              : "min(90vw, 380px)",
            x: isDesktop || isSidebarOpen ? 0 : "-100%",
            borderRightWidth: isDesktop && !isSidebarOpen ? 0 : 1,
          }}
          transition={{ type: "spring", stiffness: 260, damping: 32 }}
          aria-hidden={!isSidebarOpen}
        >
          <div className="thin-scrollbar flex h-full w-[min(90vw,380px)] shrink-0 flex-col gap-4 overflow-y-auto p-4 lg:w-[380px] lg:p-5">
            <SidebarHeader view={sidebarView} setView={setSidebarView} />
            <SidebarContent view={sidebarView} />
          </div>
        </motion.aside>

        <div className="h-full min-h-0 min-w-0 flex-1">
          <SpatialMap
            todos={todos}
            filteredTodos={filteredTodos}
            taskCount={pagination.total}
            mapBounds={mapBounds}
            filterKey={filterKey}
            sidebarOpen={isSidebarOpen}
          />
        </div>
      </main>
    </div>
  );
}
