import {sqliteTable,text,primaryKey} from 'drizzle-orm/sqlite-core';
export const watchlist=sqliteTable('watchlist',{visitorId:text('visitor_id').notNull(),ticker:text('ticker').notNull(),createdAt:text('created_at').notNull()},t=>[primaryKey({columns:[t.visitorId,t.ticker]})]);
