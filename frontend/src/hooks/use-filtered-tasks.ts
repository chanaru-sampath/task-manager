import { useMemo } from 'react'

import { useTaskStore } from '@/store/task-store'
import type { Task } from '@/types'

/**
 * Derives a filtered and sorted task list from the Zustand store.
 * Default order is by index (natural drag-and-drop order).
 * When sortByDueDate is enabled, tasks are sorted by due date instead.
 */
export function useFilteredTasks(): Task[] {
  const tasks = useTaskStore((s) => s.tasks)
  const filters = useTaskStore((s) => s.filters)

  return useMemo(() => {
    const filtered: Task[] = []
    for (const t of tasks) {
      if (filters.status === 'completed' && !t.completed) continue
      if (filters.status === 'active' && t.completed) continue
      if (filters.priority !== 'all' && t.priority !== filters.priority) continue
      filtered.push(t)
    }

    return filtered.toSorted((a, b) => {
      if (filters.sortByDueDate) {
        const cmp = a.dueDate.localeCompare(b.dueDate)
        return filters.sortDirection === 'asc' ? cmp : -cmp
      }

      // Default: sort by index (natural order)
      const indexA = a.index ?? Number.MAX_SAFE_INTEGER
      const indexB = b.index ?? Number.MAX_SAFE_INTEGER
      return indexA - indexB
    })
  }, [tasks, filters])
}
