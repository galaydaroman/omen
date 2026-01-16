import { useMemo } from 'react'
import { Outlet, useLocation, Link } from 'react-router'
import { Separator } from '@/components/ui/separator'
import CreateEventDrawer from '@/components/app/CreateEventDrawer'
import DebugButton from '@/components/app/DebugButton'
import './HomeLayout.css'

export default function HomeLayout() {
  const location = useLocation()
  const isHome = useMemo(() => {
    return location.pathname === '/'
  }, [location.pathname])

  return <div className="bg-background text-foreground">
    <DebugButton />
    <div className="flex justify-center space-between p-5">
      <div className="flex-1 invisible"></div>
      <div className="flex-2 text-center font-bold text-2xl">
        <Link to="/">OMEN</Link>
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
