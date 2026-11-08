import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtected = createRouteMatcher(["/events/create(.*)", "/events/edit(.*)", "/tickets(.*)", "/orders(.*)", "/checkout(.*)"]);
const isMock = process.env.NEXT_PUBLIC_API_MODE === "mock";

// In mock mode (no Clerk keys) the client-side guard handles protection instead.
export default isMock
  ? () => NextResponse.next()
  : clerkMiddleware((auth, req) => {
      if (isProtected(req)) auth().protect();
    });

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};
