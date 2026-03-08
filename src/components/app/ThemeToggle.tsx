import { useCallback } from 'react'
import { useTheme } from '@/components/providers/ThemeProvider'
import { SunIcon, MoonIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme}>
      {
        theme === 'dark' ? <MoonIcon /> : <SunIcon />
      }
    </Button>
  )
}
