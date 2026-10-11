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

export async function getMonthlyLimit(userId: string) {
  const [row] = await db.select({ v: users.monthlyLimit }).from(users).where(eq(users.id, userId)).limit(1);
  return row?.v ?? null;
}

export async function setMonthlyLimit(userId: string, cents: number | null) {
  await db.update(users).set({ monthlyLimit: cents }).where(eq(users.id, userId));
}