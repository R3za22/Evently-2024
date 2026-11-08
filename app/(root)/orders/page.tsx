import { Suspense } from "react";
import type { Metadata } from "next";
import OrdersView from "@/components/shared/OrdersView";
import { Skeleton } from "@/components/ui/kit";
import { RequireAuth } from "@/lib/auth";

export const metadata: Metadata = { title: "Event orders" };

export default function OrdersPage() {
  return (
    <RequireAuth>
      <Suspense
        fallback={
          <div className="wrapper py-10">
            <Skeleton className="h-14 w-2/3" />
          </div>
        }
      >
        <OrdersView />
      </Suspense>
    </RequireAuth>
  );
}
