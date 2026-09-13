"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { UserPlus, LogIn, AlertCircle } from "lucide-react";
import { authClient } from "@/lib/auth-client";

const authSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

type AuthFormData = z.infer<typeof authSchema>;

interface IdentityPortalProps {
  onAuthSuccess: (user: any) => void;
}

export default function IdentityPortal({ onAuthSuccess }: IdentityPortalProps) {
  const [isSignUpMode, setIsSignUpMode] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const handleModeToggle = () => {
    setIsSignUpMode((prev) => !prev);
    setServerError(null);
    reset();
  };

  const onSubmit = async (values: AuthFormData) => {
    setServerError(null);

    if (isSignUpMode) {
      if (!values.name || values.name.trim().length < 2) {
        setServerError(
          "Full name must be at least 2 characters long during registration.",
        );
        return;
      }

      await authClient.signUp.email(
        {
          email: values.email,
          password: values.password,
          name: values.name,
        },
        {
          onRequest: () => setServerError(null),
          onSuccess: (ctx: any) => {
            if (ctx?.data?.user) onAuthSuccess(ctx.data.user);
          },
          onError: (ctx: any) => {
            console.error("Better-Auth registration trace:", ctx.error);
            setServerError(
              ctx.error?.message ||
                "An unexpected registration error occurred.",
            );
          },
        },
      );
    } else {
      await authClient.signIn.email(
        {
          email: values.email,
          password: values.password,
        },
        {
          onRequest: () => setServerError(null),
          onSuccess: (ctx: any) => {
            if (ctx?.data?.user) onAuthSuccess(ctx.data.user);
          },
          onError: (ctx: any) => {
            console.error("Better-Auth sign-in trace:", ctx.error);
            setServerError(
              ctx.error?.message ||
                "Invalid email address or secure password verification.",
            );
          },
        },
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-500 to-emerald-400 bg-clip-text text-transparent uppercase tracking-wider">
            G2 IDENTITY GATEWAY
          </h1>
          <p className="text-xs font-mono text-slate-400">
            {isSignUpMode
              ? "Provision a secure development account"
              : "Authenticate active core credentials"}
          </p>
        </div>

        {serverError && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-start gap-3 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold uppercase tracking-wider mb-0.5">
                Gateway Rejection
              </p>
              <p className="font-mono">{serverError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {isSignUpMode && (
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1 uppercase">
                Full Name
              </label>
              <input
                {...register("name")}
                type="text"
                placeholder="Oliver Dev"
                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1 uppercase">
              Email Address
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="oliver@myhome.local"
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none"
            />
            {errors.email && (
              <p className="text-xs text-rose-500 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 block mb-1 uppercase">
              Password
            </label>
            <input
              {...register("password")}
              type="password"
              placeholder="••••••••"
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none"
            />
            {errors.password && (
              <p className="text-xs text-rose-500 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-6 rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSignUpMode ? (
              <>
                <UserPlus className="h-4 w-4" />
                {isSubmitting ? "Provisioning..." : "Provision Account"}
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                {isSubmitting ? "Authenticating..." : "Establish Core Session"}
              </>
            )}
          </Button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleModeToggle}
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
