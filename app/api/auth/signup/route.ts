import { NextResponse } from "next/server";
import { z } from 'zod';
import { createUser,findUserByEmail } from "@/lib/service/user.service";

const signupSchema = z.object({
    email:z.email(),
    password:z.string().min(8).max(72),
});

export async function POST(request:Request){
    const body=await request.json().catch(()=>null);
    const parsed = signupSchema.safeParse(body);
    if(!parsed.success){
        return NextResponse.json({error:'Invalid email or password'}, {status :400});
    }

    const email=parsed.data.email.toLowerCase();
    if(await findUserByEmail(email)){
        return NextResponse.json({error : 'Could not create account'}, {status:409});
    }

    const user=await createUser(email,parsed.data.password);
    return NextResponse.json({user}, {status:201});
}
