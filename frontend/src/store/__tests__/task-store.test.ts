import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { Task } from '@/types'

import { PRIORITY_OPTIONS, useTaskStore } from '../task-store'

let nextIndex = 1
function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: crypto.randomUUID(),
    title: 'Task',
    dueOn: '2026-06-06',
    priority: 'medium',
    completed: false,
    index: nextIndex++,
    ...overrides,
  }
}

const DEFAULT_FILTERS = {
  status: 'all' as const,
  priority: 'all' as const,
  sortByDueDate: false,
  sortDirection: 'asc' as const,
}

function resetStore() {
  useTaskStore.setState({ tasks: [], filters: { ...DEFAULT_FILTERS } })
  localStorage.clear()
}

beforeEach(() => {
  nextIndex = 1
  resetStore()
})
afterEach(resetStore)

describe('addTask', () => {
  it('appends a task with a generated id and completed=false', () => {
    useTaskStore.getState().addTask({ title: 'A', dueOn: '2026-06-06', priority: 'low' })
    const [task] = useTaskStore.getState().tasks
    expect(task.title).toBe('A')
    expect(task.dueOn).toBe('2026-06-06')
    expect(task.priority).toBe('low')
    expect(task.completed).toBe(false)
    expect(typeof task.id).toBe('string')
    expect(task.id.length).toBeGreaterThan(0)
  })

  it('assigns the first task index 1.0', () => {
    useTaskStore.getState().addTask({ title: 'A', dueOn: '2026-06-06', priority: 'low' })
    expect(useTaskStore.getState().tasks[0].index).toBe(1.0)
  })

  it('places new tasks strictly after the existing max index', () => {
    useTaskStore.setState({ tasks: [makeTask({ index: 1 }), makeTask({ index: 3 })] })
    useTaskStore.getState().addTask({ title: 'A', dueOn: '2026-06-06', priority: 'low' })
    const added = useTaskStore.getState().tasks[2]
    expect(added.index).toBeGreaterThan(3)
  })

  it('handles fractional max indices', () => {
    useTaskStore.setState({ tasks: [makeTask({ index: 1.5 })] })
    useTaskStore.getState().addTask({ title: 'A', dueOn: '2026-06-06', priority: 'low' })
    expect(useTaskStore.getState().tasks[1].index).toBeGreaterThan(1.5)
  })
})

describe('updateTask', () => {
  it('patches the matching task', () => {
    const t = makeTask({ title: 'Old', priority: 'low' })
    useTaskStore.setState({ tasks: [t] })
    useTaskStore.getState().updateTask(t.id, { title: 'New', priority: 'high' })
    const updated = useTaskStore.getState().tasks[0]
    expect(updated.title).toBe('New')
    expect(updated.priority).toBe('high')
    expect(updated.id).toBe(t.id)
  })

  it('is a no-op for unknown id', () => {
    const t = makeTask({ title: 'A' })
    useTaskStore.setState({ tasks: [t] })
    useTaskStore.getState().updateTask('does-not-exist', { title: 'X' })
    expect(useTaskStore.getState().tasks[0].title).toBe('A')
  })
})

describe('deleteTask', () => {
  it('removes the matching task and leaves others', () => {
    const a = makeTask({ title: 'A' })
    const b = makeTask({ title: 'B' })
    const c = makeTask({ title: 'C' })
    useTaskStore.setState({ tasks: [a, b, c] })
    useTaskStore.getState().deleteTask(b.id)
    const remaining = useTaskStore.getState().tasks
    expect(remaining).toHaveLength(2)
    expect(remaining.map((t) => t.id)).toEqual([a.id, c.id])
  })
})

describe('toggleComplete', () => {
  it('flips completed from false to true', () => {
    const t = makeTask({ completed: false })
    useTaskStore.setState({ tasks: [t] })
    useTaskStore.getState().toggleComplete(t.id)
    expect(useTaskStore.getState().tasks[0].completed).toBe(true)
  })

  it('flips completed from true to false', () => {
    const t = makeTask({ completed: true })
    useTaskStore.setState({ tasks: [t] })
    useTaskStore.getState().toggleComplete(t.id)
    expect(useTaskStore.getState().tasks[0].completed).toBe(false)
  })

  it('leaves other tasks unchanged', () => {
    const a = makeTask({ completed: false })
    const b = makeTask({ completed: true })
    useTaskStore.setState({ tasks: [a, b] })
    useTaskStore.getState().toggleComplete(a.id)
    expect(useTaskStore.getState().tasks[1].completed).toBe(true)
  })
})

describe('reorderTask', () => {
  it('sets the index to the midpoint between prev and next', () => {
    const t = makeTask({ index: 1 })
    useTaskStore.setState({ tasks: [t] })
    useTaskStore.getState().reorderTask(t.id, 1.0, 3.0)
    expect(useTaskStore.getState().tasks[0].index).toBe(2.0)
  })
})

describe('filters', () => {
  it('setFilter merges partial updates', () => {
    useTaskStore.getState().setFilter({ status: 'active' })
    const f = useTaskStore.getState().filters
    expect(f.status).toBe('active')
    expect(f.priority).toBe('all')
    expect(f.sortByDueDate).toBe(false)
    expect(f.sortDirection).toBe('asc')
  })

  it('setFilter can update multiple fields at once', () => {
    useTaskStore.getState().setFilter({ priority: 'high', sortByDueDate: true, sortDirection: 'desc' })
    const f = useTaskStore.getState().filters
    expect(f.priority).toBe('high')
    expect(f.sortByDueDate).toBe(true)
    expect(f.sortDirection).toBe('desc')
  })

  it('resetFilters restores defaults', () => {
    useTaskStore.getState().setFilter({ status: 'completed', priority: 'high' })
    useTaskStore.getState().resetFilters()
    expect(useTaskStore.getState().filters).toEqual(DEFAULT_FILTERS)
  })
})

describe('persist', () => {
  it('persists tasks but not filters (filters are runtime-only)', () => {
    useTaskStore.getState().addTask({ title: 'A', dueOn: '2026-06-06', priority: 'low' })
    useTaskStore.getState().setFilter({ status: 'active' })
    const persisted = useTaskStore.persist.getOptions().partialize?.(useTaskStore.getState()) ?? {}
    expect(persisted).toHaveProperty('tasks')
    expect(persisted).not.toHaveProperty('filters')
  })
})

describe('PRIORITY_OPTIONS', () => {
  it('exposes low/medium/high in order', () => {
    expect(PRIORITY_OPTIONS).toEqual([
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
    ])
  })
})
