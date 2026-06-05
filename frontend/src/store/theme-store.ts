import { useEffect } from 'react'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface ThemeStore {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'task-manager-theme',
      version: 1,
    }
  )
)

/**
 * Resolves the effective theme based on the store value and system preference.
 * Applies the `.dark` class to `document.documentElement`.
 */
export function useThemeEffect() {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    const root = document.documentElement

    function applyTheme(resolvedTheme: 'light' | 'dark') {
      if (resolvedTheme === 'dark') {
        root.classList.add('dark')
        root.style.colorScheme = 'dark'
      } else {
        root.classList.remove('dark')
        root.style.colorScheme = 'light'
      }
    }

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      applyTheme(mq.matches ? 'dark' : 'light')

      const handler = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light')
      }
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }

    applyTheme(theme)
  }, [theme])
}
