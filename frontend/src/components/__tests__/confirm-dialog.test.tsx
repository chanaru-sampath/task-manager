import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { ConfirmDialog } from '../confirm-dialog'

describe('ConfirmDialog', () => {
  it('renders the title and description when open', async () => {
    const { getByText } = await render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Delete task?"
        description="This cannot be undone."
        onConfirm={() => {}}
      />
    )
    await expect.element(getByText('Delete task?')).toBeInTheDocument()
    await expect.element(getByText('This cannot be undone.')).toBeInTheDocument()
  })

  it('does not render dialog content when closed', async () => {
    const { getByText } = await render(
      <ConfirmDialog open={false} onOpenChange={() => {}} title="Hidden" onConfirm={() => {}} />
    )
    expect(getByText('Hidden').query()).toBeNull()
  })

  it('omits the description when not provided', async () => {
    const { getByText, container } = await render(
      <ConfirmDialog open={true} onOpenChange={() => {}} title="No description" onConfirm={() => {}} />
    )
    await expect.element(getByText('No description')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="dialog-description"]')).toBeNull()
  })

  it('uses default confirm/cancel labels', async () => {
    const { getByRole } = await render(
      <ConfirmDialog open={true} onOpenChange={() => {}} title="Default labels" onConfirm={() => {}} />
    )
    await expect.element(getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
    await expect.element(getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('uses custom confirm and cancel labels', async () => {
    const { getByRole } = await render(
      <ConfirmDialog
        open={true}
        onOpenChange={() => {}}
        title="Custom"
        confirmLabel="Yes, delete"
        cancelLabel="Keep it"
        onConfirm={() => {}}
      />
    )
    await expect.element(getByRole('button', { name: 'Yes, delete' })).toBeInTheDocument()
    await expect.element(getByRole('button', { name: 'Keep it' })).toBeInTheDocument()
  })

  it('clicking confirm calls onConfirm and onOpenChange(false)', async () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()
    const { getByRole } = await render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        title="Confirm?"
        confirmButtonId="my-confirm"
        onConfirm={onConfirm}
      />
    )
    await getByRole('button', { name: 'Confirm' }).click()
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('clicking cancel calls onOpenChange(false) and NOT onConfirm', async () => {
    const onConfirm = vi.fn()
    const onOpenChange = vi.fn()
    const { getByRole } = await render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        title="Confirm?"
        cancelButtonId="my-cancel"
        onConfirm={onConfirm}
      />
    )
    await getByRole('button', { name: 'Cancel' }).click()
    expect(onConfirm).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('uses the destructive button variant when destructive=true', async () => {
    const { getByRole } = await render(
      <ConfirmDialog open={true} onOpenChange={() => {}} title="Destructive" destructive onConfirm={() => {}} />
    )
    await expect.element(getByRole('button', { name: 'Confirm' })).toHaveAttribute('data-variant', 'destructive')
  })
})
