import { ArrowDownUp, ArrowDownWideNarrow, ArrowUpNarrowWide, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useTaskFilterStore } from '@/store/task-filter-store'
import type { Priority } from '@/types'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Tasks' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
] as const

const PRIORITY_FILTER_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
] as const

export function TaskFilters() {
  const filters = useTaskFilterStore((s) => s.filters)
  const setFilter = useTaskFilterStore((s) => s.setFilter)
  const resetFilters = useTaskFilterStore((s) => s.resetFilters)

  const hasActiveFilters = filters.status !== 'all' || filters.priority !== 'all' || filters.sortByDueDate

  return (
    <div className="mb-2 sm:mb-0 flex flex-wrap items-center gap-2">
      {/* Status filter */}
      <Select value={filters.status} onValueChange={(v) => setFilter({ status: v as 'all' | 'completed' | 'active' })}>
        <SelectTrigger id="filter-status" className="w-[140px]" aria-label="Filter by status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map(({ value, label }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Priority filter */}
      <Select value={filters.priority} onValueChange={(v) => setFilter({ priority: v as Priority | 'all' })}>
        <SelectTrigger id="filter-priority" className="w-[150px]" aria-label="Filter by priority">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRIORITY_FILTER_OPTIONS.map(({ value, label }) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sort by due date toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            id="sort-due-date"
            variant={filters.sortByDueDate ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter({ sortByDueDate: !filters.sortByDueDate })}
            aria-label={filters.sortByDueDate ? 'Remove due date sort' : 'Sort by due date'}
          >
            <ArrowDownUp className="mr-1.5 size-3.5" />
            Due Date
          </Button>
        </TooltipTrigger>
        <TooltipContent>{filters.sortByDueDate ? 'Click to remove due date sort' : 'Sort by due date'}</TooltipContent>
      </Tooltip>

      {/* Sort direction toggle (only when sorting by due date) */}
      {filters.sortByDueDate && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              id="sort-direction"
              variant="outline"
              size="icon"
              onClick={() => setFilter({ sortDirection: filters.sortDirection === 'asc' ? 'desc' : 'asc' })}
              aria-label={`Sort ${filters.sortDirection === 'asc' ? 'descending' : 'ascending'}`}
            >
              {filters.sortDirection === 'asc' ? (
                <ArrowUpNarrowWide className="size-4" />
              ) : (
                <ArrowDownWideNarrow className="size-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <span className="flex items-center gap-1.5">
              <ArrowDownUp className="size-3" />
              Due date: {filters.sortDirection === 'asc' ? 'earliest first' : 'latest first'}
            </span>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Reset filters */}
      {hasActiveFilters && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button id="reset-filters" variant="ghost" size="icon-sm" onClick={resetFilters} aria-label="Reset filters">
              <RotateCcw className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reset filters</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
