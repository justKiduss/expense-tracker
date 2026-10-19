import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { categories, categoryRules, transations } from '@/lib/db/schema';

export type Remember = 'none' | 'counterparty' | 'amount';

// Rules every user starts with (only used when the user has a category of that name). Description rules match
// "contains", ignoring case. They never override a category the user has chosen: rules only fill empty ones.
const DEFAULT_DESCRIPTION_RULES: { contains: string; category: string }[] = [
  { contains: 'package', category: 'Airtime & Data' },
  { contains: 'airtime', category: 'Airtime & Data' },
  { contains: 'service fee', category: 'Bills' },
  { contains: 'bill payment', category: 'Bills' },
  { contains: 'education payment', category: 'Education' },
];

/** The rule that "remember" stands for on this transaction, or null if it cannot be made. */
export function ruleFor(tx: { counterparty: string | null; amount: number; direction: string }, remember: Remember) {
  if (remember === 'counterparty') {
    const name = tx.counterparty?.trim().toLowerCase();
    return name ? { matchType: 'counterparty', matchValue: name } : null;
  }
  if (remember === 'amount') {
    // amount rules are for outgoing money only ("every payment of 100.00")
    return tx.direction === 'out' ? { matchType: 'amount', matchValue: String(tx.amount) } : null;
  }
  return null;
}

async function ensureDefaultRules(userId: string) {
  const cats = await db.select({ id: categories.id, name: categories.name }).from(categories).where(eq(categories.userId, userId));
  const byName = new Map(cats.map((c) => [c.name, c.id]));
  const values = DEFAULT_DESCRIPTION_RULES.flatMap((r) => {
    const categoryId = byName.get(r.category);
    return categoryId ? [{ userId, matchType: 'description', matchValue: r.contains, categoryId }] : [];
  });
  if (values.length) await db.insert(categoryRules).values(values).onConflictDoNothing();
}

/**
 * Fills the category of every uncategorised transaction that a rule matches. Counterparty rules win over
 * description rules, which win over amount rules (each statement only touches rows still empty).
 * Never changes a category that is already set, and skips transactions excluded from totals.
 * Returns how many rows were categorised.
 */
export async function applyCategoryRules(userId: string): Promise<number> {
  await ensureDefaultRules(userId);

  const byCounterparty = await db.execute(sql`
    update transactions t set category_id = r.category_id
    from category_rules r
    where t.user_id = ${userId} and r.user_id = t.user_id
      and t.category_id is null and not t.is_internal
      and r.match_type = 'counterparty' and lower(t.counterparty) = r.match_value
    returning t.id`);

  const byDescription = await db.execute(sql`
    update transactions t set category_id = r.category_id
    from category_rules r
    where t.user_id = ${userId} and r.user_id = t.user_id
      and t.category_id is null and not t.is_internal
      and r.match_type = 'description' and t.description is not null
      and position(lower(r.match_value) in lower(t.description)) > 0
    returning t.id`);

  const byAmount = await db.execute(sql`
    update transactions t set category_id = r.category_id
    from category_rules r
    where t.user_id = ${userId} and r.user_id = t.user_id
      and t.category_id is null and not t.is_internal
      and r.match_type = 'amount' and t.direction = 'out' and t.amount::text = r.match_value
    returning t.id`);

  return byCounterparty.length + byDescription.length + byAmount.length;
}

/**
 * Sets (or clears) the category of one transaction. With `remember`, the choice also becomes a rule that is
 * applied to every other uncategorised transaction it matches, now and on future imports.
 * Returns null if the transaction or the category is not the user's.
 */
export async function setCategory(userId: string, transactionId: string, categoryId: string | null, remember: Remember = 'none') {
  if (categoryId) {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.userId, userId))) // the category must be the user's
      .limit(1);
    if (!cat) return null;
  }

  const [row] = await db
    .update(transations)
    .set({ categoryId })
    .where(and(eq(transations.id, transactionId), eq(transations.userId, userId))) // the ownership rule
    .returning();
  if (!row) return null;

  let applied = 0;
  if (categoryId && remember !== 'none') {
    const rule = ruleFor(row, remember);
    if (rule) {
      await db
        .insert(categoryRules)
        .values({ userId, categoryId, ...rule })
        .onConflictDoUpdate({ target: [categoryRules.userId, categoryRules.matchType, categoryRules.matchValue], set: { categoryId } });
      applied = await applyCategoryRules(userId);
    }
  }
  return { transaction: row, applied };
}