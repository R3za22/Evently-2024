import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return <SignIn path='/sign-in' />;
}

// Needed for the static demo export (optional catch-all with no extra segments).
export function generateStaticParams() {
  return [{ "sign-in": [] }];
}
