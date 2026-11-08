"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CheckoutFlow from "@/components/shared/CheckoutFlow";
import { RequireAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/kit";

function CheckoutFromQuery() {
  const id = useSearchParams().get("id") ?? "";
  return <CheckoutFlow eventId={id} />;
}

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <Suspense
        fallback={
          <div className="wrapper py-10">
            <Skeleton className="h-10 w-48" />
          </div>
        }
      >
        <CheckoutFromQuery />
      </Suspense>
    </RequireAuth>
  );
}
