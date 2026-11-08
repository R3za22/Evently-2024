import { Suspense } from "react";
import { AuthPanel } from "@/lib/auth";

export const metadata = { title: "Sign in" };

export default function Page() {
  return (
    <Suspense>
      <AuthPanel mode="sign-in" />
    </Suspense>
  );
}

// Needed for the static demo export (optional catch-all with no extra segments).
export function generateStaticParams() {
  return [{ "sign-in": [] }];
}
