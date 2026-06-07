import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'

import { TooltipProvider } from '@/components/ui/tooltip'
import { useThemeStore } from '@/store/theme-store'

import ThemeToggle from '../theme-toggle'

function Wrapper({ children }: { children: React.ReactNode }) {
  return <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
}

function resetTheme() {
  useThemeStore.setState({ theme: 'system' })
  localStorage.clear()
}

beforeEach(resetTheme)
afterEach(resetTheme)

async function openMenu(view: Awaited<ReturnType<typeof render>>) {
  await view.getByRole('button', { name: 'Toggle theme' }).click()

  await expect.element(page.getByText('Light', { exact: true })).toBeVisible()
  await expect.element(page.getByText('Dark', { exact: true })).toBeVisible()
  await expect.element(page.getByText('System', { exact: true })).toBeVisible()
}

describe('ThemeToggle', () => {
  it('renders the toggle trigger button', async () => {
    const view = await render(<ThemeToggle />, { wrapper: Wrapper })
    await expect.element(view.getByRole('button', { name: 'Toggle theme' })).toBeInTheDocument()
  })

  it('opens the dropdown with all three options', async () => {
    const view = await render(<ThemeToggle />, { wrapper: Wrapper })
    await openMenu(view)
  })

  it('clicking "Dark" sets the theme store to "dark"', async () => {
    const view = await render(<ThemeToggle />, { wrapper: Wrapper })
    await openMenu(view)
    await page.getByText('Dark', { exact: true }).click()
    expect(useThemeStore.getState().theme).toBe('dark')
  })

  it('clicking "Light" sets the theme store to "light"', async () => {
    useThemeStore.setState({ theme: 'dark' })
    const view = await render(<ThemeToggle />, { wrapper: Wrapper })
    await openMenu(view)
    await page.getByText('Light', { exact: true }).click()
    expect(useThemeStore.getState().theme).toBe('light')
  })

  it('clicking "System" sets the theme store to "system"', async () => {
    useThemeStore.setState({ theme: 'dark' })
    const view = await render(<ThemeToggle />, { wrapper: Wrapper })
    await openMenu(view)
    await page.getByText('System', { exact: true }).click()
    expect(useThemeStore.getState().theme).toBe('system')
  })
})
