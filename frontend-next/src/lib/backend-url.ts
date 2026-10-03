export const backendUrl =
  (typeof window !== "undefined" ? window.location.origin : undefined) ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  process.env.NEXT_PUBLIC_SOCKET_URL ??
  "http://localhost:8080";
