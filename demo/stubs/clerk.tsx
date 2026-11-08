"use client";
// Demo replacement for @clerk/nextjs: the visitor is always a signed-in demo user. No network, no auth provider.
import React from "react";

export const ClerkProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const SignedIn = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const SignedOut = (_: { children?: React.ReactNode }) => null;
export const UserButton = (_: { afterSignOutUrl?: string }) => (
  <span
    title="Demo user"
    className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-500 text-sm font-semibold text-white"
  >
    D
  </span>
);
const Disabled = () => (
  <div className="rounded-xl bg-white p-8 text-center shadow-md">
    <p className="p-bold-20">Sign-in is disabled in this demo</p>
    <p className="p-regular-14 mt-2">You are already browsing as a demo user.</p>
  </div>
);
export const SignIn = (_: { path?: string }) => <Disabled />;
export const SignUp = (_: { path?: string }) => <Disabled />;
