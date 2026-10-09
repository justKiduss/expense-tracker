import { desc,eq } from "drizzle-orm";
import { db } from "@/lib/db"
import { transations } from "@/lib/db/schema";

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