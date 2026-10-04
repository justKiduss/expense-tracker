import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { hashPassword } from "../auth/password";

export async function findUserByEmail(email:string){
    const [user]=await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user??null;
}

export async function createUser(email:string, password:string){
    const [user]=await db.insert(users).values({email, passwordHash:await hashPassword(password) })
                    .returning({id:users.id, email:users.email});
            return user;
}