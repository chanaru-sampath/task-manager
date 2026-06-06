import { useRef } from 'react'

import { useVirtualizer } from '@tanstack/react-virtual'

interface VirtualizedListProps<T> {
  items: T[]
  getItemKey: (item: T) => string | number
  renderItem: (item: T, index: number) => React.ReactNode
  estimatedItemHeight?: number
  itemGap?: number
  maxHeight?: string
  className?: string
}

export function VirtualizedList<T>({
  items,
  getItemKey,
  renderItem,
  estimatedItemHeight = 60,
  itemGap = 8,
  maxHeight = '100vh',
  className,
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedItemHeight + itemGap,
    getItemKey: (index) => getItemKey(items[index]),
  })

  return (
    <div ref={parentRef} className={className} style={{ maxHeight, overflowY: 'auto' }}>
      {/* The total scrollable height */}
      <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(({ index, size, start, key }) => (
          <div
            key={key}
            className="absolute left-0 top-0 w-full"
            style={{
              height: `${size}px`,
              transform: `translateY(${start}px)`,
              paddingBottom: itemGap,
            }}
          >
            {renderItem(items[index], index)}
          </div>
        ))}
      </div>
    </div>
  )
}
