import { Suspense } from "react";
import { AuthPanel } from "@/lib/auth";

export const metadata = { title: "Create account" };

export default function Page() {
  return (
    <Suspense>
      <AuthPanel mode="sign-up" />
    </Suspense>
  );
}

export function generateStaticParams() {
  return [{ "sign-up": [] }];
}
