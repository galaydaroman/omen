import { useMemo, useCallback } from 'react'
import { Link } from 'react-router'
import { useLocation } from 'react-router'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  HouseIcon,
  ScrollText,
  WrenchIcon,
  ChartColumnIncreasingIcon
} from 'lucide-react'

import './BottomNavigation.css'

export default function BottomNavigation() {
  const location = useLocation()

  const isHomePage = useMemo(() => {
    return location.pathname === '/'
  }, [location.pathname])

  const isHistoryPage = useMemo(() => {
    return location.pathname === '/history'
  }, [location.pathname])

  const isStatisticPage = useMemo(() => {
    return location.pathname === '/statistics'
  }, [location.pathname])

  const isDebugPage = useMemo(() => {
    return location.pathname === '/debug'
  }, [location.pathname])

  const selectedButton = useCallback((isSelected: boolean) => {
    return isSelected ? 'default' : 'ghost'
  }, [])

  return (
    <div className="absolute bottom-0 left-0 right-0 flex justify-center">
      <Card className="bottom-nav-panel flex flex-row justify-center gap-3 min-w-72 mb-4 rounded-full py-2">
        <Button variant={selectedButton(isHomePage)} className="rounded-full size-12" asChild>
          <Link to="/">
            <HouseIcon className="size-5" />
          </Link>
        </Button>

        <Separator orientation="vertical" />

        <Button variant={selectedButton(isHistoryPage)} className="rounded-full size-12" asChild>
          <Link to="/history">
            <ScrollText className="size-5" />
          </Link>
        </Button>

        <Separator orientation="vertical" />

        <Button variant={selectedButton(isStatisticPage)} className="rounded-full size-12" asChild>
          <Link to="/statistics">
            <ChartColumnIncreasingIcon className="size-5" />
          </Link>
        </Button>

        <Separator orientation="vertical" />

        <Button variant={selectedButton(isDebugPage)} className="rounded-full size-12" asChild>
          <Link to="/debug">
            <WrenchIcon  className="size-5" />
          </Link>
        </Button>
      </Card>
    </div>
  )
}
