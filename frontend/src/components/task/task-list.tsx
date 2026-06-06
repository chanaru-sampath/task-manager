import { useCallback, useMemo, useState } from 'react'

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
import { BarChart3, Info, Plus, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { TaskEmptyState } from '@/components/task/task-empty-state'
import { TaskFilters } from '@/components/task/task-filters'
import { TaskForm } from '@/components/task/task-form'
import { TaskItem } from '@/components/task/task-item'
import { TaskStatistics } from '@/components/task/task-statistics'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { useFilteredTasks } from '@/hooks/use-filtered-tasks'
import { useDeleteTask, useReorderTask, useTasks, useUpdateTask } from '@/hooks/use-tasks'
import { generateKeyBetween } from '@/lib/indexing'
import { formatRelative, fromIso, isBeforeLocalDate, today } from '@/lib/local-date'
import { useTaskFilterStore } from '@/store/task-filter-store'
import type { Task } from '@/types'

import { VirtualizedList } from '../virtualize-list'

const ESTIMATED_ITEM_HEIGHT = 76 // Estimated height of each task card + gap

interface TaskDisplay {
  overdue: boolean
  display: string
}

export function TaskList() {
  const tasksQuery = useTasks()
  const tasks = tasksQuery.data ?? []

  const deleteTask = useDeleteTask()
  const reorderTask = useReorderTask()
  const updateTask = useUpdateTask()

  const filters = useTaskFilterStore((s) => s.filters)
  const resetFilters = useTaskFilterStore((s) => s.resetFilters)

  const filteredTasks = useFilteredTasks()

  const hasTasks = tasks.length > 0
  const hasFilters = filters.status !== 'all' || filters.priority !== 'all'

  const [formOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deletingTask, setDeletingTask] = useState<Task | null>(null)
  const [showReorderWarning, setShowReorderWarning] = useState(false)

  const canReorder = filters.status === 'all' && filters.priority === 'all' && !filters.sortByDueDate

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

  const todayDate = useState(() => today())[0]

  const displayByTaskId = useMemo(() => {
    const map = new Map<string, TaskDisplay>()
    for (const task of filteredTasks) {
      const d = fromIso(task.dueOn)
      map.set(task.id, {
        overdue: !task.completed && isBeforeLocalDate(d, todayDate),
        display: formatRelative(d, todayDate),
      })
    }
    return map
  }, [filteredTasks, todayDate])

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setFormOpen(true)
  }

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open)
    if (!open) setEditingTask(null)
  }

  const handleAddNew = () => {
    setEditingTask(null)
    setFormOpen(true)
  }

  const handleDeleteRequest = (task: Task) => {
    setDeletingTask(task)
  }

  const handleDeleteConfirm = useCallback(() => {
    if (!deletingTask) return
    deleteTask.mutate(deletingTask.id, {
      onSuccess: () => toast.success('Task deleted'),
      onError: () => toast.error('Failed to delete task'),
    })
    setDeletingTask(null)
  }, [deletingTask, deleteTask])

  const handleDeleteDialogChange = useCallback((open: boolean) => {
    if (!open) setDeletingTask(null)
  }, [])

  const deleteDescription = useMemo(() => {
    if (!deletingTask) return null
    return (
      <>
        Are you sure you want to delete &ldquo;
        <span className="font-medium text-foreground">{deletingTask.title}</span>
        &rdquo;? This action cannot be undone.
      </>
    )
  }, [deletingTask])

  const handleToggleComplete = useCallback(
    (id: string) => {
      const task = tasks.find((t) => t.id === id)
      if (!task) return
      updateTask.mutate(
        { id, completed: !task.completed },
        {
          onError: () => toast.error('Failed to update task'),
        }
      )
    },
    [tasks, updateTask]
  )

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

        const newTasks = arrayMove(filteredTasks, oldIndex, newIndex)
        const prevTask = newTasks[newIndex - 1]
        const nextTask = newTasks[newIndex + 1]

        reorderTask.mutate({
          id: active.id as string,
          index: generateKeyBetween(prevTask?.index ?? null, nextTask?.index ?? null),
        })
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
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {hasTasks ? <TaskFilters /> : null}
        <Button id="add-task-button" onClick={handleAddNew} className="shrink-0 sm:ml-auto">
          <Plus className="mr-1.5 size-4" />
          Add Task
        </Button>
      </div>

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

      {tasksQuery.isLoading ? (
        <div className="rounded-lg border border-dashed border-border bg-card/50 px-4 py-12 text-center text-sm text-muted-foreground">
          Loading tasks…
        </div>
      ) : tasksQuery.isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-12 text-center text-sm text-destructive">
          Failed to load tasks. {(tasksQuery.error as Error)?.message ?? 'Unknown error'}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            {filteredTasks.length === 0 ? (
              <TaskEmptyState hasFilters={hasFilters} />
            ) : (
              <VirtualizedList
                items={filteredTasks}
                getItemKey={(task) => task.id}
                maxHeight="60vh"
                estimatedItemHeight={ESTIMATED_ITEM_HEIGHT}
                renderItem={(task) => {
                  const info = displayByTaskId.get(task.id) ?? { overdue: false, display: '' }
                  return (
                    <TaskItem
                      task={task}
                      onEdit={handleEdit}
                      onToggle={handleToggleComplete}
                      onDeleteRequest={handleDeleteRequest}
                      overdue={info.overdue}
                      displayDate={info.display}
                      isManualSort={canReorder}
                    />
                  )
                }}
              />
            )}
          </SortableContext>
        </DndContext>
      )}

      <button
        id="add-task-fab"
        onClick={handleAddNew}
        className="fixed right-5 bottom-5 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95 sm:hidden"
        aria-label="Add new task"
      >
        <Plus className="size-6" />
      </button>

      <TaskForm open={formOpen} onOpenChange={handleFormOpenChange} editingTask={editingTask} />

      <ConfirmDialog
        open={deletingTask !== null}
        onOpenChange={handleDeleteDialogChange}
        title="Delete task?"
        description={deleteDescription}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteConfirm}
        confirmButtonId="task-delete-confirm"
        cancelButtonId="task-delete-cancel"
      />
    </>
  )
}
