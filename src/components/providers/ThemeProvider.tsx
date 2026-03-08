import { useState, useEffect, useCallback, createContext, useContext } from 'react'

export type Theme = 'light' | 'dark'

interface ThemeProviderProps {
  children: React.ReactNode,
  defaultTheme?: Theme,
  storageKey: string
}

interface ThemeProviderState {
  theme: Theme,
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: 'light',
  setTheme: () => null
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

function detectSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function ThemeProvider({
  children,
  defaultTheme,
  storageKey,
  ...props
}: ThemeProviderProps) {
  const [theme, _setTheme] = useState<Theme>(() => {
    const storageTheme = localStorage.getItem(storageKey) as Theme
    return storageTheme || defaultTheme || detectSystemTheme()
  })

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('dark', 'light')
    root.classList.add(theme)
  }, [theme])

  const setTheme = useCallback((theme: Theme) => {
    localStorage.setItem(storageKey, theme)
    _setTheme(theme)
  }, [storageKey])

  const value: ThemeProviderState = {
    theme,
    setTheme
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

/* eslint-disable-next-line react-refresh/only-export-components */
export function useTheme(): ThemeProviderState {
  const context = useContext(ThemeProviderContext)

  if (!context) {
    throw new Error('ThemeProvider is not defined')
  }

  return context
}
