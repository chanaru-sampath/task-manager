import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { Header } from '@/components/header'
import { TaskList } from '@/components/task/task-list'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useThemeEffect } from '@/store/theme-store'

const queryClient = new QueryClient()

function App() {
  useThemeEffect()

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={300}>
        <div className="min-h-screen bg-background transition-colors duration-300">
          <Header />
          <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
            <TaskList />
          </main>
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
