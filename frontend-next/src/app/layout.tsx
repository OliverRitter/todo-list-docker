import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "G2 Spatial Core Workspace",
  description: "Real-time PostGIS mapping engine cluster",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
