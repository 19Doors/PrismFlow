import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core"

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({autoIncrement: true}),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: integer('createdAt')
})

export const emails= sqliteTable('emails', {
  id: text('id').primaryKey().unique(),
  userId: text('user_email').notNull(),
  subject: text('subject'),
  sender: text('sender'),
  threadId: text('thread_id'),
})
