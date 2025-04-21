import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core"

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({autoIncrement: true}),
  email: text('email').notNull().unique(),
  name: text('name'),
  historyId: text('historyId'),
  createdAt: integer('createdAt'),
  firstSync: text('firstSync'),
})

export const linkedAccounts = sqliteTable('linked_accounts', {
  id: integer('id').primaryKey({autoIncrement:true}),
  name: text('name'),
  primaryEmail: text('primaryEmail').notNull(),
  email: text('email').notNull().unique(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  image: text('image'),
  historyId: text('historyId'),
  expiresAt: integer('expires_at'),
  firstSync: text('firstSync'),
})

export const emails= sqliteTable('emails', {
  id: text('id').primaryKey().unique(),
  email: text('email'),
  labelIds: text('labelIds'),
  snippet: text('snippet'),
  subject: text('subject'),
  from: text('from'),
  date: text('date'),
  threadId: text('threadId'),
  replyTo: text('replyTo'),
  plainText: text('plainText'),
  htmlBody: text('htmlBody')
})
