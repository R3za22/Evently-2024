"use server"

import Stripe from "stripe"
import { Types } from "mongoose"
import { connectToDatabase } from "../database"
import Order from "../database/models/order.model"
import Event from "../database/models/event.model"
import User from "../database/models/user.model"
import { recordOrder } from "../server/orders"
import { requireUserId } from "../server/session"
import { handleError } from "../utils"
import { escapeRegex, idSchema } from "../validation"

/**
 * Start a purchase. The buyer comes from the session and the price from the database;
 * the client only says WHICH event. Returns a Stripe Checkout URL, or a ticket for free events.
 */
export const checkoutOrder = async ({ eventId }: { eventId: string }) => {
  try {
    const buyerId = await requireUserId()
    idSchema.parse(eventId)
    await connectToDatabase()
    const event = await Event.findById(eventId)
    if (!event) throw new Error("Event not found")
    if (String(event.organizer) === buyerId) throw new Error("You can't buy a ticket to your own event.")
    if (await Order.exists({ event: eventId, buyer: buyerId })) throw new Error("You already have a ticket for this event.")

    const amount = event.isFree ? 0 : Math.round(Number(event.price) * 100)
    if (amount === 0) {
      const order = await recordOrder({ stripeId: `free_${eventId}_${buyerId}`, eventId, buyerId, totalAmount: "0" })
      return { status: "paid" as const, order }
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    const base = process.env.NEXT_PUBLIC_SERVER_URL
    const session = await stripe.checkout.sessions.create({
      line_items: [{ price_data: { currency: "usd", unit_amount: amount, product_data: { name: event.title } }, quantity: 1 }],
      metadata: { eventId: String(event._id), buyerId },
      mode: "payment",
      success_url: `${base}/tickets`,
      cancel_url: `${base}/events/view?id=${eventId}`,
    })
    return { status: "redirect" as const, url: session.url! }
  } catch (error) {
    handleError(error)
  }
}

// Organiser-only: orders for one of the caller's events
export async function getOrdersByEvent({ searchString = "", eventId }: { searchString?: string; eventId: string }) {
  try {
    const userId = await requireUserId()
    idSchema.parse(eventId)
    await connectToDatabase()
    const event = await Event.findById(eventId)
    if (!event || String(event.organizer) !== userId) throw new Error("Only the organiser can see these orders.")

    const orders = await Order.aggregate([
      { $match: { event: new Types.ObjectId(eventId) } },
      { $lookup: { from: "users", localField: "buyer", foreignField: "_id", as: "buyer" } },
      { $unwind: "$buyer" },
      {
        $project: {
          _id: 1,
          totalAmount: 1,
          createdAt: 1,
          eventId: { $toString: "$event" },
          buyer: { $concat: ["$buyer.firstName", " ", "$buyer.lastName"] },
        },
      },
      { $match: { buyer: { $regex: escapeRegex(searchString.trim().slice(0, 100)), $options: "i" } } },
      { $sort: { createdAt: -1 } },
    ])
    return JSON.parse(JSON.stringify(orders.map((o) => ({ ...o, eventTitle: event.title }))))
  } catch (error) {
    handleError(error)
  }
}

// The signed-in user's tickets
export async function getOrdersByUser({ limit = 6, page = 1 }: { limit?: number; page?: number } = {}) {
  try {
    const userId = await requireUserId()
    await connectToDatabase()
    const conditions = { buyer: userId }
    const orders = await Order.find(conditions)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * limit)
      .limit(limit)
      .populate({
        path: "event",
        model: Event,
        populate: [
          { path: "organizer", model: User, select: "_id firstName lastName" },
          { path: "category", model: "Category", select: "_id name" },
        ],
      })
      .populate({ path: "buyer", model: User, select: "_id firstName lastName" })
    const total = await Order.countDocuments(conditions)
    return { data: JSON.parse(JSON.stringify(orders)), total, totalPages: Math.ceil(total / limit) }
  } catch (error) {
    handleError(error)
  }
}
