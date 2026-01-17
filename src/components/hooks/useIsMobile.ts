import { useState, useEffect } from 'react'

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const hasWindowMobileSize = () => window.innerWidth < MOBILE_BREAKPOINT
  const [isMobile, setIsMobile] = useState<boolean>(hasWindowMobileSize())

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => setIsMobile(hasWindowMobileSize())

    mql.addEventListener('change', onChange)

    return () => mql.removeEventListener('change', onChange)
  }, [])

  return !!isMobile
}
