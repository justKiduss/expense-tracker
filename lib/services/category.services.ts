import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';

const DEFAULTS = ['Food', 'Transport', 'Airtime & Data', 'Bills', 'Shopping', 'Entertainment', 'Health', 'Education', 'Rent', 'Other'];

export async function listCategories(userId: string) {
  const load = () =>
    db.select().from(categories).where(eq(categories.userId, userId)).orderBy(asc(categories.name));

  let rows = await load();
  if (rows.length === 0) { // seed on first use, so existing accounts get them too
    await db.insert(categories).values(DEFAULTS.map((name) => ({ userId, name }))).onConflictDoNothing();
    rows = await load();
  }
  return rows;
}

export async function createCategory(userId: string, name: string) {
  const [row] = await db.insert(categories).values({ userId, name }).onConflictDoNothing().returning();
  return row ?? null; // null = that name already exists
}

export async function setCategoryBudget(userId: string, categoryId: string, amount: number | null) {
  const [row] = await db
    .update(categories)
    .set({ monthlyBudget: amount })
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId))) // ownership
    .returning();
  return row ?? null;
}