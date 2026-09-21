export const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  process.env.NEXT_PUBLIC_SOCKET_URL ??
  (typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:4000");
