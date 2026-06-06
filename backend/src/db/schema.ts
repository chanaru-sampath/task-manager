import { int, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const tasks = sqliteTable('tasks', {
  id: text().primaryKey(),
  title: text().notNull(),
  dueOn: text().notNull(),
  priority: text({ enum: ['low', 'medium', 'high'] }).notNull(),
  completed: int({ mode: 'boolean' }).notNull().default(false),
  index: real().notNull(),
});
