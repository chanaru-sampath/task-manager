import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { TooltipProvider } from '@/components/ui/tooltip'
import type { Task } from '@/types'

import { Header } from '../header'

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
  return (
    <QueryClientProvider client={client}>
      <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  nextIndex = 1
  mockUseTasks.mockReturnValue({ data: [] })
})
afterEach(() => {
  vi.clearAllMocks()
})

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
    mockUseTasks.mockReturnValue({
      data: [makeTask({ completed: true }), makeTask({ completed: true }), makeTask({ completed: false })],
    })
    const { getByText } = await render(<Header />, { wrapper: Wrapper })
    await expect.element(getByText('2 of 3 completed')).toBeInTheDocument()
  })

  it('renders the theme toggle', async () => {
    const { getByRole } = await render(<Header />, { wrapper: Wrapper })
    await expect.element(getByRole('button', { name: 'Toggle theme' })).toBeInTheDocument()
  })
})
