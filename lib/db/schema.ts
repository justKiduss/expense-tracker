import { PgTable, uuid, text, integer, boolean, timestamp, uniqueIndex, index, pgTable } from "drizzle-orm/pg-core";

export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    createdAt:timestamp('created_at', {withTimezone: true}).notNull().defaultNow(),
});

export const accounts = pgTable('accounts', {
    id:uuid('id').primaryKey().defaultRandom(),
    userId:uuid("user_id").notNull().references(() => users.id, {onDelete: 'cascade'}),
    name: text('name').notNull(),
    institution: text('institution'),
    currency: text('currency').notNull().default('ETB'),
    createdAt:timestamp("created_at", { withTimezone:true}).notNull().defaultNow(),
});

export const categories = pgTable('categories', {
    id:uuid('id').primaryKey().defaultRandom(),
    userId:uuid('user_id').notNull().references(()=>users.id, {onDelete:"cascade"}),
    name:text('name').notNull(),
    createdAt:timestamp('created_at', {withTimezone:true}).notNull().defaultNow(),
});

export const transations =pgTable('transactions',{
    id:uuid('id').primaryKey().defaultRandom(),
    userId:uuid('user_id').notNull().references(()=>users.id, { onDelete: 'cascade'}),
    accountid:uuid("account_id").references(()=>accounts.id, {onDelete: 'set null'}),
    categoryId: uuid('category_id').references(()=>categories.id, {onDelete:'set null'}),
    direction:text('direction').notNull(),
    kind:text('kind').notNull(),
    amount:integer('amount').notNull(),
    fee:integer('fee').notNull().default(0),
    currency: text('currency').notNull().default('ETB'),
    balanceAfter: integer('balance_after'),
    counterparty: text('counterparty'),
    description: text('description'),
    reference: text('reference'),
    dedupeKey: text('dedupe_key'),          // null for manual entries
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    source: text('source').notNull().default('manual'), // 'manual' | 'sms'
    needsReview: boolean('needs_review').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
},
   (t) => [
    uniqueIndex('transactions_user_dedupe_uq').on(t.userId, t.dedupeKey),
    index('transactions_user_date_idx').on(t.userId, t.occurredAt),
  ], 
)