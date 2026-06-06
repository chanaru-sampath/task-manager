import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { useThemeStore } from '../theme-store'

function resetTheme() {
  useThemeStore.setState({ theme: 'system' })
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  document.documentElement.style.colorScheme = ''
}

beforeEach(resetTheme)
afterEach(resetTheme)

describe('useThemeStore', () => {
  it('initializes with theme="system"', () => {
    expect(useThemeStore.getState().theme).toBe('system')
  })

  it('setTheme updates the theme', () => {
    useThemeStore.getState().setTheme('dark')
    expect(useThemeStore.getState().theme).toBe('dark')
  })

  it('setTheme can switch back and forth', () => {
    useThemeStore.getState().setTheme('dark')
    useThemeStore.getState().setTheme('light')
    expect(useThemeStore.getState().theme).toBe('light')
  })
})
