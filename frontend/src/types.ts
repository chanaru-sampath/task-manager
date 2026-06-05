export type Priority = 'low' | 'medium' | 'high'

type SortDirection = 'asc' | 'desc'

export interface Task {
  id: string
  title: string
  dueDate: string // Date string (YYYY-MM-DD)
  priority: Priority
  completed: boolean
  index: number // Float index for drag-and-drop ordering
}

export interface TaskFilters {
  status: 'all' | 'completed' | 'active'
  priority: Priority | 'all'
  sortByDueDate: boolean // false = natural index order (allows reorder), true = sorted by due date
  sortDirection: SortDirection // only used when sortByDueDate is true
}
