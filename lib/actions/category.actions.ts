"use server"

import { connectToDatabase } from "../database"
import Category from "../database/models/category.model"
import { requireUserId } from "../server/session"
import { handleError } from "../utils"
import { escapeRegex } from "../validation"

export const createCategory = async ({ categoryName }: { categoryName: string }) => {
  try {
    await requireUserId()
    const name = String(categoryName ?? "").trim()
    if (name.length < 2 || name.length > 40) throw new Error("Category name must be 2-40 characters.")
    await connectToDatabase()
    const existing = await Category.findOne({ name: { $regex: `^${escapeRegex(name)}$`, $options: "i" } })
    const category = existing ?? (await Category.create({ name }))
    return JSON.parse(JSON.stringify(category))
  } catch (error) {
    handleError(error)
  }
}

export const getAllCategories = async () => {
  try {
    await connectToDatabase()
    return JSON.parse(JSON.stringify(await Category.find().sort({ name: 1 })))
  } catch (error) {
    handleError(error)
  }
}
