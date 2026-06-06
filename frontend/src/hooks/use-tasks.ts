import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'
import type { Task } from '@/types'

const tasksQueryKey = ['tasks'] as const

export function useTasks() {
  return useQuery({
    queryKey: tasksQueryKey,
    queryFn: () => api.get<Task[]>('/tasks'),
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { title: string; dueOn: string; priority: Task['priority'] }) =>
      api.post<Task>('/tasks', input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: tasksQueryKey })
      const previous = queryClient.getQueryData<Task[]>(tasksQueryKey)
      const optimistic: Task = {
        id: `optimistic-${crypto.randomUUID()}`,
        title: input.title,
        dueOn: input.dueOn,
        priority: input.priority,
        completed: false,
        index: previous && previous.length > 0 ? Math.max(...previous.map((t) => t.index)) + 1 : 1,
      }
      queryClient.setQueryData<Task[]>(tasksQueryKey, (old) => [...(old ?? []), optimistic])
      return { previous, tempId: optimistic.id }
    },
    onError: (_err, _input, context) => {
      if (context) queryClient.setQueryData(tasksQueryKey, context.previous)
    },
    onSuccess: (created, _input, context) => {
      queryClient.setQueryData<Task[]>(tasksQueryKey, (old) => {
        if (!old) return [created]
        return old.map((t) => (t.id === context?.tempId ? created : t))
      })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: tasksQueryKey }),
  })
}

type UpdateInput = Partial<Pick<Task, 'title' | 'dueOn' | 'priority'>> & {
  completed?: boolean
  index?: number
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...updates }: UpdateInput & { id: string }) => api.patch<Task>(`/tasks/${id}`, updates),
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: tasksQueryKey })
      const previous = queryClient.getQueryData<Task[]>(tasksQueryKey)
      queryClient.setQueryData<Task[]>(tasksQueryKey, (old) =>
        (old ?? []).map((t) => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t))
      )
      return { previous }
    },
    onError: (_err, _input, context) => {
      if (context) queryClient.setQueryData(tasksQueryKey, context.previous)
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<Task[]>(tasksQueryKey, (old) =>
        (old ?? []).map((t) => (t.id === updated.id ? updated : t))
      )
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: tasksQueryKey }),
  })
}

export function useReorderTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, index }: { id: string; index: number }) => api.patch<Task>(`/tasks/${id}`, { index }),
    onMutate: async ({ id, index }) => {
      await queryClient.cancelQueries({ queryKey: tasksQueryKey })
      const previous = queryClient.getQueryData<Task[]>(tasksQueryKey)
      queryClient.setQueryData<Task[]>(tasksQueryKey, (old) =>
        (old ?? []).map((t) => (t.id === id ? { ...t, index } : t))
      )
      return { previous }
    },
    onError: (_err, _input, context) => {
      if (context) queryClient.setQueryData(tasksQueryKey, context.previous)
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<Task[]>(tasksQueryKey, (old) =>
        (old ?? []).map((t) => (t.id === updated.id ? updated : t))
      )
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: tasksQueryKey }),
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/tasks/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: tasksQueryKey })
      const previous = queryClient.getQueryData<Task[]>(tasksQueryKey)
      queryClient.setQueryData<Task[]>(tasksQueryKey, (old) => (old ?? []).filter((t) => t.id !== id))
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context) queryClient.setQueryData(tasksQueryKey, context.previous)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: tasksQueryKey }),
  })
}
