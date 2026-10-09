import { desc,eq } from "drizzle-orm";
import { db } from "@/lib/db"
import { transations } from "@/lib/db/schema";
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