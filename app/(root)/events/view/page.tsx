import { Suspense } from "react";
import EventDetail from "@/components/shared/EventDetail";

export const metadata = { title: "Event details" };

export default function EventViewPage() {
  return (
    <Suspense fallback={null}>
      <EventDetail />
    </Suspense>
  );
}
