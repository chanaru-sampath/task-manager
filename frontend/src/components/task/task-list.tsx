import { useCallback, useMemo, useRef, useState } from 'react'

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useVirtualizer } from '@tanstack/react-virtual'
import { BarChart3, Info, Plus, RotateCcw } from 'lucide-react'

import { TaskEmptyState } from '@/components/task/task-empty-state'
import { TaskFilters } from '@/components/task/task-filters'
import { TaskForm } from '@/components/task/task-form'
import { TaskItem } from '@/components/task/task-item'
import { TaskStatistics } from '@/components/task/task-statistics'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { useFilteredTasks } from '@/hooks/use-filtered-tasks'
import { useTaskStore } from '@/store/task-store'
import type { Task } from '@/types'

const ESTIMATED_ITEM_HEIGHT = 76 // Estimated height of each task card + gap

function VirtualizedTaskList({
  tasks,
  onEdit,
  onToggle,
  onDelete,
  today,
  canReorder,
}: {
  tasks: Task[]
  onEdit: (task: Task) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  today: Date
  canReorder: boolean
}) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_ITEM_HEIGHT,
  })

  return (
    <div ref={parentRef} className="max-h-[calc(100vh-220px)] overflow-auto">
      <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(({ index, size, start }) => {
          const task = tasks[index]
          return (
            <div
              key={task.id}
              className="absolute left-0 top-0 w-full pb-2"
              style={{
                height: `${size}px`,
                transform: `translateY(${start}px)`,
              }}
            >
              <TaskItem
                task={task}
                onEdit={onEdit}
                onToggle={onToggle}
                onDelete={onDelete}
                today={today}
                isManualSort={canReorder}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function TaskList() {
  const hasTasks = useTaskStore((s) => s.tasks.length > 0)
  const hasFilters = useTaskStore((s) => s.filters.status !== 'all' || s.filters.priority !== 'all')

  const toggleComplete = useTaskStore((s) => s.toggleComplete)
  const deleteTask = useTaskStore((s) => s.deleteTask)
  const reorderTask = useTaskStore((s) => s.reorderTask)
  const resetFilters = useTaskStore((s) => s.resetFilters)
  const filters = useTaskStore((s) => s.filters)

  const filteredTasks = useFilteredTasks()

  const [formOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showReorderWarning, setShowReorderWarning] = useState(false)

  // Reordering is only allowed when no filters and no sort are active
  const canReorder = filters.status === 'all' && filters.priority === 'all' && !filters.sortByDueDate

  const shouldVirtualize = filteredTasks.length > 50

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const handleEdit = useCallback((task: Task) => {
    setEditingTask(task)
    setFormOpen(true)
  }, [])

  const handleFormOpenChange = useCallback((open: boolean) => {
    setFormOpen(open)
    if (!open) setEditingTask(null)
  }, [])

  const handleAddNew = useCallback(() => {
    setEditingTask(null)
    setFormOpen(true)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (!canReorder) {
        setShowReorderWarning(true)
        return
      }

      const { active, over } = event

      if (over && active.id !== over.id) {
        const oldIndex = filteredTasks.findIndex((t) => t.id === active.id)
        const newIndex = filteredTasks.findIndex((t) => t.id === over.id)

        // Calculate the new array to find the neighbors of the moved item
        const newTasks = arrayMove(filteredTasks, oldIndex, newIndex)
        const prevTask = newTasks[newIndex - 1]
        const nextTask = newTasks[newIndex + 1]

        reorderTask(active.id as string, prevTask?.index ?? null, nextTask?.index ?? null)
      }
    },
    [filteredTasks, reorderTask, canReorder]
  )

  const handleResetAndReorder = useCallback(() => {
    resetFilters()
    setShowReorderWarning(false)
  }, [resetFilters])

  const taskIds = useMemo(() => filteredTasks.map((t) => t.id), [filteredTasks])

  return (
    <>
      {/* Top bar: filters + add button */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {hasTasks ? <TaskFilters /> : null}
        <Button id="add-task-button" onClick={handleAddNew} className="shrink-0 sm:ml-auto">
          <Plus className="mr-1.5 size-4" />
          Add Task
        </Button>
      </div>

      {/* Reorder warning banner */}
      {showReorderWarning && !canReorder && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          <Info className="size-4 shrink-0 text-amber-500" />
          <span className="flex-1 text-amber-700 dark:text-amber-300">
            Remove all filters and sorting to reorder tasks.
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetAndReorder}
            className="shrink-0 border-amber-500/30 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300"
          >
            <RotateCcw className="mr-1.5 size-3" />
            Clear &amp; Reorder
          </Button>
          <button
            onClick={() => setShowReorderWarning(false)}
            className="shrink-0 text-amber-500/60 hover:text-amber-500"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* Statistics Accordion */}
      {hasTasks ? (
        <Accordion type="single" collapsible className="mb-6">
          <AccordionItem value="statistics" className="border-none">
            <AccordionTrigger className="rounded-lg border border-border bg-card px-4 py-3 hover:bg-accent hover:no-underline">
              <span className="flex items-center gap-2 text-sm font-medium">
                <BarChart3 className="size-4 text-muted-foreground" />
                View Statistics
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-1 pt-4 pb-0">
              <TaskStatistics />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : null}

      {/* Task list */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {filteredTasks.length === 0 ? (
            <TaskEmptyState hasFilters={hasFilters} />
          ) : shouldVirtualize ? (
            <VirtualizedTaskList
              tasks={filteredTasks}
              onEdit={handleEdit}
              onToggle={toggleComplete}
              onDelete={deleteTask}
              today={today}
              canReorder={canReorder}
            />
          ) : (
            <div className="space-y-2">
              {filteredTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onEdit={handleEdit}
                  onToggle={toggleComplete}
                  onDelete={deleteTask}
                  today={today}
                  isManualSort={canReorder}
                />
              ))}
            </div>
          )}
        </SortableContext>
      </DndContext>

      {/* FAB for mobile */}
      <button
        id="add-task-fab"
        onClick={handleAddNew}
        className="fixed right-5 bottom-5 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95 sm:hidden"
        aria-label="Add new task"
      >
        <Plus className="size-6" />
      </button>

      {/* Form dialog */}
      <TaskForm open={formOpen} onOpenChange={handleFormOpenChange} editingTask={editingTask} />
    </>
  )
}
