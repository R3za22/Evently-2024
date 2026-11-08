"use client";
import React from "react";
import { ClerkProvider, SignIn, SignUp, useClerk, useUser } from "@clerk/nextjs";
import type { AuthState } from "./types";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <ClerkProvider>{children}</ClerkProvider>;
}

export function useAuthState(): AuthState {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  if (!isLoaded) return { status: "loading", user: null, signOut };
  if (!isSignedIn || !user) return { status: "signedOut", user: null, signOut: () => signOut({ redirectUrl: "/" }) };
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "You";
  return {
    status: "signedIn",
    user: { id: user.id, name, email: user.primaryEmailAddress?.emailAddress, initials: name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase() },
    signOut: () => signOut({ redirectUrl: "/" }),
  };
}

export function AuthPanel({ mode }: { mode: "sign-in" | "sign-up" }) {
  return mode === "sign-in" ? <SignIn path="/sign-in" routing="path" /> : <SignUp path="/sign-up" routing="path" />;
}
