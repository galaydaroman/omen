import { useMemo } from 'react'
import { Outlet, useLocation } from 'react-router'
import { Separator } from '@/components/ui/separator'
import CreateEventDrawer from '@/components/app/CreateEventDrawer'
import './HomeLayout.css'

export default function HomeLayout() {
  const location = useLocation()
  const isHome = useMemo(() => {
    return location.pathname === '/'
  }, [location.pathname])

  return <div className="bg-background text-foreground">
    <div className="flex justify-center space-between p-5">
      <div className="flex-1 invisible"></div>
      <div className="flex-2 text-center font-bold text-2xl">
        OMEN
      </div>
      <div className="flex flex-1 justify-end">
        {
          isHome && <CreateEventDrawer />
        }
      </div>
    </div>
    <Separator />
    <div className="main">
      <Outlet />
    </div>
  </div>
}
