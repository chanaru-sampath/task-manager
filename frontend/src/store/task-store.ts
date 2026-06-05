import { v4 as uuidv4 } from 'uuid'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { generateKeyBetween } from '@/lib/indexing'
import type { Priority, Task, TaskFilters } from '@/types'

interface TaskStore {
  // State
  tasks: Task[]
  filters: TaskFilters

  // Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'completed' | 'index'>) => void
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void
  deleteTask: (id: string) => void
  toggleComplete: (id: string) => void
  reorderTask: (id: string, previousIndex: number | null, nextIndex: number | null) => void
  setFilter: (filter: Partial<TaskFilters>) => void
  resetFilters: () => void
}

const DEFAULT_FILTERS: TaskFilters = {
  status: 'all',
  priority: 'all',
  sortByDueDate: false,
  sortDirection: 'asc',
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set) => ({
      tasks: [],
      filters: { ...DEFAULT_FILTERS },

      addTask: (taskData) => {
        set((state) => {
          // Find the highest index in the current list
          let highestIndex: number | null = null
          for (const task of state.tasks) {
            if (task.index !== null && (highestIndex === null || task.index > highestIndex)) {
              highestIndex = task.index
            }
          }

          const newTask: Task = {
            id: uuidv4(),
            title: taskData.title,
            dueDate: taskData.dueDate,
            priority: taskData.priority,
            completed: false,
            index: generateKeyBetween(highestIndex, null),
          }
          return { tasks: [...state.tasks, newTask] }
        })
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) => (task.id === id ? { ...task, ...updates } : task)),
        }))
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }))
      },

      toggleComplete: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)),
        }))
      },

      reorderTask: (id, previousIndex, nextIndex) => {
        set((state) => {
          const newIndex = generateKeyBetween(previousIndex, nextIndex)
          return {
            tasks: state.tasks.map((task) => (task.id === id ? { ...task, index: newIndex } : task)),
          }
        })
      },

      setFilter: (filter) => {
        set((state) => ({
          filters: { ...state.filters, ...filter },
        }))
      },

      resetFilters: () => {
        set({ filters: { ...DEFAULT_FILTERS } })
      },
    }),
    {
      name: 'task-manager-storage',
      version: 3,
      // Only persist tasks, not filters (filters reset on reload for better UX)
      partialize: (state) => ({ tasks: state.tasks }) as Partial<TaskStore>,
    }
  )
)

// Selector for priority options
export const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]
