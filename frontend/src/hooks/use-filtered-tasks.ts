import { compareLocalDates, fromIso } from '@/lib/local-date'
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
}
