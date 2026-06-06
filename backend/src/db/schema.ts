import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const tasks = sqliteTable('tasks', {
  id: int().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  completed: int({ mode: 'boolean' }).notNull().default(false),
});