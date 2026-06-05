import { z } from 'zod/v4'

function getTodayString(): string {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

export const taskFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  dueDate: z
    .string()
    .min(1, 'Due date is required')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  priority: z.enum(['low', 'medium', 'high'] as const),
})

/**
 * Extended schema that also validates the due date is not in the past.
 * Used for new tasks only (editing allows past dates).
 */
export const newTaskFormSchema = taskFormSchema.refine((data) => data.dueDate >= getTodayString(), {
  message: 'Due date cannot be in the past',
  path: ['dueDate'],
})

export type TaskFormData = z.infer<typeof taskFormSchema>
