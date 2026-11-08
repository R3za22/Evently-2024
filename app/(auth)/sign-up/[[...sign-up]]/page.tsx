import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return <SignUp path='/sign-up' />;
}

// Needed for the static demo export (optional catch-all with no extra segments).
export function generateStaticParams() {
  return [{ "sign-up": [] }];
}
