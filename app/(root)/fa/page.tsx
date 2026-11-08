import type { Metadata } from "next";
import HomeFA from "@/components/shared/HomeFA";

// Absolute title: the root layout template ("%s · Evently") would otherwise be appended.
export const metadata: Metadata = { title: { absolute: "رویدادلی" } };

export default function Page() {
  return <HomeFA />;
}
