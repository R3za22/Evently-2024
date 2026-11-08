import "server-only";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/database";
import User from "@/lib/database/models/user.model";
import Order from "@/lib/database/models/order.model";
import Event from "@/lib/database/models/event.model";
import type { CreateUserParams, UpdateUserParams } from "@/types";

// Internal helpers used only by the signed Clerk webhook. NOT server actions (those are callable by any client).
export async function createUser(user: CreateUserParams) {
  await connectToDatabase();
  return JSON.parse(JSON.stringify(await User.create(user)));
}

export async function updateUser(clerkId: string, user: UpdateUserParams) {
  await connectToDatabase();
  const updated = await User.findOneAndUpdate({ clerkId }, user, { new: true });
  if (!updated) throw new Error("User update failed");
  return JSON.parse(JSON.stringify(updated));
}

export async function deleteUser(clerkId: string) {
  await connectToDatabase();
  const u = await User.findOne({ clerkId });
  if (!u) throw new Error("User not found");
  await Promise.all([Event.updateMany({ organizer: u._id }, { $unset: { organizer: 1 } }), Order.updateMany({ buyer: u._id }, { $unset: { buyer: 1 } })]);
  const deleted = await User.findByIdAndDelete(u._id);
  revalidatePath("/");
  return deleted ? JSON.parse(JSON.stringify(deleted)) : null;
}
