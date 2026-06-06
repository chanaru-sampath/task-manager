import { z } from 'zod'

import { fromIso, isBeforeLocalDate, today } from '@/lib/local-date'

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export const taskFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  dueOn: z.string().min(1, 'Due date is required').regex(ISO_DATE_RE, 'Invalid date format (YYYY-MM-DD)'),
  priority: z.enum(['low', 'medium', 'high'] as const),
})

/**
 * Extended schema that also validates the due date is not in the past.
 * Used for new tasks only (editing allows past dates).
 */
export const newTaskFormSchema = taskFormSchema.refine((data) => !isBeforeLocalDate(fromIso(data.dueOn), today()), {
  message: 'Due date cannot be in the past',
  path: ['dueOn'],
})

export type TaskFormData = z.infer<typeof taskFormSchema>
