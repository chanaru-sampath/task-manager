import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { useTaskStore } from '@/store/task-store'
import type { Task } from '@/types'

import TaskStatistics from '../task-statistics'

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

describe('TaskStatistics', () => {
  it('renders nothing when there are no tasks', async () => {
    const { container } = await render(<TaskStatistics />)
    expect(container.textContent?.trim()).toBe('')
  })

  it('renders both chart cards when there are tasks', async () => {
    useTaskStore.setState({ tasks: [makeTask(), makeTask(), makeTask()] })
    const { getByText } = await render(<TaskStatistics />)
    await expect.element(getByText('Completion Status')).toBeInTheDocument()
    await expect.element(getByText('Priority Distribution')).toBeInTheDocument()
  })

  it('renders descriptions under each card title', async () => {
    useTaskStore.setState({ tasks: [makeTask()] })
    const { getByText } = await render(<TaskStatistics />)
    await expect.element(getByText('Active vs Completed tasks')).toBeInTheDocument()
    await expect.element(getByText('Task count by priority level')).toBeInTheDocument()
  })
})
