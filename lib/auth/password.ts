import bcrypt from "bcryptjs";

export const hashPassword = (password:string) =>bcrypt.hash(password, 12);
export const verifyPassword = (password: string, hash: string) =>bcrypt.compare(password,hash);

// used when the email doesn't exist, so response time doesn't reveal that
export const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);