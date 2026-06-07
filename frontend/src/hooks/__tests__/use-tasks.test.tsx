import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from 'vitest-browser-react/pure'

import { api } from '@/lib/api'
import type { Task } from '@/types'

import { useCreateTask, useDeleteTask, useReorderTask, useTasks, useUpdateTask } from '../use-tasks'

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

const mockedApi = vi.mocked(api)
const tasksKey = ['tasks'] as const

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

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function makeWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

beforeEach(() => {
  nextIndex = 1
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('useTasks', () => {
  it('fetches tasks from GET /tasks and returns the data', async () => {
    const tasks = [makeTask({ title: 'A' }), makeTask({ title: 'B' })]
    mockedApi.get.mockResolvedValue(tasks)

    const client = makeClient()
    const { result } = await renderHook(() => useTasks(), { wrapper: makeWrapper(client) })

    await vi.waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(mockedApi.get).toHaveBeenCalledWith('/tasks')
    expect(result.current.data).toEqual(tasks)
  })

  it('exposes the error state when the request fails', async () => {
    mockedApi.get.mockRejectedValue(new Error('boom'))

    const client = makeClient()
    const { result } = await renderHook(() => useTasks(), { wrapper: makeWrapper(client) })

    await vi.waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeInstanceOf(Error)
    expect((result.current.error as Error).message).toBe('boom')
  })
})

describe('useCreateTask', () => {
  it('calls POST /tasks with the provided input', async () => {
    const created = makeTask({ title: 'New', dueOn: '2026-07-01', priority: 'high' })
    mockedApi.post.mockResolvedValue(created)

    const client = makeClient()
    const { result } = await renderHook(() => useCreateTask(), { wrapper: makeWrapper(client) })

    await result.current.mutateAsync({ title: 'New', dueOn: '2026-07-01', priority: 'high' })

    expect(mockedApi.post).toHaveBeenCalledWith('/tasks', {
      title: 'New',
      dueOn: '2026-07-01',
      priority: 'high',
    })
  })

  it('optimistically appends a task with index 1 when the cache is empty', async () => {
    const created = makeTask({ title: 'First', index: 1 })
    let resolvePost: (task: Task) => void = () => {}
    mockedApi.post.mockReturnValue(new Promise<Task>((res) => (resolvePost = res)))

    const client = makeClient()
    client.setQueryData<Task[]>(tasksKey, [])
    const { result } = await renderHook(() => useCreateTask(), { wrapper: makeWrapper(client) })

    result.current.mutate({ title: 'First', dueOn: '2026-07-01', priority: 'low' })

    await vi.waitFor(() => {
      const cache = client.getQueryData<Task[]>(tasksKey)
      expect(cache).toHaveLength(1)
    })

    const optimistic = client.getQueryData<Task[]>(tasksKey)![0]!
    expect(optimistic.id.startsWith('optimistic-')).toBe(true)
    expect(optimistic.title).toBe('First')
    expect(optimistic.dueOn).toBe('2026-07-01')
    expect(optimistic.priority).toBe('low')
    expect(optimistic.completed).toBe(false)
    expect(optimistic.index).toBe(1)

    resolvePost(created)
  })

  it('optimistic index is one more than the current max index', async () => {
    const existing = [makeTask({ index: 3 }), makeTask({ index: 7 }), makeTask({ index: 5 })]
    let resolvePost: (task: Task) => void = () => {}
    mockedApi.post.mockReturnValue(new Promise<Task>((res) => (resolvePost = res)))

    const client = makeClient()
    client.setQueryData<Task[]>(tasksKey, existing)
    const { result } = await renderHook(() => useCreateTask(), { wrapper: makeWrapper(client) })

    result.current.mutate({ title: 'Next', dueOn: '2026-07-01', priority: 'medium' })

    await vi.waitFor(() => {
      const cache = client.getQueryData<Task[]>(tasksKey)
      expect(cache).toHaveLength(4)
    })

    const cache = client.getQueryData<Task[]>(tasksKey)!
    expect(cache[3]!.index).toBe(8)

    resolvePost(makeTask({ index: 8 }))
  })

  it('replaces the optimistic task with the server-created task on success', async () => {
    const created: Task = {
      id: 'server-id',
      title: 'Persisted',
      dueOn: '2026-07-01',
      priority: 'high',
      completed: false,
      index: 1,
    }
    mockedApi.post.mockResolvedValue(created)

    const client = makeClient()
    client.setQueryData<Task[]>(tasksKey, [])
    const { result } = await renderHook(() => useCreateTask(), { wrapper: makeWrapper(client) })

    await result.current.mutateAsync({ title: 'Persisted', dueOn: '2026-07-01', priority: 'high' })

    const cache = client.getQueryData<Task[]>(tasksKey)!
    expect(cache).toHaveLength(1)
    expect(cache[0]).toEqual(created)
    expect(cache[0]!.id.startsWith('optimistic-')).toBe(false)
  })

  it('rolls back to the previous cache on error', async () => {
    const existing = [makeTask({ title: 'Existing' })]
    mockedApi.post.mockRejectedValue(new Error('nope'))

    const client = makeClient()
    client.setQueryData<Task[]>(tasksKey, existing)
    const { result } = await renderHook(() => useCreateTask(), { wrapper: makeWrapper(client) })

    await expect(result.current.mutateAsync({ title: 'Bad', dueOn: '2026-07-01', priority: 'low' })).rejects.toThrow(
      'nope'
    )

    expect(client.getQueryData<Task[]>(tasksKey)).toEqual(existing)
  })

  it('invalidates the tasks query after the mutation settles', async () => {
    mockedApi.post.mockResolvedValue(makeTask())

    const client = makeClient()
    client.setQueryData<Task[]>(tasksKey, [])
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const { result } = await renderHook(() => useCreateTask(), { wrapper: makeWrapper(client) })

    await result.current.mutateAsync({ title: 'x', dueOn: '2026-07-01', priority: 'low' })

    expect(invalidate).toHaveBeenCalledWith({ queryKey: tasksKey })
  })
})

describe('useUpdateTask', () => {
  it('calls PATCH /tasks/{id} with only the update fields', async () => {
    const target = makeTask({ title: 'Before' })
    const updated: Task = { ...target, title: 'After' }
    mockedApi.patch.mockResolvedValue(updated)

    const client = makeClient()
    client.setQueryData<Task[]>(tasksKey, [target])
    const { result } = await renderHook(() => useUpdateTask(), { wrapper: makeWrapper(client) })

    await result.current.mutateAsync({ id: target.id, title: 'After' })

    expect(mockedApi.patch).toHaveBeenCalledWith(`/tasks/${target.id}`, { title: 'After' })
  })

  it('optimistically applies updates to the matching task', async () => {
    const a = makeTask({ title: 'A', completed: false })
    const b = makeTask({ title: 'B', completed: false })
    let resolvePatch: (task: Task) => void = () => {}
    mockedApi.patch.mockReturnValue(new Promise<Task>((res) => (resolvePatch = res)))

    const client = makeClient()
    client.setQueryData<Task[]>(tasksKey, [a, b])
    const { result } = await renderHook(() => useUpdateTask(), { wrapper: makeWrapper(client) })

    result.current.mutate({ id: a.id, completed: true, priority: 'high' })

    await vi.waitFor(() => {
      const cache = client.getQueryData<Task[]>(tasksKey)!
      expect(cache.find((t) => t.id === a.id)!.completed).toBe(true)
    })

    const cache = client.getQueryData<Task[]>(tasksKey)!
    const updated = cache.find((t) => t.id === a.id)!
    expect(updated.priority).toBe('high')
    expect(cache.find((t) => t.id === b.id)).toEqual(b)

    resolvePatch({ ...a, completed: true, priority: 'high' })
  })

  it('replaces the optimistic task with the server response on success', async () => {
    const target = makeTask({ title: 'Old' })
    const serverResponse: Task = { ...target, title: 'Server', priority: 'high' }
    mockedApi.patch.mockResolvedValue(serverResponse)

    const client = makeClient()
    client.setQueryData<Task[]>(tasksKey, [target])
    const { result } = await renderHook(() => useUpdateTask(), { wrapper: makeWrapper(client) })

    await result.current.mutateAsync({ id: target.id, title: 'Server', priority: 'high' })

    expect(client.getQueryData<Task[]>(tasksKey)).toEqual([serverResponse])
  })

  it('rolls back to the previous cache on error', async () => {
    const target = makeTask({ title: 'Stable' })
    const snapshot = [target]
    mockedApi.patch.mockRejectedValue(new Error('fail'))

    const client = makeClient()
    client.setQueryData<Task[]>(tasksKey, snapshot)
    const { result } = await renderHook(() => useUpdateTask(), { wrapper: makeWrapper(client) })

    await expect(result.current.mutateAsync({ id: target.id, title: 'Broken' })).rejects.toThrow('fail')

    expect(client.getQueryData<Task[]>(tasksKey)).toEqual(snapshot)
  })

  it('invalidates the tasks query after settling', async () => {
    const target = makeTask()
    mockedApi.patch.mockResolvedValue(target)

    const client = makeClient()
    client.setQueryData<Task[]>(tasksKey, [target])
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const { result } = await renderHook(() => useUpdateTask(), { wrapper: makeWrapper(client) })

    await result.current.mutateAsync({ id: target.id, title: 'x' })

    expect(invalidate).toHaveBeenCalledWith({ queryKey: tasksKey })
  })
})

describe('useReorderTask', () => {
  it('calls PATCH /tasks/{id} with the new index only', async () => {
    const target = makeTask({ index: 1 })
    mockedApi.patch.mockResolvedValue({ ...target, index: 5 })

    const client = makeClient()
    client.setQueryData<Task[]>(tasksKey, [target])
    const { result } = await renderHook(() => useReorderTask(), { wrapper: makeWrapper(client) })

    await result.current.mutateAsync({ id: target.id, index: 5 })

    expect(mockedApi.patch).toHaveBeenCalledWith(`/tasks/${target.id}`, { index: 5 })
  })

  it('optimistically updates the index of the matching task', async () => {
    const a = makeTask({ index: 1 })
    const b = makeTask({ index: 2 })
    let resolvePatch: (task: Task) => void = () => {}
    mockedApi.patch.mockReturnValue(new Promise<Task>((res) => (resolvePatch = res)))

    const client = makeClient()
    client.setQueryData<Task[]>(tasksKey, [a, b])
    const { result } = await renderHook(() => useReorderTask(), { wrapper: makeWrapper(client) })

    result.current.mutate({ id: a.id, index: 10 })

    await vi.waitFor(() => {
      const cache = client.getQueryData<Task[]>(tasksKey)!
      expect(cache.find((t) => t.id === a.id)!.index).toBe(10)
    })

    expect(client.getQueryData<Task[]>(tasksKey)!.find((t) => t.id === b.id)).toEqual(b)

    resolvePatch({ ...a, index: 10 })
  })

  it('replaces the optimistic task with the server response on success', async () => {
    const target = makeTask({ index: 1 })
    const serverResponse: Task = { ...target, index: 4.5 }
    mockedApi.patch.mockResolvedValue(serverResponse)

    const client = makeClient()
    client.setQueryData<Task[]>(tasksKey, [target])
    const { result } = await renderHook(() => useReorderTask(), { wrapper: makeWrapper(client) })

    await result.current.mutateAsync({ id: target.id, index: 4.5 })

    expect(client.getQueryData<Task[]>(tasksKey)).toEqual([serverResponse])
  })

  it('rolls back to the previous cache on error', async () => {
    const target = makeTask({ index: 2 })
    const snapshot = [target]
    mockedApi.patch.mockRejectedValue(new Error('reorder failed'))

    const client = makeClient()
    client.setQueryData<Task[]>(tasksKey, snapshot)
    const { result } = await renderHook(() => useReorderTask(), { wrapper: makeWrapper(client) })

    await expect(result.current.mutateAsync({ id: target.id, index: 99 })).rejects.toThrow('reorder failed')

    expect(client.getQueryData<Task[]>(tasksKey)).toEqual(snapshot)
  })

  it('invalidates the tasks query after settling', async () => {
    const target = makeTask()
    mockedApi.patch.mockResolvedValue(target)

    const client = makeClient()
    client.setQueryData<Task[]>(tasksKey, [target])
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const { result } = await renderHook(() => useReorderTask(), { wrapper: makeWrapper(client) })

    await result.current.mutateAsync({ id: target.id, index: 9 })

    expect(invalidate).toHaveBeenCalledWith({ queryKey: tasksKey })
  })
})

describe('useDeleteTask', () => {
  it('calls DELETE /tasks/{id}', async () => {
    const target = makeTask()
    mockedApi.delete.mockResolvedValue(undefined)

    const client = makeClient()
    client.setQueryData<Task[]>(tasksKey, [target])
    const { result } = await renderHook(() => useDeleteTask(), { wrapper: makeWrapper(client) })

    await result.current.mutateAsync(target.id)

    expect(mockedApi.delete).toHaveBeenCalledWith(`/tasks/${target.id}`)
  })

  it('optimistically removes the task from the cache', async () => {
    const a = makeTask({ title: 'Keep' })
    const b = makeTask({ title: 'Remove' })
    let resolveDelete: () => void = () => {}
    mockedApi.delete.mockReturnValue(new Promise<void>((res) => (resolveDelete = res)))

    const client = makeClient()
    client.setQueryData<Task[]>(tasksKey, [a, b])
    const { result } = await renderHook(() => useDeleteTask(), { wrapper: makeWrapper(client) })

    result.current.mutate(b.id)

    await vi.waitFor(() => {
      const cache = client.getQueryData<Task[]>(tasksKey)!
      expect(cache).toHaveLength(1)
    })
    expect(client.getQueryData<Task[]>(tasksKey)).toEqual([a])

    resolveDelete()
  })

  it('rolls back to the previous cache on error', async () => {
    const target = makeTask({ title: 'Cant delete' })
    const snapshot = [target]
    mockedApi.delete.mockRejectedValue(new Error('delete failed'))

    const client = makeClient()
    client.setQueryData<Task[]>(tasksKey, snapshot)
    const { result } = await renderHook(() => useDeleteTask(), { wrapper: makeWrapper(client) })

    await expect(result.current.mutateAsync(target.id)).rejects.toThrow('delete failed')

    expect(client.getQueryData<Task[]>(tasksKey)).toEqual(snapshot)
  })

  it('invalidates the tasks query after settling', async () => {
    const target = makeTask()
    mockedApi.delete.mockResolvedValue(undefined)

    const client = makeClient()
    client.setQueryData<Task[]>(tasksKey, [target])
    const invalidate = vi.spyOn(client, 'invalidateQueries')
    const { result } = await renderHook(() => useDeleteTask(), { wrapper: makeWrapper(client) })

    await result.current.mutateAsync(target.id)

    expect(invalidate).toHaveBeenCalledWith({ queryKey: tasksKey })
  })
})
