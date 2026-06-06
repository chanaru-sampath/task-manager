import type { NextFunction, Request, Response } from 'express';
import { z, ZodError, type ZodSchema } from 'zod';

const ISO_DATE_REG = /^\d{4}-\d{2}-\d{2}$/;

export const createTaskSchema = {
  body: z.object({
    title: z.string().trim().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
    dueOn: z.string().min(1, 'Due date is required').regex(ISO_DATE_REG, 'Invalid date format (YYYY-MM-DD)'),
    priority: z.enum(['low', 'medium', 'high']),
  }),
};

export const updateTaskSchema = {
  body: z
    .object({
      title: z.string().trim().min(1, 'Title is required').max(100, 'Title must be 100 characters or less').optional(),
      dueOn: z.string().regex(ISO_DATE_REG, 'Invalid date format (YYYY-MM-DD)').optional(),
      priority: z.enum(['low', 'medium', 'high']).optional(),
      completed: z.boolean().optional(),
      index: z.number().finite().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, { message: 'No fields to update' }),
};

export function validate(schemas: { body?: ZodSchema; params?: ZodSchema; query?: ZodSchema }) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.params) {
        const parsed = schemas.params.parse(req.params);
        Object.assign(req.params, parsed);
      }
      if (schemas.query) req.query = schemas.query.parse(req.query) as Request['query'];
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldErrors: Record<string, string[]> = {};
        for (const issue of err.issues) {
          const path = issue.path.join('.') || '_';
          (fieldErrors[path] ??= []).push(issue.message);
        }
        res.status(400).json({ error: 'Validation failed', fieldErrors });
        return;
      }
      next(err);
    }
  };
}
