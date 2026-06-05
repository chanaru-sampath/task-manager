import { ClipboardList } from 'lucide-react'

interface TaskEmptyStateProps {
  hasFilters: boolean
}

export function TaskEmptyState({ hasFilters }: TaskEmptyStateProps) {
  return (
    <div id="task-empty-state" className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted">
        <ClipboardList className="size-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">
        {hasFilters ? 'No matching tasks' : 'No tasks yet'}
      </h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        {hasFilters
          ? 'Try adjusting your filters to see more tasks.'
          : 'Get started by adding your first task using the button above.'}
      </p>
    </div>
  )
}
