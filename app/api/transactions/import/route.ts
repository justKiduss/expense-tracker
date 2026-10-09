import { NextResponse } from "next/server";
import {z} from "zod";
import { getCurrentUser } from "@/lib/auth/session";
import {parseSms} from '@/lib/sms-parser/parser';
import { importParsedTransation } from "@/lib/services/transaction.service";


const schema =z.object({
    body:z.string().min(1).max(2000),
    receivedAt:z.iso.datetime({offset:true}).optional(),
});


export async function POST(request:Request){
    const user=await getCurrentUser();
    if(!user) return NextResponse.json({error:'UnAuthorized'}, {status:401});

    const input=schema.safeParse(await request.json().catch(()=>null));
    if(!input.success) return NextResponse.json({error:'Invalid request'}, {status:400});

    const result=parseSms({
        body:input.data.body,
        receivedAt:input.data.receivedAt? new Date(input.data.receivedAt) : new Date(),
    });

    if(result.status === 'ignored') return NextResponse.json({status:'ignored',reason:result.reason});
    if(result.status === 'unknown') return NextResponse.json({status:'unknown'}, {status:422});

    const saved =await importParsedTransation(user.id,result.tx);
    if(!saved) return NextResponse.json({status:'duplicate'});
    return NextResponse.json({status:'created', transation:saved}, {status:201});
}