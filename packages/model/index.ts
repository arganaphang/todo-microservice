import { drizzle } from 'drizzle-orm/node-postgres';
import { boolean, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

const db = drizzle(process.env.DATABASE_URL || '');


export const todos = pgTable("todos", {
    id: serial().primaryKey(),
    title: varchar({ length: 255 }).notNull(),
    is_completed: boolean().notNull().default(false),
    created_at: timestamp().notNull().defaultNow(),
});

export const table = {
    todos: todos,
} as const

export type Table = typeof table

export default db;