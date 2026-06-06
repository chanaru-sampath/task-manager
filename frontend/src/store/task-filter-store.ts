import { create } from 'zustand'

import type { Priority, TaskFilters } from '@/types'

interface TaskFilterStore {
  filters: TaskFilters
  setFilter: (filter: Partial<TaskFilters>) => void
  resetFilters: () => void
}

const DEFAULT_FILTERS: TaskFilters = {
  status: 'all',
  priority: 'all',
  sortByDueDate: false,
  sortDirection: 'asc',
}

export const useTaskFilterStore = create<TaskFilterStore>()((set) => ({
  filters: { ...DEFAULT_FILTERS },

  setFilter: (filter) => {
    set((state) => ({
      filters: { ...state.filters, ...filter },
    }))
  },

  resetFilters: () => {
    set({ filters: { ...DEFAULT_FILTERS } })
  },
}))

export const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]
