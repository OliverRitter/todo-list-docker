"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { UserPlus, AlertCircle } from "lucide-react";
import { authClient } from "@/lib/auth-client";

const signUpSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters long"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

type AuthUser = {
  id?: string;
  email?: string;
  name?: string | null;
};

interface SignUpFormProps {
  onAuthSuccess: (user: AuthUser) => void;
}

export default function SignUpForm({ onAuthSuccess }: SignUpFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (values: SignUpFormData) => {
    await authClient.signUp.email(
      {
        email: values.email,
        password: values.password,
        name: values.name,
      },
      {
        onSuccess: (ctx) => {
          if (ctx?.data?.user) onAuthSuccess(ctx.data.user);
        },
        onError: (ctx) => {
          const isExpectedRejection = ctx.error?.code === "USER_ALREADY_EXISTS";

          if (!isExpectedRejection) {
            console.error("Better-Auth registration trace:", ctx.error);
          }

          if (isExpectedRejection) {
            setError("email", {
              type: "server",
              message:
                ctx.error?.message ||
                "This email address is already provisioned.",
            });
          } else {
            setError("root", {
              type: "server",
              message:
                ctx.error?.message ||
                "An unexpected registration error occurred.",
            });
          }
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      {errors.root && (
        <div className="p-4 rounded-xl flex items-start gap-3 text-xs border bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold uppercase tracking-wider mb-0.5">
              Gateway Rejection
            </p>
            <p className="font-mono">{errors.root.message}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-400 block mb-1 uppercase">
            Full Name
          </label>
          <input
            {...register("name")}
            type="text"
            placeholder="Dev"
            className="w-full text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          {errors.name && (
            <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 block mb-1 uppercase">
            Email Address
          </label>
          <input
            {...register("email")}
            type="email"
            placeholder="oliver@myhome.local"
            className="w-full text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          {errors.email && (
            <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>
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
            className="w-full text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
          <UserPlus className="h-4 w-4" />
          {isSubmitting ? "Provisioning..." : "Provision Account"}
        </Button>
      </form>
    </div>
  );
}
