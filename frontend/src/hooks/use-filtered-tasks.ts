import { useMemo } from 'react'

import { useTasks } from '@/hooks/use-tasks'
import { compareLocalDates, fromIso } from '@/lib/local-date'
import { useTaskFilterStore } from '@/store/task-filter-store'
import type { Task } from '@/types'

/**
 * Derives a filtered and sorted task list from the TanStack Query cache.
 * Default order is by index (natural drag-and-drop order).
 * When sortByDueDate is enabled, tasks are sorted by due date instead.
 */
export function useFilteredTasks(): Task[] {
  const tasksQuery = useTasks()
  const tasks = tasksQuery.data ?? []
  const filters = useTaskFilterStore((s) => s.filters)

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
        return filters.sortDirection === 'asc'
          ? compareLocalDates(fromIso(a.dueOn), fromIso(b.dueOn))
          : compareLocalDates(fromIso(b.dueOn), fromIso(a.dueOn))
      }

      return a.index - b.index
    })
  }, [filters, tasks])
}
