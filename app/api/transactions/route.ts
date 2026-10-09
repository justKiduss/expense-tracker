import { NextResponse } from "next/server";
import {z} from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import { createTransaction,listTransations } from "@/lib/services/transaction.service";
import { transations } from "@/lib/db/schema";


const createSchema =z.object({
    direction:z.enum(['in','out']),
    amount:z.number().int().positive(),
    fee:z.number().int().min(0).default(0),
    occurredAt:z.iso.datetime({offset:true}),
    counterParty:z.string().max(200).optional(),
    description:z.string().max(500).optional(),
});


export async function GET(){
    const user=await getCurrentUser();
    if(!user) return NextResponse.json({error:'Unauthorized'},{ status:401});
    return NextResponse.json({transations:await listTransations(user.id)});
}

export async function POST(request:Request){
    const user=await getCurrentUser();
    if(!user) return NextResponse.json({error:'UnAuthorized'},{status:401});

    const parsed=createSchema.safeParse(await request.json().catch(()=>null));

    if(!parsed.success){
         return NextResponse.json({ error: 'Invalid transaction' }, { status: 400 });
    }

    const tx=await createTransaction(user.id, {
        ...parsed.data,
        occurredAt:new Date(parsed.data.occurredAt),
    });
    return NextResponse.json({transations:tx}, {status:201});
}