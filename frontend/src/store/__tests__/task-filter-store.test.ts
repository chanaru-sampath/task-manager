import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { PRIORITY_OPTIONS, useTaskFilterStore } from '../task-filter-store'

const DEFAULT_FILTERS = {
  status: 'all' as const,
  priority: 'all' as const,
  sortByDueDate: false,
  sortDirection: 'asc' as const,
}

function resetStore() {
  useTaskFilterStore.setState({ filters: { ...DEFAULT_FILTERS } })
}

beforeEach(resetStore)
afterEach(resetStore)

describe('useTaskFilterStore', () => {
  it('starts with default filters', () => {
    expect(useTaskFilterStore.getState().filters).toEqual(DEFAULT_FILTERS)
  })

  it('setFilter merges partial updates', () => {
    useTaskFilterStore.getState().setFilter({ status: 'active' })
    const f = useTaskFilterStore.getState().filters
    expect(f.status).toBe('active')
    expect(f.priority).toBe('all')
    expect(f.sortByDueDate).toBe(false)
    expect(f.sortDirection).toBe('asc')
  })

  it('setFilter can update multiple fields at once', () => {
    useTaskFilterStore.getState().setFilter({ priority: 'high', sortByDueDate: true, sortDirection: 'desc' })
    const f = useTaskFilterStore.getState().filters
    expect(f.priority).toBe('high')
    expect(f.sortByDueDate).toBe(true)
    expect(f.sortDirection).toBe('desc')
  })

  it('resetFilters restores defaults', () => {
    useTaskFilterStore.getState().setFilter({ status: 'completed', priority: 'high' })
    useTaskFilterStore.getState().resetFilters()
    expect(useTaskFilterStore.getState().filters).toEqual(DEFAULT_FILTERS)
  })
})

describe('PRIORITY_OPTIONS', () => {
  it('exposes low/medium/high in order', () => {
    expect(PRIORITY_OPTIONS).toEqual([
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
    ])
  })
})
