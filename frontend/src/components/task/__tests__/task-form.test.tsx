import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import type { Task } from '@/types'

import { TaskForm } from '../task-form'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const mockUseCreateTask = vi.fn()
const mockUseUpdateTask = vi.fn()

vi.mock('@/hooks/use-tasks', () => ({
  useCreateTask: () => mockUseCreateTask(),
  useUpdateTask: () => mockUseUpdateTask(),
}))

let nextIndex = 1
function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: crypto.randomUUID(),
    title: 'Existing',
    dueOn: '2026-12-31',
    priority: 'high',
    completed: false,
    index: nextIndex++,
    ...overrides,
  }
}

function Wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

let lastCreateInput: unknown
let lastUpdateInput: unknown

beforeEach(() => {
  nextIndex = 1
  vi.mocked(toast.success).mockClear()

  mockUseCreateTask.mockReturnValue({
    mutate: (input: unknown, opts?: { onSuccess?: () => void }) => {
      lastCreateInput = input
      opts?.onSuccess?.()
    },
  })
  mockUseUpdateTask.mockReturnValue({
    mutate: (input: unknown, opts?: { onSuccess?: () => void }) => {
      lastUpdateInput = input
      opts?.onSuccess?.()
    },
  })
})
afterEach(() => {
  vi.clearAllMocks()
  lastCreateInput = undefined
  lastUpdateInput = undefined
})

function renderForm(props: { open: boolean; editingTask?: Task | null; onOpenChange?: (open: boolean) => void }) {
  const onOpenChange = props.onOpenChange ?? vi.fn()
  return render(<TaskForm open={props.open} onOpenChange={onOpenChange} editingTask={props.editingTask ?? null} />, {
    wrapper: Wrapper,
  })
}

describe('TaskForm', () => {
  it('renders "Add New Task" title in add mode', async () => {
    const { getByText } = await renderForm({ open: true })
    await expect.element(getByText('Add New Task')).toBeInTheDocument()
  })

  it('renders "Edit Task" title and pre-fills inputs in edit mode', async () => {
    const task = makeTask({ title: 'Edit me', dueOn: '2026-12-31', priority: 'high' })
    const { getByText, getByLabelText } = await renderForm({ open: true, editingTask: task })
    await expect.element(getByText('Edit Task')).toBeInTheDocument()
    await expect.poll(() => (getByLabelText('Title *').element() as HTMLInputElement).value).toBe('Edit me')
    await expect.poll(() => (getByLabelText('Due Date *').element() as HTMLInputElement).value).toBe('2026-12-31')
  })

  it('add mode: typing title, filling date, and submitting calls createTask and toasts', async () => {
    const { getByLabelText, getByRole } = await renderForm({ open: true })
    await getByLabelText('Title *').fill('Walk the dog')
    await getByLabelText('Due Date *').fill('2026-12-31')
    await getByRole('button', { name: 'Add Task' }).click()
    expect(lastCreateInput).toEqual({ title: 'Walk the dog', dueOn: '2026-12-31', priority: 'medium' })
    expect(toast.success).toHaveBeenCalledWith('Task added')
  })

  it('add mode: empty title shows a validation error and does not call create', async () => {
    const { getByLabelText, getByRole, getByText } = await renderForm({ open: true })
    await getByLabelText('Due Date *').fill('2026-12-31')
    await getByRole('button', { name: 'Add Task' }).click()
    await expect.element(getByText('Title is required')).toBeInTheDocument()
    expect(lastCreateInput).toBeUndefined()
    expect(toast.success).not.toHaveBeenCalled()
  })

  it('edit mode: submitting calls updateTask (and allows past dates)', async () => {
    const task = makeTask({ title: 'Old', dueOn: '2020-01-01', priority: 'low' })
    const { getByRole } = await renderForm({ open: true, editingTask: task })
    await getByRole('button', { name: 'Save Changes' }).click()
    expect(lastUpdateInput).toEqual({ id: task.id, title: 'Old', dueOn: '2020-01-01', priority: 'low' })
    expect(toast.success).toHaveBeenCalledWith('Task updated')
  })

  it('cancel button calls onOpenChange(false) without calling mutations', async () => {
    const onOpenChange = vi.fn()
    const { getByRole } = await renderForm({ open: true, onOpenChange })
    await getByRole('button', { name: 'Cancel' }).click()
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(lastCreateInput).toBeUndefined()
    expect(lastUpdateInput).toBeUndefined()
  })
})
