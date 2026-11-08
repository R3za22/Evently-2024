"use client";

import EventForm from "@/components/shared/EventForm";
import { RequireAuth } from "@/lib/auth";

export default function CreateEventPage() {
  return (
    <RequireAuth>
      <EventForm mode="create" />
    </RequireAuth>
  );
}
