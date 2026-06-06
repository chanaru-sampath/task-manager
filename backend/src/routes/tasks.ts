import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { tasks } from '../db/schema';

const tasksRouter = Router();

// GET /tasks
tasksRouter.get('/', async (_req, res) => {
  try {
    const all = await db.select().from(tasks);
    res.json(all);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /tasks/:id
tasksRouter.get('/:id', async (req, res) => {
  try {
    const task = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, Number(req.params.id)));

    if (!task.length) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json(task[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST /tasks
tasksRouter.post('/', async (req, res) => {
  try {
    const { title } = req.body;
    const newTask = await db
      .insert(tasks)
      .values({ title })
      .returning();
    res.status(201).json(newTask[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /tasks/:id
tasksRouter.put('/:id', async (req, res) => {
  try {
    const { title, completed } = req.body;
    const updated = await db
      .update(tasks)
      .set({ title, completed })
      .where(eq(tasks.id, Number(req.params.id)))
      .returning();

    if (!updated.length) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /tasks/:id
tasksRouter.delete('/:id', async (req, res) => {
  try {
    const deleted = await db
      .delete(tasks)
      .where(eq(tasks.id, Number(req.params.id)))
      .returning();

    if (!deleted.length) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json({ message: 'Task deleted', task: deleted[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default tasksRouter;