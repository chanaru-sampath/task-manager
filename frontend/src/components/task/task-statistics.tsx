import React, { useMemo } from 'react'

import { Bar, BarChart, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { useTasks } from '@/hooks/use-tasks'

const completionChartConfig = {
  active: {
    label: 'Active Tasks',
    color: 'var(--color-blue-500)',
  },
  completed: {
    label: 'Completed Tasks',
    color: 'var(--color-slate-400)',
  },
} satisfies ChartConfig

const priorityChartConfig = {
  low: {
    label: 'Low Priority',
    color: 'var(--color-emerald-500)',
  },
  medium: {
    label: 'Medium Priority',
    color: 'var(--color-amber-500)',
  },
  high: {
    label: 'High Priority',
    color: 'var(--color-red-500)',
  },
} satisfies ChartConfig

export const TaskStatistics = React.memo(function TaskStatistics() {
  const tasks = useTasks().data ?? []

  const { completionData, priorityData, totalTasks } = useMemo(() => {
    let completedCount = 0
    let activeCount = 0
    let lowCount = 0
    let mediumCount = 0
    let highCount = 0

    for (const task of tasks) {
      if (task.completed) completedCount++
      else activeCount++

      if (task.priority === 'low') lowCount++
      else if (task.priority === 'medium') mediumCount++
      else if (task.priority === 'high') highCount++
    }

    const completionData = [
      { name: 'active', value: activeCount, fill: 'var(--color-active)' },
      { name: 'completed', value: completedCount, fill: 'var(--color-completed)' },
    ]

    const priorityData = [
      { name: 'Low', value: lowCount, fill: 'var(--color-low)' },
      { name: 'Medium', value: mediumCount, fill: 'var(--color-medium)' },
      { name: 'High', value: highCount, fill: 'var(--color-high)' },
    ]

    return { completionData, priorityData, totalTasks: tasks.length }
  }, [tasks])

  if (totalTasks === 0) return null

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2">
      {/* Completion Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Completion Status</CardTitle>
          <CardDescription>Active vs Completed tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={completionChartConfig} className="aspect-auto h-[180px] w-full">
            <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={completionData}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={75}
                strokeWidth={2}
              >
                {completionData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="name" />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Priority Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Priority Distribution</CardTitle>
          <CardDescription>Task count by priority level</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={priorityChartConfig} className="aspect-auto h-[180px] w-full">
            <BarChart data={priorityData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" stroke="var(--color-foreground)" tickLine={false} />
              <YAxis allowDecimals={false} stroke="var(--color-foreground)" />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {priorityData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
})
