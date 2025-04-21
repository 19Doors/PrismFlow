import { drizzle } from "drizzle-orm/libsql";

export const db = drizzle({ connection: {
  url: "libsql://prismflow-19doors.aws-ap-south-1.turso.io",
  authToken: process.env.DATABASE_TOKEN as string
}});
