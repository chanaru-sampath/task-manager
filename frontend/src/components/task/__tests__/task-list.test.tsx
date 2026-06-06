import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'

import { TooltipProvider } from '@/components/ui/tooltip'
import type { Task } from '@/types'

import { TaskList } from '../task-list'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const mockUseTasks = vi.fn()
const mockUseDeleteTask = vi.fn()
const mockUseReorderTask = vi.fn()
const mockUseUpdateTask = vi.fn()
const mockUseCreateTask = vi.fn()

vi.mock('@/hooks/use-tasks', () => ({
  useTasks: () => mockUseTasks(),
  useDeleteTask: () => mockUseDeleteTask(),
  useReorderTask: () => mockUseReorderTask(),
  useUpdateTask: () => mockUseUpdateTask(),
  useCreateTask: () => mockUseCreateTask(),
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
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return (
    <QueryClientProvider client={client}>
      <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
    </QueryClientProvider>
  )
}

function defaultMocks() {
  mockUseTasks.mockReturnValue({ data: [], isLoading: false, isError: false })
  mockUseDeleteTask.mockReturnValue({ mutate: vi.fn() })
  mockUseReorderTask.mockReturnValue({ mutate: vi.fn() })
  mockUseUpdateTask.mockReturnValue({ mutate: vi.fn() })
}

beforeEach(() => {
  nextIndex = 1
  vi.mocked(toast.success).mockClear()
  defaultMocks()
})
afterEach(() => {
  vi.clearAllMocks()
})

describe('TaskList', () => {
  it('empty store: shows empty state and Add Task button, hides filters', async () => {
    const { getByRole, getByText, getByLabelText } = await render(<TaskList />, { wrapper: Wrapper })
    await expect.element(getByText('No tasks yet')).toBeInTheDocument()
    await expect.element(getByRole('button', { name: 'Add Task' })).toBeInTheDocument()
    expect(getByLabelText('Filter by status').query()).toBeNull()
  })

  it('with tasks: renders the list, filters, and statistics accordion', async () => {
    mockUseTasks.mockReturnValue({
      data: [makeTask({ title: 'First' })],
      isLoading: false,
      isError: false,
    })
    const { getByText, getByLabelText } = await render(<TaskList />, { wrapper: Wrapper })
    await expect.element(getByText('First')).toBeInTheDocument()
    await expect.element(getByLabelText('Filter by status')).toBeInTheDocument()
    await expect.element(getByLabelText('Filter by priority')).toBeInTheDocument()
    await expect.element(getByText('View Statistics')).toBeInTheDocument()
  })

  it('clicking "Add Task" opens the form with the Add title', async () => {
    const { getByRole, getByText } = await render(<TaskList />, { wrapper: Wrapper })
    await getByRole('button', { name: 'Add Task' }).click()
    await expect.element(getByText('Add New Task')).toBeInTheDocument()
  })

  it('loading state: shows "Loading tasks…" placeholder', async () => {
    mockUseTasks.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    const { getByText } = await render(<TaskList />, { wrapper: Wrapper })
    await expect.element(getByText('Loading tasks…')).toBeInTheDocument()
  })

  it('error state: shows the error message', async () => {
    mockUseTasks.mockReturnValue({ data: undefined, isLoading: false, isError: true, error: new Error('boom') })
    const { getByText } = await render(<TaskList />, { wrapper: Wrapper })
    await expect.element(getByText(/Failed to load tasks/)).toBeInTheDocument()
    await expect.element(getByText(/boom/)).toBeInTheDocument()
  })

  it('delete flow: row actions -> Delete -> confirm -> mutation called and toast shown', async () => {
    const target = makeTask({ title: 'To remove' })
    const other = makeTask({ title: 'To keep' })
    mockUseTasks.mockReturnValue({ data: [target, other], isLoading: false, isError: false })

    const mutate = vi.fn((_, opts?: { onSuccess?: () => void; onError?: () => void }) => {
      opts?.onSuccess?.()
    })
    mockUseDeleteTask.mockReturnValue({ mutate })

    const { getByText } = await render(<TaskList />, { wrapper: Wrapper })

    await page.getByRole('button', { name: /Actions for "To remove"/ }).click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()

    await expect.element(getByText('Delete task?')).toBeInTheDocument()
    const dialog = page.getByRole('dialog')
    await expect.element(dialog.getByText('To remove')).toBeInTheDocument()

    await page.getByRole('button', { name: 'Delete' }).click()

    expect(mutate).toHaveBeenCalledWith(target.id, expect.objectContaining({ onSuccess: expect.any(Function) }))
    expect(toast.success).toHaveBeenCalledWith('Task deleted')
  })

  it('delete flow: cancel leaves the task in place', async () => {
    const target = makeTask({ title: 'Stay' })
    mockUseTasks.mockReturnValue({ data: [target], isLoading: false, isError: false })

    const mutate = vi.fn()
    mockUseDeleteTask.mockReturnValue({ mutate })

    const { getByText } = await render(<TaskList />, { wrapper: Wrapper })
    await page.getByRole('button', { name: /Actions for "Stay"/ }).click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()
    await expect.element(getByText('Delete task?')).toBeInTheDocument()
    await page.getByRole('button', { name: 'Cancel' }).click()
    expect(mutate).not.toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()
  })
})
