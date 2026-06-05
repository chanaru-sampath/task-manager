import { Monitor, Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useThemeStore } from '@/store/theme-store'

const THEMES = [
  { value: 'light' as const, label: 'Light', icon: Sun },
  { value: 'dark' as const, label: 'Dark', icon: Moon },
  { value: 'system' as const, label: 'System', icon: Monitor },
]

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  const currentTheme = THEMES.find((t) => t.value === theme)
  const CurrentIcon = currentTheme?.icon ?? Sun

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button id="theme-toggle" variant="ghost" size="icon" aria-label="Toggle theme">
          <CurrentIcon className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {THEMES.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            id={`theme-${value}`}
            onClick={() => setTheme(value)}
            className={theme === value ? 'bg-accent' : ''}
          >
            <Icon className="mr-2 size-4" />
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
