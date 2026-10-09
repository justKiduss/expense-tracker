import { SignJWT,jwtVerify } from "jose";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

const COOKIE = 'session';
const MAX_AGE= 60 * 60 * 24 *7; // 7days

function secret(){
    const s = process.env.AUTH_SECRET;
    if(!s || s.length < 32) throw new Error("Auth_secret must set and at least 32 characters");
    return new TextEncoder().encode(s);
}

export async function createSession(userId:string){
    const token=await new SignJWT({})
    .setProtectedHeader({alg: 'HS256'})
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());

    (await cookies()).set(COOKIE, token, {
        httpOnly:true,    // JavaScript on the page can't read it
        secure: process.env.NODE_ENV === 'production',    // HTTPS only in production
        sameSite:'lax',
        path:'/',
        maxAge: MAX_AGE,
    });
}

export async function clearSession(){
    (await cookies()).delete(COOKIE);
}


export async function getCurrentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  const key = secret(); // outside try, so a missing secret fails loudly
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    if (!payload.sub) return null;
    const [user] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);
    return user ?? null; // null if the account was deleted
  } catch {
    return null; // expired, tampered, or malformed token
  }
}