import type { Metadata } from "next";
import TicketsView from "@/components/shared/TicketsView";
import { RequireAuth } from "@/lib/auth";

export const metadata: Metadata = { title: "My tickets" };

export default function TicketsPage() {
  return (
    <RequireAuth>
      <TicketsView />
    </RequireAuth>
  );
}
