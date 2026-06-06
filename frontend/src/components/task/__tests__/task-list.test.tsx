import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'

import { TooltipProvider } from '@/components/ui/tooltip'
import { useTaskStore } from '@/store/task-store'
import type { Task } from '@/types'

import { TaskList } from '../task-list'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
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
  return <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
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
  vi.mocked(toast.success).mockClear()
})
afterEach(resetStore)

describe('TaskList', () => {
  it('empty store: shows empty state and Add Task button, hides filters', async () => {
    const { getByRole, getByText, getByLabelText } = await render(<TaskList />, { wrapper: Wrapper })
    await expect.element(getByText('No tasks yet')).toBeInTheDocument()
    await expect.element(getByRole('button', { name: 'Add Task' })).toBeInTheDocument()
    expect(getByLabelText('Filter by status').query()).toBeNull()
  })

  it('with tasks: renders the list, filters, and statistics accordion', async () => {
    useTaskStore.setState({ tasks: [makeTask({ title: 'First' })] })
    const { getByText, getByLabelText } = await render(<TaskList />, { wrapper: Wrapper })
    await expect.element(getByText('First')).toBeInTheDocument()
    await expect.element(getByLabelText('Filter by status')).toBeInTheDocument()
    await expect.element(getByLabelText('Filter by priority')).toBeInTheDocument()
    // Statistics accordion is collapsed by default; trigger is visible
    await expect.element(getByText('View Statistics')).toBeInTheDocument()
  })

  it('clicking "Add Task" opens the form with the Add title', async () => {
    const { getByRole, getByText } = await render(<TaskList />, { wrapper: Wrapper })
    await getByRole('button', { name: 'Add Task' }).click()
    await expect.element(getByText('Add New Task')).toBeInTheDocument()
  })

  it('add flow: fill the form, submit, task is added and toast is shown', async () => {
    const { getByRole, getByLabelText, getByText } = await render(<TaskList />, { wrapper: Wrapper })
    await getByRole('button', { name: 'Add Task' }).click()
    await getByLabelText('Title *').fill('Buy groceries')
    await getByLabelText('Due Date *').fill('2026-12-31')
    await getByRole('button', { name: 'Add Task' }).click()
    const tasks = useTaskStore.getState().tasks
    expect(tasks).toHaveLength(1)
    expect(tasks[0].title).toBe('Buy groceries')
    expect(toast.success).toHaveBeenCalledWith('Task added')
    // New task is rendered
    await expect.element(getByText('Buy groceries')).toBeInTheDocument()
  })

  it('delete flow: row actions -> Delete -> confirm -> task removed and toast is shown', async () => {
    const target = makeTask({ title: 'To remove' })
    const other = makeTask({ title: 'To keep' })
    useTaskStore.setState({ tasks: [target, other] })
    const { getByText } = await render(<TaskList />, { wrapper: Wrapper })

    // Open the actions dropdown for the target row
    await page.getByRole('button', { name: /Actions for "To remove"/ }).click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()

    // Confirm dialog opens with the task title
    await expect.element(getByText('Delete task?')).toBeInTheDocument()
    // The title appears in the row AND the dialog description; check the dialog directly
    const dialog = page.getByRole('dialog')
    await expect.element(dialog.getByText('To remove')).toBeInTheDocument()

    // Confirm (the dialog's confirm button is the only "Delete" button — the row's Delete was a menuitem, now closed)
    await page.getByRole('button', { name: 'Delete' }).click()

    const remaining = useTaskStore.getState().tasks
    expect(remaining).toHaveLength(1)
    expect(remaining[0].id).toBe(other.id)
    expect(toast.success).toHaveBeenCalledWith('Task deleted')
  })

  it('delete flow: cancel leaves the task in the store', async () => {
    const target = makeTask({ title: 'Stay' })
    useTaskStore.setState({ tasks: [target] })
    const { getByText } = await render(<TaskList />, { wrapper: Wrapper })
    await page.getByRole('button', { name: /Actions for "Stay"/ }).click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()
    await expect.element(getByText('Delete task?')).toBeInTheDocument()
    await page.getByRole('button', { name: 'Cancel' }).click()
    expect(useTaskStore.getState().tasks).toHaveLength(1)
    expect(toast.success).not.toHaveBeenCalled()
  })
})
