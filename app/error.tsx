"use client";
import { ErrorState } from "@/components/ui/kit";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="wrapper py-20">
      <ErrorState title="Something broke on this page" message={error.message || "An unexpected error happened."} onRetry={reset} />
    </main>
  );
}
