import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: "./migrations",
  dialect: "turso",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_TOKEN!
  }
})

