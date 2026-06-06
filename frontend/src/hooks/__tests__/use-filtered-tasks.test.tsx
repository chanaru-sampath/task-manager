import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { renderHook } from 'vitest-browser-react'

import { useTaskStore } from '@/store/task-store'
import type { Task } from '@/types'

import { useFilteredTasks } from '../use-filtered-tasks'

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

function resetStore() {
  useTaskStore.setState({
    tasks: [],
    filters: { status: 'all', priority: 'all', sortByDueDate: false, sortDirection: 'asc' },
  })
  localStorage.clear()
}

beforeEach(() => {
  nextIndex = 1
  resetStore()
})
afterEach(resetStore)

describe('useFilteredTasks', () => {
  it('returns an empty array for an empty store', async () => {
    const { result } = await renderHook(() => useFilteredTasks())
    expect(result.current).toEqual([])
  })

  describe('status filter', () => {
    it('"all" returns every task', async () => {
      useTaskStore.setState({ tasks: [makeTask({ completed: false }), makeTask({ completed: true })] })
      const { result } = await renderHook(() => useFilteredTasks())
      expect(result.current).toHaveLength(2)
    })

    it('"active" excludes completed tasks', async () => {
      const a = makeTask({ completed: false })
      const b = makeTask({ completed: true })
      useTaskStore.setState({ tasks: [a, b] })
      useTaskStore.getState().setFilter({ status: 'active' })
      const { result } = await renderHook(() => useFilteredTasks())
      expect(result.current.map((t: Task) => t.id)).toEqual([a.id])
    })

    it('"completed" excludes active tasks', async () => {
      const a = makeTask({ completed: false })
      const b = makeTask({ completed: true })
      useTaskStore.setState({ tasks: [a, b] })
      useTaskStore.getState().setFilter({ status: 'completed' })
      const { result } = await renderHook(() => useFilteredTasks())
      expect(result.current.map((t: Task) => t.id)).toEqual([b.id])
    })
  })

  describe('priority filter', () => {
    it('"all" returns every task regardless of priority', async () => {
      useTaskStore.setState({
        tasks: [makeTask({ priority: 'low' }), makeTask({ priority: 'medium' }), makeTask({ priority: 'high' })],
      })
      const { result } = await renderHook(() => useFilteredTasks())
      expect(result.current).toHaveLength(3)
    })

    it('"high" returns only high-priority tasks', async () => {
      const low = makeTask({ priority: 'low' })
      const high = makeTask({ priority: 'high' })
      useTaskStore.setState({ tasks: [low, high] })
      useTaskStore.getState().setFilter({ priority: 'high' })
      const { result } = await renderHook(() => useFilteredTasks())
      expect(result.current.map((t: Task) => t.id)).toEqual([high.id])
    })
  })

  describe('ordering', () => {
    it('orders by index ascending when sortByDueDate is false', async () => {
      const a = makeTask({ index: 3, title: 'C' })
      const b = makeTask({ index: 1, title: 'A' })
      const c = makeTask({ index: 2, title: 'B' })
      useTaskStore.setState({ tasks: [a, b, c] })
      const { result } = await renderHook(() => useFilteredTasks())
      expect(result.current.map((t: Task) => t.title)).toEqual(['A', 'B', 'C'])
    })

    it('orders by dueOn ascending when sortByDueDate is true and direction is asc', async () => {
      useTaskStore.setState({
        tasks: [
          makeTask({ dueOn: '2026-06-10', title: 'mid' }),
          makeTask({ dueOn: '2026-06-05', title: 'early' }),
          makeTask({ dueOn: '2026-06-15', title: 'late' }),
        ],
      })
      useTaskStore.getState().setFilter({ sortByDueDate: true, sortDirection: 'asc' })
      const { result } = await renderHook(() => useFilteredTasks())
      expect(result.current.map((t: Task) => t.title)).toEqual(['early', 'mid', 'late'])
    })

    it('orders by dueOn descending when sortByDueDate is true and direction is desc', async () => {
      useTaskStore.setState({
        tasks: [
          makeTask({ dueOn: '2026-06-10', title: 'mid' }),
          makeTask({ dueOn: '2026-06-05', title: 'early' }),
          makeTask({ dueOn: '2026-06-15', title: 'late' }),
        ],
      })
      useTaskStore.getState().setFilter({ sortByDueDate: true, sortDirection: 'desc' })
      const { result } = await renderHook(() => useFilteredTasks())
      expect(result.current.map((t: Task) => t.title)).toEqual(['late', 'mid', 'early'])
    })
  })

  describe('reactivity', () => {
    it('re-reads when the store changes', async () => {
      const { result } = await renderHook(() => useFilteredTasks())
      expect(result.current).toHaveLength(0)
      useTaskStore.getState().addTask({ title: 'New', dueOn: '2026-06-06', priority: 'medium' })
      await expect.poll(() => result.current).toHaveLength(1)
    })

    it('re-reads when filters change', async () => {
      const a = makeTask({ priority: 'low' })
      const b = makeTask({ priority: 'high' })
      useTaskStore.setState({ tasks: [a, b] })
      const { result } = await renderHook(() => useFilteredTasks())
      expect(result.current).toHaveLength(2)
      useTaskStore.getState().setFilter({ priority: 'high' })
      await expect.poll(() => result.current.map((t: Task) => t.id)).toEqual([b.id])
    })
  })

  describe('combined filters', () => {
    it('applies status and priority filters together (AND)', async () => {
      useTaskStore.setState({
        tasks: [
          makeTask({ completed: false, priority: 'high' }),
          makeTask({ completed: true, priority: 'high' }),
          makeTask({ completed: false, priority: 'low' }),
        ],
      })
      useTaskStore.getState().setFilter({ status: 'active', priority: 'high' })
      const { result } = await renderHook(() => useFilteredTasks())
      expect(result.current).toHaveLength(1)
      expect(result.current[0].priority).toBe('high')
      expect(result.current[0].completed).toBe(false)
    })
  })
})
