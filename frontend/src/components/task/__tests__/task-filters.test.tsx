import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'

import { TooltipProvider } from '@/components/ui/tooltip'
import { useTaskStore } from '@/store/task-store'

import { TaskFilters } from '../task-filters'

function Wrapper({ children }: { children: React.ReactNode }) {
  return <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
}

function resetStore() {
  useTaskStore.setState({
    tasks: [],
    filters: { status: 'all', priority: 'all', sortByDueDate: false, sortDirection: 'asc' },
  })
  localStorage.clear()
}

beforeEach(resetStore)
afterEach(resetStore)

describe('TaskFilters', () => {
  it('renders the three filter controls', async () => {
    const { getByRole } = await render(<TaskFilters />, { wrapper: Wrapper })
    await expect.element(getByRole('combobox', { name: 'Filter by status' })).toBeInTheDocument()
    await expect.element(getByRole('combobox', { name: 'Filter by priority' })).toBeInTheDocument()
    await expect.element(getByRole('button', { name: 'Sort by due date' })).toBeInTheDocument()
  })

  it('hides the reset button when no filters are active', async () => {
    const { getByRole } = await render(<TaskFilters />, { wrapper: Wrapper })
    expect(getByRole('button', { name: 'Reset filters' }).query()).toBeNull()
  })

  it('hides the sort direction toggle when sortByDueDate is false', async () => {
    const { getByRole } = await render(<TaskFilters />, { wrapper: Wrapper })
    expect(getByRole('button', { name: /Sort (ascending|descending)/ }).query()).toBeNull()
  })

  it('clicking status option "Active" sets status filter to "active"', async () => {
    const { getByRole } = await render(<TaskFilters />, { wrapper: Wrapper })
    await getByRole('combobox', { name: 'Filter by status' }).click()
    await page.getByRole('option', { name: 'Active' }).click()
    expect(useTaskStore.getState().filters.status).toBe('active')
  })

  it('clicking priority option "High" sets priority filter to "high"', async () => {
    const { getByRole } = await render(<TaskFilters />, { wrapper: Wrapper })
    await getByRole('combobox', { name: 'Filter by priority' }).click()
    await page.getByRole('option', { name: 'High' }).click()
    expect(useTaskStore.getState().filters.priority).toBe('high')
  })

  it('clicking the sort toggle enables sortByDueDate and reveals the direction toggle', async () => {
    const { getByRole } = await render(<TaskFilters />, { wrapper: Wrapper })
    expect(getByRole('button', { name: /Sort (ascending|descending)/ }).query()).toBeNull()
    await getByRole('button', { name: 'Sort by due date' }).click()
    expect(useTaskStore.getState().filters.sortByDueDate).toBe(true)
    await expect.element(getByRole('button', { name: /Sort (ascending|descending)/ })).toBeInTheDocument()
  })

  it('clicking the direction toggle flips asc <-> desc', async () => {
    useTaskStore.setState({ filters: { status: 'all', priority: 'all', sortByDueDate: true, sortDirection: 'asc' } })
    const { getByRole } = await render(<TaskFilters />, { wrapper: Wrapper })
    await getByRole('button', { name: /Sort (ascending|descending)/ }).click()
    expect(useTaskStore.getState().filters.sortDirection).toBe('desc')
  })

  it('clicking reset restores default filters', async () => {
    useTaskStore.setState({
      filters: { status: 'completed', priority: 'high', sortByDueDate: true, sortDirection: 'desc' },
    })
    const { getByRole } = await render(<TaskFilters />, { wrapper: Wrapper })
    await getByRole('button', { name: 'Reset filters' }).click()
    expect(useTaskStore.getState().filters).toEqual({
      status: 'all',
      priority: 'all',
      sortByDueDate: false,
      sortDirection: 'asc',
    })
  })

  it('shows the reset button when at least one filter is active', async () => {
    useTaskStore.setState({
      filters: { status: 'all', priority: 'all', sortByDueDate: true, sortDirection: 'asc' },
    })
    const { getByRole } = await render(<TaskFilters />, { wrapper: Wrapper })
    await expect.element(getByRole('button', { name: 'Reset filters' })).toBeInTheDocument()
  })
})
