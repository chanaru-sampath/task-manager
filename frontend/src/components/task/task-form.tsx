import { useEffect, useMemo, useRef } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type TaskFormData, newTaskFormSchema, taskFormSchema } from '@/schemas/task'
import { PRIORITY_OPTIONS, useTaskStore } from '@/store/task-store'
import type { Task } from '@/types'

interface TaskFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingTask?: Task | null
}

function getTodayString(): string {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

export function TaskForm({ open, onOpenChange, editingTask }: TaskFormProps) {
  const addTask = useTaskStore((s) => s.addTask)
  const updateTask = useTaskStore((s) => s.updateTask)
  const titleRef = useRef<HTMLInputElement>(null)

  const isEditing = !!editingTask

  const resolver = useMemo(() => zodResolver(isEditing ? taskFormSchema : newTaskFormSchema), [isEditing])

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver,
    defaultValues: {
      title: '',
      dueDate: '',
      priority: 'medium',
    },
  })

  const todayString = useMemo(() => getTodayString(), [])

  // Reset form state and focus input when modal opens
  useEffect(() => {
    if (open) {
      // Reset form
      if (editingTask) {
        reset({
          title: editingTask.title,
          dueDate: editingTask.dueDate,
          priority: editingTask.priority,
        })
      } else {
        reset({ title: '', dueDate: '', priority: 'medium' })
      }

      // Auto-focus title
      const timer = setTimeout(() => titleRef.current?.focus(), 100)
      return () => clearTimeout(timer)
    }
  }, [editingTask, open, reset])

  function onSubmit(data: TaskFormData) {
    if (isEditing) {
      updateTask(editingTask.id, data)
    } else {
      addTask(data)
    }
    onOpenChange(false)
  }

  const { ref: titleFormRef, ...titleRegister } = register('title')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Task' : 'Add New Task'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the task details below.' : 'Fill in the details to create a new task.'}
          </DialogDescription>
        </DialogHeader>

        <form id="task-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="task-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="task-title"
              type="text"
              placeholder="e.g., Review pull request"
              maxLength={100}
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'task-title-error' : undefined}
              ref={(e) => {
                titleFormRef(e)
                ;(titleRef as React.MutableRefObject<HTMLInputElement | null>).current = e
              }}
              {...titleRegister}
            />
            {/* Fix #11: Use ternary */}
            {errors.title ? (
              <p id="task-title-error" className="text-xs text-destructive">
                {errors.title.message}
              </p>
            ) : null}
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="task-due-date">
              Due Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="task-due-date"
              type="date"
              min={isEditing ? undefined : todayString}
              aria-invalid={!!errors.dueDate}
              aria-describedby={errors.dueDate ? 'task-due-date-error' : undefined}
              {...register('dueDate')}
            />
            {/* Fix #11: Use ternary */}
            {errors.dueDate ? (
              <p id="task-due-date-error" className="text-xs text-destructive">
                {errors.dueDate.message}
              </p>
            ) : null}
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="task-priority">Priority</Label>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="task-priority" className="w-full">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button id="task-form-cancel" type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button id="task-form-submit" type="submit">
              {isEditing ? 'Save Changes' : 'Add Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
