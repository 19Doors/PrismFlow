"use server"
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { emails, linkedAccounts } from "@/lib/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";

export async function getLinkedAccounts() {
  const session = await auth();
  const linkAc = await db.select().from(linkedAccounts).where(eq(linkedAccounts.primaryEmail,session?.user.email!));
  return linkAc;
}

export async function deleteAccountEmail(email:any) {
  try {
    await db.delete(linkedAccounts).where(eq(linkedAccounts.email,email));
  }catch(e) {
    console.error("Error deleting account");
  }
}

export async function getEmails(email:string[]) {
  try {
    let r = await db.select().from(emails).where(inArray(emails.email,email)).orderBy(desc(emails.date));
    return r;
  }catch(e) {
    console.error(e);
  }
}

export async function getEmailFromID(email:string, id:string) {
  try {
    console.log(email+" "+id);
    let r = await db.select().from(emails).where(and(eq(emails.email,email),eq(emails.id,id)));
    return r[0];
  }catch(e) {
    console.error(e);
  }
}
