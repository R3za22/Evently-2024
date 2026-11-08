import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Evently — find your next night out", template: "%s · Evently" },
  description: "Discover concerts, workshops and meetups, or host your own and sell tickets in minutes.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#14122B" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
