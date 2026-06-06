import { randomUUID } from 'node:crypto';

import { Router } from 'express';
import { asc, eq } from 'drizzle-orm';
import { db } from '../db';
import { tasks } from '../db/schema';
import { createTaskSchema, updateTaskSchema, validate } from '../schemas/task';

const tasksRouter = Router();

tasksRouter.get('/', async (_req, res, next) => {
  try {
    const rows = await db.select().from(tasks).orderBy(asc(tasks.index));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

tasksRouter.post('/', validate(createTaskSchema), async (req, res, next) => {
  try {
    const { title, dueOn, priority } = req.body as { title: string; dueOn: string; priority: 'low' | 'medium' | 'high' };

    const existing = await db.select({ index: tasks.index }).from(tasks).orderBy(asc(tasks.index));
    const highest = existing.length ? (existing[existing.length - 1]!.index ?? 0) : null;
    const newIndex = highest === null ? 1.0 : highest + 1.0;

    const id = randomUUID();
    const inserted = await db
      .insert(tasks)
      .values({ id, title, dueOn, priority, completed: false, index: newIndex })
      .returning();

    res.status(201).json(inserted[0]);
  } catch (err) {
    next(err);
  }
});

tasksRouter.patch('/:id', validate(updateTaskSchema), async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    const updates = req.body as {
      title?: string;
      dueOn?: string;
      priority?: 'low' | 'medium' | 'high';
      completed?: boolean;
      index?: number;
    };

    const updated = await db
      .update(tasks)
      .set({ ...updates })
      .where(eq(tasks.id, id))
      .returning();

    if (!updated.length) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json(updated[0]);
  } catch (err) {
    next(err);
  }
});

tasksRouter.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params as { id: string };
    const deleted = await db.delete(tasks).where(eq(tasks.id, id)).returning();

    if (!deleted.length) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default tasksRouter;
