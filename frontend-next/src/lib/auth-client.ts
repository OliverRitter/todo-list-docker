import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:8080"),
  fetchOptions: {
    credentials: "include",
  },
});

export const { useSession } = authClient;
