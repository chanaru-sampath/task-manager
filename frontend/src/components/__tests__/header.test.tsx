import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { TooltipProvider } from '@/components/ui/tooltip'
import { useTaskStore } from '@/store/task-store'
import type { Task } from '@/types'

import Header from '../header'

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
})
afterEach(resetStore)

describe('Header', () => {
  it('renders the app title', async () => {
    const { getByText } = await render(<Header />, { wrapper: Wrapper })
    await expect.element(getByText('Task Manager')).toBeInTheDocument()
  })

  it('hides the progress line when there are no tasks', async () => {
    const { container } = await render(<Header />, { wrapper: Wrapper })
    expect(container.textContent).not.toMatch(/of \d+ completed/)
  })

  it('shows "X of Y completed" when there are tasks', async () => {
    useTaskStore.setState({
      tasks: [makeTask({ completed: true }), makeTask({ completed: true }), makeTask({ completed: false })],
    })
    const { getByText } = await render(<Header />, { wrapper: Wrapper })
    await expect.element(getByText('2 of 3 completed')).toBeInTheDocument()
  })

  it('renders the theme toggle', async () => {
    const { getByRole } = await render(<Header />, { wrapper: Wrapper })
    await expect.element(getByRole('button', { name: 'Toggle theme' })).toBeInTheDocument()
  })
})
