import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import VirtualizedList from '../virtualize-list'

type Item = {
  id: string
  label: string
}

const ITEMS: Item[] = [
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Beta' },
  { id: 'c', label: 'Gamma' },
]

describe('VirtualizedList', () => {
  it('renders all items via renderItem', async () => {
    const { getByText } = await render(
      <VirtualizedList
        items={ITEMS}
        getItemKey={(item) => item.id}
        renderItem={(item) => <span>{item.label}</span>}
        estimatedItemHeight={50}
        maxHeight="200px"
      />
    )
    await expect.element(getByText('Alpha')).toBeInTheDocument()
    await expect.element(getByText('Beta')).toBeInTheDocument()
    await expect.element(getByText('Gamma')).toBeInTheDocument()
  })

  it('applies maxHeight to the scroll container', async () => {
    const { container } = await render(
      <VirtualizedList
        items={ITEMS}
        getItemKey={(item) => item.id}
        renderItem={(item) => <span>{item.label}</span>}
        maxHeight="300px"
      />
    )
    const scrollContainer = container.firstElementChild as HTMLElement
    expect(scrollContainer.style.maxHeight).toBe('300px')
    expect(scrollContainer.style.overflowY).toBe('auto')
  })

  it('applies className to the scroll container', async () => {
    const { container } = await render(
      <VirtualizedList
        items={ITEMS}
        getItemKey={(item) => item.id}
        renderItem={(item) => <span>{item.label}</span>}
        className="custom-class"
      />
    )
    const scrollContainer = container.firstElementChild as HTMLElement
    expect(scrollContainer.className).toContain('custom-class')
  })
})
