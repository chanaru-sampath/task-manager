import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from 'vitest-browser-react/pure'

import { useTaskFilterStore } from '@/store/task-filter-store'
import type { Task } from '@/types'

import { useFilteredTasks } from '../use-filtered-tasks'

const mockUseTasks = vi.fn()

vi.mock('@/hooks/use-tasks', () => ({
  useTasks: () => mockUseTasks(),
}))

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

function Wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

function resetFilters() {
  useTaskFilterStore.setState({
    filters: { status: 'all', priority: 'all', sortByDueDate: false, sortDirection: 'asc' },
  })
}

beforeEach(() => {
  nextIndex = 1
  resetFilters()
})
afterEach(() => {
  vi.clearAllMocks()
  resetFilters()
})

describe('useFilteredTasks', () => {
  it('returns an empty array when there are no tasks', async () => {
    mockUseTasks.mockReturnValue({ data: [] })
    const { result } = await renderHook(() => useFilteredTasks(), { wrapper: Wrapper })
    expect(result.current).toEqual([])
  })

  describe('status filter', () => {
    it('"all" returns every task', async () => {
      const a = makeTask({ completed: false })
      const b = makeTask({ completed: true })
      mockUseTasks.mockReturnValue({ data: [a, b] })
      const { result } = await renderHook(() => useFilteredTasks(), { wrapper: Wrapper })
      expect(result.current).toHaveLength(2)
    })

    it('"active" excludes completed tasks', async () => {
      const a = makeTask({ completed: false })
      const b = makeTask({ completed: true })
      mockUseTasks.mockReturnValue({ data: [a, b] })
      useTaskFilterStore.getState().setFilter({ status: 'active' })
      const { result } = await renderHook(() => useFilteredTasks(), { wrapper: Wrapper })
      expect(result.current.map((t) => t.id)).toEqual([a.id])
    })

    it('"completed" excludes active tasks', async () => {
      const a = makeTask({ completed: false })
      const b = makeTask({ completed: true })
      mockUseTasks.mockReturnValue({ data: [a, b] })
      useTaskFilterStore.getState().setFilter({ status: 'completed' })
      const { result } = await renderHook(() => useFilteredTasks(), { wrapper: Wrapper })
      expect(result.current.map((t) => t.id)).toEqual([b.id])
    })
  })

  describe('priority filter', () => {
    it('"all" returns every task regardless of priority', async () => {
      mockUseTasks.mockReturnValue({
        data: [makeTask({ priority: 'low' }), makeTask({ priority: 'medium' }), makeTask({ priority: 'high' })],
      })
      const { result } = await renderHook(() => useFilteredTasks(), { wrapper: Wrapper })
      expect(result.current).toHaveLength(3)
    })

    it('"high" returns only high-priority tasks', async () => {
      const low = makeTask({ priority: 'low' })
      const high = makeTask({ priority: 'high' })
      mockUseTasks.mockReturnValue({ data: [low, high] })
      useTaskFilterStore.getState().setFilter({ priority: 'high' })
      const { result } = await renderHook(() => useFilteredTasks(), { wrapper: Wrapper })
      expect(result.current.map((t) => t.id)).toEqual([high.id])
    })
  })

  describe('ordering', () => {
    it('orders by index ascending when sortByDueDate is false', async () => {
      const a = makeTask({ index: 3, title: 'C' })
      const b = makeTask({ index: 1, title: 'A' })
      const c = makeTask({ index: 2, title: 'B' })
      mockUseTasks.mockReturnValue({ data: [a, b, c] })
      const { result } = await renderHook(() => useFilteredTasks(), { wrapper: Wrapper })
      expect(result.current.map((t) => t.title)).toEqual(['A', 'B', 'C'])
    })

    it('orders by dueOn ascending when sortByDueDate is true and direction is asc', async () => {
      mockUseTasks.mockReturnValue({
        data: [
          makeTask({ dueOn: '2026-06-10', title: 'mid' }),
          makeTask({ dueOn: '2026-06-05', title: 'early' }),
          makeTask({ dueOn: '2026-06-15', title: 'late' }),
        ],
      })
      useTaskFilterStore.getState().setFilter({ sortByDueDate: true, sortDirection: 'asc' })
      const { result } = await renderHook(() => useFilteredTasks(), { wrapper: Wrapper })
      expect(result.current.map((t) => t.title)).toEqual(['early', 'mid', 'late'])
    })

    it('orders by dueOn descending when sortByDueDate is true and direction is desc', async () => {
      mockUseTasks.mockReturnValue({
        data: [
          makeTask({ dueOn: '2026-06-10', title: 'mid' }),
          makeTask({ dueOn: '2026-06-05', title: 'early' }),
          makeTask({ dueOn: '2026-06-15', title: 'late' }),
        ],
      })
      useTaskFilterStore.getState().setFilter({ sortByDueDate: true, sortDirection: 'desc' })
      const { result } = await renderHook(() => useFilteredTasks(), { wrapper: Wrapper })
      expect(result.current.map((t) => t.title)).toEqual(['late', 'mid', 'early'])
    })
  })

  describe('combined filters', () => {
    it('applies status and priority filters together (AND)', async () => {
      mockUseTasks.mockReturnValue({
        data: [
          makeTask({ completed: false, priority: 'high' }),
          makeTask({ completed: true, priority: 'high' }),
          makeTask({ completed: false, priority: 'low' }),
        ],
      })
      useTaskFilterStore.getState().setFilter({ status: 'active', priority: 'high' })
      const { result } = await renderHook(() => useFilteredTasks(), { wrapper: Wrapper })
      expect(result.current).toHaveLength(1)
      expect(result.current[0]?.priority).toBe('high')
      expect(result.current[0]?.completed).toBe(false)
    })
  })
})
