"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import EventForm from "@/components/shared/EventForm";
import { RequireAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/kit";

function EditEventFromQuery() {
  const id = useSearchParams().get("id") ?? "";
  return <EventForm mode="edit" eventId={id} />;
}

export default function EditEventPage() {
  return (
    <RequireAuth>
      <Suspense
        fallback={
          <div className="wrapper py-10">
            <Skeleton className="h-14 w-2/3" />
          </div>
        }
      >
        <EditEventFromQuery />
      </Suspense>
    </RequireAuth>
  );
}
