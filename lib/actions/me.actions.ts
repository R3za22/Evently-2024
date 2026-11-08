"use server"

import { connectToDatabase } from "../database"
import User from "../database/models/user.model"
import { getClerkId } from "../server/session"

/** The signed-in user's profile (Mongo ids), derived from the Clerk session. */
export async function getMe() {
  const clerkId = await getClerkId()
  if (!clerkId) return null
  await connectToDatabase()
  const u = await User.findOne({ clerkId })
  return u ? JSON.parse(JSON.stringify({ _id: u._id, firstName: u.firstName, lastName: u.lastName, email: u.email, username: u.username, photo: u.photo })) : null
}
