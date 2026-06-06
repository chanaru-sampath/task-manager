import { DndContext } from '@dnd-kit/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'

import { TooltipProvider } from '@/components/ui/tooltip'
import type { Task } from '@/types'

import { TaskItem } from '../task-item'

let nextIndex = 1
function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: crypto.randomUUID(),
    title: 'Review PR',
    dueOn: '2026-06-06',
    priority: 'medium',
    completed: false,
    index: nextIndex++,
    ...overrides,
  }
}

function DndWrapper({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={0}>
      <DndContext>{children}</DndContext>
    </TooltipProvider>
  )
}

beforeEach(() => {
  nextIndex = 1
})
afterEach(() => {
  nextIndex = 1
})

describe('TaskItem', () => {
  it('renders the task title, display date, and priority label', async () => {
    const task = makeTask({ title: 'Buy milk', priority: 'high' })
    const { getByText } = await render(
      <TaskItem
        task={task}
        onEdit={() => {}}
        onToggle={() => {}}
        onDeleteRequest={() => {}}
        overdue={false}
        displayDate="Today"
      />,
      { wrapper: DndWrapper }
    )
    await expect.element(getByText('Buy milk')).toBeInTheDocument()
    await expect.element(getByText('Today')).toBeInTheDocument()
    await expect.element(getByText('High')).toBeInTheDocument()
  })

  it('renders the drag handle when isManualSort is true', async () => {
    const { getByRole } = await render(
      <TaskItem
        task={makeTask()}
        onEdit={() => {}}
        onToggle={() => {}}
        onDeleteRequest={() => {}}
        overdue={false}
        displayDate="Today"
        isManualSort
      />,
      { wrapper: DndWrapper }
    )
    await expect.element(getByRole('button', { name: 'Drag to reorder' })).toBeInTheDocument()
  })

  it('hides the drag handle when isManualSort is false', async () => {
    const { getByRole } = await render(
      <TaskItem
        task={makeTask()}
        onEdit={() => {}}
        onToggle={() => {}}
        onDeleteRequest={() => {}}
        overdue={false}
        displayDate="Today"
      />,
      { wrapper: DndWrapper }
    )
    expect(getByRole('button', { name: 'Drag to reorder' }).query()).toBeNull()
  })

  it('checkbox click calls onToggle with the task id', async () => {
    const task = makeTask()
    const onToggle = vi.fn()
    const { getByRole } = await render(
      <TaskItem
        task={task}
        onEdit={() => {}}
        onToggle={onToggle}
        onDeleteRequest={() => {}}
        overdue={false}
        displayDate="Today"
      />,
      { wrapper: DndWrapper }
    )
    await getByRole('checkbox').click()
    expect(onToggle).toHaveBeenCalledWith(task.id)
  })

  it('dropdown Edit calls onEdit with the task', async () => {
    const task = makeTask()
    const onEdit = vi.fn()
    const { getByRole } = await render(
      <TaskItem
        task={task}
        onEdit={onEdit}
        onToggle={() => {}}
        onDeleteRequest={() => {}}
        overdue={false}
        displayDate="Today"
      />,
      { wrapper: DndWrapper }
    )
    await getByRole('button', { name: /Actions for/ }).click()
    await page.getByRole('menuitem', { name: 'Edit' }).click()
    expect(onEdit).toHaveBeenCalledWith(task)
  })

  it('dropdown Delete calls onDeleteRequest with the task', async () => {
    const task = makeTask()
    const onDeleteRequest = vi.fn()
    const { getByRole } = await render(
      <TaskItem
        task={task}
        onEdit={() => {}}
        onToggle={() => {}}
        onDeleteRequest={onDeleteRequest}
        overdue={false}
        displayDate="Today"
      />,
      { wrapper: DndWrapper }
    )
    await getByRole('button', { name: /Actions for/ }).click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()
    expect(onDeleteRequest).toHaveBeenCalledWith(task)
  })

  it('applies strike-through styling when task is completed', async () => {
    const task = makeTask({ completed: true, title: 'Done thing' })
    const { getByText } = await render(
      <TaskItem
        task={task}
        onEdit={() => {}}
        onToggle={() => {}}
        onDeleteRequest={() => {}}
        overdue={false}
        displayDate="Today"
      />,
      { wrapper: DndWrapper }
    )
    const titleEl = getByText('Done thing').element() as HTMLElement
    expect(titleEl.className).toContain('line-through')
  })
})
