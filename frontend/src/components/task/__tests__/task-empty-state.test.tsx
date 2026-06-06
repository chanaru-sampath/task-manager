import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { TaskEmptyState } from '../task-empty-state'

describe('TaskEmptyState', () => {
  it('renders the empty-state wrapper with a stable id', async () => {
    const { container } = await render(<TaskEmptyState hasFilters={false} />)
    expect(container.querySelector('#task-empty-state')).not.toBeNull()
  })

  it('shows "No tasks yet" copy when no filters are active', async () => {
    const { getByText } = await render(<TaskEmptyState hasFilters={false} />)
    await expect.element(getByText('No tasks yet')).toBeInTheDocument()
    await expect.element(getByText(/Get started by adding/)).toBeInTheDocument()
  })

  it('shows "No matching tasks" copy when filters are active', async () => {
    const { getByText } = await render(<TaskEmptyState hasFilters={true} />)
    await expect.element(getByText('No matching tasks')).toBeInTheDocument()
    await expect.element(getByText(/Try adjusting/)).toBeInTheDocument()
  })
})
