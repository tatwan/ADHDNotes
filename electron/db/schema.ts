import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const bookmarks = sqliteTable('bookmarks', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    url: text('url').notNull(),
    title: text('title'),
    description: text('description'),
    content: text('content'), // The readable HTML content
    faviconUrl: text('favicon_url'),
    localImagePath: text('local_image_path'),
    isProcessed: integer('is_processed', { mode: 'boolean' }).default(false),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(new Date()),
});

export const tags = sqliteTable('tags', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull().unique(),
});

export const bookmarksTags = sqliteTable('bookmarks_tags', {
    bookmarkId: integer('bookmark_id').references(() => bookmarks.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id').references(() => tags.id, { onDelete: 'cascade' }),
});

export const highlights = sqliteTable('highlights', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    bookmarkId: integer('bookmark_id').references(() => bookmarks.id, { onDelete: 'cascade' }),
    content: text('content').notNull(), // The highlighted text
    selector: text('selector'), // XPath or similar to locate
    color: text('color'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
});

export const snippets = sqliteTable('snippets', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    content: text('content').notNull(), // The highlighted text as markdown
    url: text('url').notNull(), // Source page URL
    title: text('title'), // Source page title
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(new Date()),
});
