import { desc,eq,sql,and,gte,lt } from "drizzle-orm";
import { db } from "@/lib/db"
import { transations,categories } from "@/lib/db/schema";
import type { ParsedTransaction } from "../sms-parser/parser";

export async function importParsedTransation(userId:string,tx:ParsedTransaction){
    const [row]=await db.insert(transations)
        .values({
            userId,
            direction:tx.direction,
            kind:tx.kind,
            amount:tx.amount,
            fee:tx.fee,
            currency:tx.currency,
            balanceAfter:tx.balanceAfter,
            counterparty:tx.counterparty,
            description:tx.description,
            reference:tx.reference,
            dedupeKey:tx.dedupeKey,
            occurredAt:new Date(tx.occurredAt),
            source:'sms',
            needsReview:tx.needsReview,
        })
        .onConflictDoNothing({target:[transations.userId, transations.dedupeKey] })
        .returning();
        return row ?? null; // if null means the transactions is duplicacated
}


export interface NewTransactionInput {
    direction :'in'|'out';
    amount:number;
    fee:number;
    occurredAt:Date;
    counterparty?:string;
    description?:string;
}


export async function createTransaction(userId:string,input:NewTransactionInput){
    const [row] =await db
        .insert(transations)    
        .values({...input,userId,kind:'manual',source:'manual'})
         .returning();
         
         return row;
}

export async function listTransations(userId:string,limit=50){
    return db.select().from(transations)
        .where(eq(transations.userId, userId)) // the ownership rule
        .orderBy(desc(transations.occurredAt))
        .limit(limit);
}

export async function updateTransactionMeta(
  userId: string,
  id: string,
  patch: { categoryId?: string | null; isInternal?: boolean },
) {
  if (patch.categoryId) {
    // the category must belong to the same user, or someone could attach another user's category
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.id, patch.categoryId), eq(categories.userId, userId)))
      .limit(1);
    if (!cat) return null;
  }
  const [row] = await db
    .update(transations)
    .set(patch)
    .where(and(eq(transations.id, id), eq(transations.userId, userId)))
    .returning();
  return row ?? null;
}

// One definition of "spent", used by both the summary and the breakdown so they always add up:
// principal of outgoing, non-internal, non-loan-repayment rows, plus every fee.
const spentSql = sql<number>`coalesce(sum(case when ${transations.direction} = 'out' and not ${transations.isInternal} and ${transations.kind} <> 'loan_repayment' then ${transations.amount} else 0 end), 0) + coalesce(sum(${transations.fee}), 0)`.mapWith(Number);

export async function getSummary(userId: string, from: Date, to: Date) {
  const [row] = await db
    .select({
      income: sql<number>`coalesce(sum(case when ${transations.direction} = 'in' and not ${transations.isInternal} and ${transations.kind} <> 'loan_received' then ${transations.amount} else 0 end), 0)`.mapWith(Number),
      expenses: spentSql,
    })
    .from(transations)
    .where(and(eq(transations.userId, userId), gte(transations.occurredAt, from), lt(transations.occurredAt, to)));

  return { income: row.income, expenses: row.expenses, net: row.income - row.expenses };
}

export async function getCategoryBreakdown(userId: string, from: Date, to: Date) {
  const rows = await db
    .select({ categoryId: transations.categoryId, spent: spentSql })
    .from(transations)
    .where(and(eq(transations.userId, userId), gte(transations.occurredAt, from), lt(transations.occurredAt, to)))
    .groupBy(transations.categoryId);

  return rows.filter((r) => r.spent > 0); // categoryId null = uncategorized
}