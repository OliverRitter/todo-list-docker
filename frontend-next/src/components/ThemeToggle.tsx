"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    const localTheme = localStorage.getItem("theme");
    if (localTheme) {
      setIsDark(localTheme === "dark");
    } else {
      const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      setIsDark(systemPrefersDark);
    }
  }, []);

  useEffect(() => {
    if (isDark === null) return;
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  if (isDark === null)
    return (
      <div className="w-10 h-10 animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl" />
    );

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setIsDark(!isDark)}
      className="rounded-xl cursor-pointer"
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-amber-400" />
      ) : (
        <Moon className="h-5 w-5 text-indigo-600" />
      )}
    </Button>
  );
}
