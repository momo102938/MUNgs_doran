import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const worlds = sqliteTable('worlds', {id:text('id').primaryKey(), data:text('data').notNull(),created:integer('created').notNull()});
export const aiSettings = sqliteTable('ai_settings', { userId:text('user_id').primaryKey(), provider:text('provider').notNull(),model:text('model').notNull(), encryptedKey:text('encrypted_key').notNull(),updated:integer('updated').notNull(),lastRequest:integer('last_request').notNull().default(0)});
