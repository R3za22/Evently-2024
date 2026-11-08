"use client";
// Mock auth: a single demo user kept in the mock store. No network, no provider.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Ticket } from "lucide-react";
import { mockAuth } from "@/lib/api/mock";
import { DEMO_USER } from "@/lib/api/mock/fixtures";
import type { AuthState, AuthUser } from "./types";

const user: AuthUser = { id: DEMO_USER._id, name: `${DEMO_USER.firstName} ${DEMO_USER.lastName}`, email: DEMO_USER.email, initials: "DA" };
const Ctx = createContext<AuthState & { signIn: () => void }>({ status: "loading", user: null, signOut: () => {}, signIn: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthState["status"]>("loading");
  useEffect(() => {
    const sync = () => setStatus(mockAuth.isSignedIn() ? "signedIn" : "signedOut");
    sync();
    window.addEventListener("evently-auth", sync);
    return () => window.removeEventListener("evently-auth", sync);
  }, []);
  const signOut = useCallback(() => {
    mockAuth.signOut();
    window.dispatchEvent(new Event("evently-auth"));
  }, []);
  const signIn = useCallback(() => {
    mockAuth.signIn();
    window.dispatchEvent(new Event("evently-auth"));
  }, []);
  const value = useMemo(() => ({ status, user: status === "signedIn" ? user : null, signOut, signIn }), [status, signOut, signIn]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuthState = (): AuthState => useContext(Ctx);

/** Mock sign-in/sign-up panel: accepts any credentials, signs in the demo user. */
export function AuthPanel({ mode }: { mode: "sign-in" | "sign-up" }) {
  const { signIn } = useContext(Ctx);
  const router = useRouter();
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [invalid, setInvalid] = useState<"email" | "password" | null>(null);
  const isSignIn = mode === "sign-in";

  return (
    <div className="flex w-full max-w-4xl flex-col overflow-hidden rounded-card border border-line bg-white md:flex-row">
      {/* Ticket-style stub: indigo panel with a dashed perforation on desktop, stacked on mobile. */}
      <div className="flex flex-col justify-between gap-10 bg-indigo p-8 text-white md:w-[44%] md:p-12">
        <div className="flex items-center gap-2.5 font-display text-2xl font-extrabold">
          <Ticket className="h-7 w-7 text-marquee" aria-hidden="true" />
          Evently
        </div>
        <div className="flex flex-col gap-4">
          <p className="font-display text-4xl font-extrabold leading-none tracking-[-1.5px] md:text-[56px] md:tracking-[-2px]">
            {isSignIn ? "Your seat is waiting." : "Your night out starts here."}
          </p>
          <p className="max-w-[360px] text-base text-[#E9E7FC] md:text-lg">
            {isSignIn
              ? "Sign in to buy tickets, see your orders and host your own events."
              : "Create an account to buy tickets, track your orders and host your own events."}
          </p>
        </div>
        <span className="overline hidden text-[#E9E7FC] md:block">Admit one</span>
      </div>
      <div aria-hidden="true" className="perforation hidden w-0 md:block" />

      <div className="flex flex-1 items-center p-6 sm:p-8 md:p-12">
        <form
          noValidate
          className="flex w-full flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!/^\S+@\S+\.\S+$/.test(email)) {
              setInvalid("email");
              return setError("Enter a valid email address.");
            }
            if (password.length < 1) {
              setInvalid("password");
              return setError("Enter a password (any value works in this demo).");
            }
            signIn();
            const next = new URLSearchParams(window.location.search).get("next");
            router.push(next && next.startsWith("/") ? next : "/");
          }}
        >
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-3xl font-extrabold md:text-4xl">{isSignIn ? "Welcome back" : "Create your account"}</h1>
            <p className="text-slate">Demo sign-in: any password works. No data leaves your browser.</p>
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={invalid === "email" || undefined}
              aria-describedby={error ? "auth-error" : undefined}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete={isSignIn ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={invalid === "password" || undefined}
              aria-describedby={error ? "auth-error" : undefined}
            />
          </div>
          {error && (
            <p id="auth-error" role="alert" className="text-sm font-bold text-error">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary btn-lg w-full">
            {isSignIn ? "Sign in" : "Create account"}
          </button>
          <p className="text-center text-sm text-slate">
            {isSignIn ? (
              <>
                New here? <Link href="/sign-up" className="font-bold">Create an account</Link>
              </>
            ) : (
              <>
                Already have an account? <Link href="/sign-in" className="font-bold">Sign in</Link>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
