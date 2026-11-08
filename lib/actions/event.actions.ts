'use server'

import { revalidatePath } from 'next/cache'

import { connectToDatabase } from '@/lib/database'
import Event from '@/lib/database/models/event.model'
import User from '@/lib/database/models/user.model'
import Category from '@/lib/database/models/category.model'
import { requireUserId } from '@/lib/server/session'
import { escapeRegex, idSchema, parseEvent, searchSchema, EventInput } from '@/lib/validation'
import { handleError } from '@/lib/utils'

const getCategoryByName = async (name: string) => {
  // exact, case-insensitive, regex-escaped: user input is never interpreted as a pattern
  return Category.findOne({ name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' } })
}

const populateEvent = (query: any) =>
  query
    .populate({ path: 'organizer', model: User, select: '_id firstName lastName' })
    .populate({ path: 'category', model: Category, select: '_id name' })

const paged = (data: unknown, total: number, limit: number) => ({
  data: JSON.parse(JSON.stringify(data)),
  total,
  totalPages: Math.ceil(total / limit),
})

// CREATE: organiser is the signed-in user, never a client-supplied id
export async function createEvent({ event, path }: { event: EventInput; path?: string }) {
  try {
    const userId = await requireUserId()
    const data = parseEvent(event)
    await connectToDatabase()
    const category = await Category.findById(data.categoryId)
    if (!category) throw new Error('Category not found')
    const created = await Event.create({ ...data, category: data.categoryId, organizer: userId })
    if (path) revalidatePath(path)
    return JSON.parse(JSON.stringify(await populateEvent(Event.findById(created._id))))
  } catch (error) {
    handleError(error)
  }
}

export async function getEventById(eventId: string) {
  try {
    idSchema.parse(eventId)
    await connectToDatabase()
    const event = await populateEvent(Event.findById(eventId))
    return event ? JSON.parse(JSON.stringify(event)) : null
  } catch (error) {
    handleError(error)
  }
}

// UPDATE: only the organiser (from the session) may edit
export async function updateEvent({ eventId, event, path }: { eventId: string; event: EventInput; path?: string }) {
  try {
    const userId = await requireUserId()
    idSchema.parse(eventId)
    const data = parseEvent(event)
    await connectToDatabase()
    const existing = await Event.findById(eventId)
    if (!existing || String(existing.organizer) !== userId) throw new Error('Unauthorized or event not found')
    const updated = await Event.findByIdAndUpdate(eventId, { ...data, category: data.categoryId }, { new: true })
    if (path) revalidatePath(path)
    return JSON.parse(JSON.stringify(await populateEvent(Event.findById(updated._id))))
  } catch (error) {
    handleError(error)
  }
}

// DELETE: only the organiser may delete
export async function deleteEvent({ eventId, path }: { eventId: string; path?: string }) {
  try {
    const userId = await requireUserId()
    idSchema.parse(eventId)
    await connectToDatabase()
    const existing = await Event.findById(eventId)
    if (!existing || String(existing.organizer) !== userId) throw new Error('Unauthorized or event not found')
    await Event.findByIdAndDelete(eventId)
    if (path) revalidatePath(path)
  } catch (error) {
    handleError(error)
  }
}

export async function getAllEvents(params: { query?: string; category?: string; limit?: number; page?: number }) {
  try {
    const { query, category, page, limit } = searchSchema.parse(params)
    await connectToDatabase()

    const titleCondition = query ? { title: { $regex: escapeRegex(query), $options: 'i' } } : {}
    const cat = category ? await getCategoryByName(category) : null
    if (category && !cat) return { data: [], total: 0, totalPages: 0 }
    const conditions = { $and: [titleCondition, cat ? { category: cat._id } : {}] }

    const events = await populateEvent(
      Event.find(conditions).sort({ createdAt: 'desc' }).skip((page - 1) * limit).limit(limit)
    )
    const total = await Event.countDocuments(conditions)
    return paged(events, total, limit)
  } catch (error) {
    handleError(error)
  }
}

// MY EVENTS: organiser is the signed-in user
export async function getEventsByUser({ limit = 6, page = 1 }: { limit?: number; page?: number } = {}) {
  try {
    const userId = await requireUserId()
    await connectToDatabase()
    const conditions = { organizer: userId }
    const events = await populateEvent(
      Event.find(conditions).sort({ createdAt: 'desc' }).skip((page - 1) * limit).limit(limit)
    )
    return paged(events, await Event.countDocuments(conditions), limit)
  } catch (error) {
    handleError(error)
  }
}

export async function getRelatedEventsByCategory({
  categoryId,
  eventId,
  limit = 3,
  page = 1,
}: {
  categoryId: string
  eventId: string
  limit?: number
  page?: number
}) {
  try {
    idSchema.parse(categoryId)
    idSchema.parse(eventId)
    await connectToDatabase()
    const conditions = { $and: [{ category: categoryId }, { _id: { $ne: eventId } }] }
    const events = await populateEvent(
      Event.find(conditions).sort({ createdAt: 'desc' }).skip((Number(page) - 1) * limit).limit(limit)
    )
    return paged(events, await Event.countDocuments(conditions), limit)
  } catch (error) {
    handleError(error)
  }
}
