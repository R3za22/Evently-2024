import "server-only";
import { auth } from "@clerk/nextjs/server";
import { connectToDatabase } from "@/lib/database";
import User from "@/lib/database/models/user.model";

/** The caller's Clerk id from the verified session, or null. Never read identity from client input. */
export async function getClerkId(): Promise<string | null> {
  const { userId } = auth();
  return userId ?? null;
}

/** Mongo user id of the signed-in caller; throws when signed out or not yet synced by the Clerk webhook. */
export async function requireUserId(): Promise<string> {
  const clerkId = await getClerkId();
  if (!clerkId) throw new Error("Please sign in to continue.");
  await connectToDatabase();
  const user = await User.findOne({ clerkId }).select("_id");
  if (!user) throw new Error("Your account is still being set up. Try again in a moment.");
  return String(user._id);
}
