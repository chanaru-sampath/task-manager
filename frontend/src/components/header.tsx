import { CheckCircle2, ListTodo } from 'lucide-react'

import { ThemeToggle } from '@/components/theme-toggle'
import { useTaskStore } from '@/store/task-store'

export function Header() {
  const completedCount = useTaskStore((s) => s.tasks.filter((t) => t.completed).length)
  const totalCount = useTaskStore((s) => s.tasks.length)

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
            <ListTodo className="size-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">Task Manager</h1>
            {totalCount > 0 ? (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="size-3" />
                <span>
                  {completedCount} of {totalCount} completed
                </span>
              </p>
            ) : null}
          </div>
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}
