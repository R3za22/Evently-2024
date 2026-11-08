"use client";
import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

// Constant-folded at build time: the Clerk adapter is not bundled in mock/demo builds.
const impl: typeof import("./mock") = process.env.NEXT_PUBLIC_API_MODE === "mock" ? require("./mock") : (require("./clerk") as any);

export const AuthProvider = impl.AuthProvider;
export const useAuthState = impl.useAuthState;
export const AuthPanel = impl.AuthPanel;
export type { AuthState, AuthUser } from "./types";

export function SignedIn({ children }: { children: React.ReactNode }) {
  return useAuthState().status === "signedIn" ? <>{children}</> : null;
}
export function SignedOut({ children }: { children: React.ReactNode }) {
  return useAuthState().status === "signedOut" ? <>{children}</> : null;
}

/** Client-side guard (server-side protection is clerkMiddleware in live mode). */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuthState();
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (status === "signedOut") {
      const here = typeof window !== "undefined" ? window.location.pathname.replace(/^\/demos\/evently/, "") + window.location.search : pathname;
      router.replace(`/sign-in?next=${encodeURIComponent(here || "/")}`);
    }
  }, [status, router, pathname]);
  if (status !== "signedIn") return <div className="wrapper py-16" aria-busy="true"><div className="skeleton h-8 w-64" /></div>;
  return <>{children}</>;
}
