import { useMemo } from 'react'
import { Outlet, useLocation, useHref } from 'react-router'
import { motion, AnimatePresence } from 'motion/react'
import { Separator } from '@/components/ui/separator'
import { useIsMobile } from '@/components/hooks/useIsMobile'
import CreateEventDrawer from '@/components/app/CreateEventDrawer'
import Navigation from '@/components/app/Navigation'
import DebugButton from '@/components/app/DebugButton'
import { isTestCurrentStorageKey } from '@/services/eventsLocalStorage'

import './HomeLayout.css'

export default function HomeLayout() {
  const homePath = useHref('/')
  const location = useLocation()
  const isMobile = useIsMobile()

  const isHome = useMemo(() => {
    return location.pathname === '/'
  }, [location.pathname])

  const Wrapper = isMobile ? MotionWrapper : EmptyWrapper

  return (
    <Wrapper>
      <div className="bg-background text-foreground h-screen flex flex-col">
        <DebugButton />
        <div className="flex justify-center space-between p-5 flex-shrink-0">
          <div className="flex-1">
            <Navigation />
          </div>
          <div className="flex-2 text-center font-bold text-2xl">
            <a className="relative" href={homePath}>
              OMEN
              {
                isTestCurrentStorageKey() && (
                  <span className="absolute text-sm top-6 left-0 right-0 text-destructive font-bold">
                    test
                  </span>
                )
              }
            </a>
          </div>
          <div className="flex flex-1 justify-end">
            {
              isHome && <CreateEventDrawer />
            }
          </div>
        </div>
        <Separator />
        <div className="main flex-1 flex flex-col min-h-0">
          <div className="h-full overflow-y-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </Wrapper>
  )
}

function MotionWrapper({ children }: React.PropsWithChildren) {
  const location = useLocation()

  const isHome = useMemo(() => {
    return location.pathname === '/'
  }, [location.pathname])

  const variants = useMemo(() => {
    const direction = isHome ? -1 : 1

    return {
      enter: {
        x: direction > 0 ? '100%' : '-100%',
        opacity: 0,
      },
      center: {
        x: 0,
        opacity: 1,
      },
      exit: {
        x: direction > 0 ? '100%' : '-100%',
        opacity: 0,
        transition: { duration: 0 }
      }
    }
  }, [isHome])

  return (
    <AnimatePresence initial={false}>
      <motion.div
        key={location.pathname}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.3, ease: "easeInOut" }}
        style={{ position: 'fixed', width: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

function EmptyWrapper({ children }: React.PropsWithChildren) {
  return <>
    {children}
  </>
}
