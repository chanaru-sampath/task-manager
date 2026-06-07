import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import type { Task } from '@/types'

import TaskStatistics from '../task-statistics'

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

beforeEach(() => {
  nextIndex = 1
})
afterEach(() => {
  vi.clearAllMocks()
})

describe('TaskStatistics', () => {
  it('renders nothing when there are no tasks', async () => {
    mockUseTasks.mockReturnValue({ data: [] })
    const { container } = await render(<TaskStatistics />, { wrapper: Wrapper })
    expect(container.textContent?.trim()).toBe('')
  })

  it('renders both chart cards when there are tasks', async () => {
    mockUseTasks.mockReturnValue({ data: [makeTask(), makeTask(), makeTask()] })
    const { getByText } = await render(<TaskStatistics />, { wrapper: Wrapper })
    await expect.element(getByText('Completion Status')).toBeInTheDocument()
    await expect.element(getByText('Priority Distribution')).toBeInTheDocument()
  })

  it('renders descriptions under each card title', async () => {
    mockUseTasks.mockReturnValue({ data: [makeTask()] })
    const { getByText } = await render(<TaskStatistics />, { wrapper: Wrapper })
    await expect.element(getByText('Active vs Completed tasks')).toBeInTheDocument()
    await expect.element(getByText('Task count by priority level')).toBeInTheDocument()
  })
})
