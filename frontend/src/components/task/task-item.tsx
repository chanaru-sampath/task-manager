import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Calendar, GripVertical, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { Task } from '@/types'

type TaskItemProps = {
  task: Task
  onEdit: (task: Task) => void
  onToggle: (id: string) => void
  onDeleteRequest: (task: Task) => void
  overdue: boolean
  displayDate: string
  isManualSort?: boolean
}

const PRIORITY_CONFIG = {
  low: {
    label: 'Low',
    className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  medium: {
    label: 'Medium',
    className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  high: {
    label: 'High',
    className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  },
} as const

function TaskItem({ task, onEdit, onToggle, onDeleteRequest, overdue, displayDate, isManualSort }: TaskItemProps) {
  const priorityConfig = PRIORITY_CONFIG[task.priority]

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: !isManualSort,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? { zIndex: 50, opacity: 0.5 } : {}),
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      id={`task-${task.id}`}
      className={cn(
        'group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors duration-200',
        'hover:border-border/80 hover:shadow-sm',
        task.completed && 'opacity-60'
      )}
    >
      {isManualSort && (
        <button
          className="cursor-grab text-muted-foreground/50 hover:text-foreground focus:outline-none active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-5" />
        </button>
      )}

      <Checkbox
        id={`task-checkbox-${task.id}`}
        checked={task.completed}
        onCheckedChange={() => onToggle(task.id)}
        aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
        className="shrink-0"
      />

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'truncate text-sm font-medium text-foreground transition-all',
            task.completed && 'line-through text-muted-foreground'
          )}
        >
          {task.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 text-xs text-muted-foreground',
              overdue && 'font-medium text-red-500 dark:text-red-400'
            )}
          >
            <Calendar className="size-3" />
            {displayDate}
          </span>
          <Badge variant="outline" className={cn('text-[10px] uppercase tracking-wider', priorityConfig.className)}>
            {priorityConfig.label}
          </Badge>
        </div>
      </div>

      <div className="shrink-0">
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  id={`task-actions-${task.id}`}
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Actions for "${task.title}"`}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Actions</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end">
            <DropdownMenuItem id={`task-edit-${task.id}`} onClick={() => onEdit(task)}>
              <Pencil className="mr-2 size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              id={`task-delete-${task.id}`}
              onClick={() => onDeleteRequest(task)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default TaskItem
