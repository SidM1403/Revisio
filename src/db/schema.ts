import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // Maps to Clerk User ID
  email: text('email').notNull(),
  isPremium: integer('is_premium', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const savedNotes = sqliteTable('saved_notes', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  content: text('content').notNull(), // Raw text
  summary: text('summary'), // Generated AI notes
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});
