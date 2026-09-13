"use client";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useSession, authClient } from "@/lib/auth-client";
import { useSpatialStore } from "@/store/useSpatialStore";
import ThemeToggle from "@/components/ThemeToggle";
import TaskForm from "@/components/TaskForm";
import IdentityPortal from "@/components/IdentityPortal";
import { Button } from "@/components/ui/button";
import { LogOut, MapPin } from "lucide-react";
const SpatialMap = dynamic(() => import("@/components/SpatialMap"), {
  ssr: false,
  loading: () => (
    <div
      className="w-full rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse flex items-center justify-center text-xs font-mono text-slate-400"
      style={{ height: "400px" }}
    >
      Initializing map layers...
    </div>
  ),
});

export default function Home() {
  const { data: session, isPending } = useSession();
  const todos = useSpatialStore((state) => state.todos);
  const initStore = useSpatialStore((state) => state.initStore);
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300">
      <header className="max-w-7xl mx-auto flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
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

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 p-6">
        <div className="space-y-6 lg:col-span-1">
          <TaskForm />
        </div>

        <div className="lg:col-span-2">
          <SpatialMap todos={todos} />
        </div>
      </main>
    </div>
  );
}
