"use client";

import { useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";

type AuthUser = {
  id?: string;
  email?: string;
  name?: string | null;
};

interface IdentityPortalProps {
  onAuthSuccess: (user: AuthUser) => void;
}

export default function IdentityPortal({ onAuthSuccess }: IdentityPortalProps) {
  const [isSignUpMode, setIsSignUpMode] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 space-y-6">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black spatial-gradient bg-clip-text text-transparent uppercase tracking-wider animate-smooth-gradient">
            G2 IDENTITY GATEWAY
          </h1>
          <p className="text-xs font-mono text-slate-400">
            {isSignUpMode
              ? "Provision a secure development account"
              : "Authenticate active core credentials"}
          </p>
        </div>

        {/* Dynamic sub-form injection block */}
        {isSignUpMode ? (
          <SignUpForm onAuthSuccess={onAuthSuccess} />
        ) : (
          <SignInForm onAuthSuccess={onAuthSuccess} />
        )}

        <div className="text-center pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setIsSignUpMode((prev) => !prev)}
            className="text-xs text-indigo-500 hover:text-indigo-400 font-medium cursor-pointer transition-colors duration-200"
          >
            {isSignUpMode
              ? "Already have secure credentials? Sign In here"
              : "Need a localized test profile? Provision an account here"}
          </button>
        </div>
      </div>
    </div>
  );
}
