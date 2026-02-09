import { Link } from 'react-router'
import { useIsMobile } from '@/components/hooks/useIsMobile'
import { MenuIcon } from 'lucide-react'

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger
} from '@/components/ui/navigation-menu'

export default function Navigation() {
  const isMobile = useIsMobile()

  return <NavigationMenu viewport={isMobile}>
    <NavigationMenuList>
      <NavigationMenuItem>
        <NavigationMenuTrigger>
          <MenuIcon />
        </NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul className="grid w-[200px] gap-4">
            <li>
              <NavigationMenuLink asChild>
                <Link to="/">Home</Link>
              </NavigationMenuLink>
              <NavigationMenuLink asChild>
                <Link to="/history">History</Link>
              </NavigationMenuLink>
              <NavigationMenuLink asChild>
                <Link to="/statistics">Statistics</Link>
              </NavigationMenuLink>
            </li>
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
}
