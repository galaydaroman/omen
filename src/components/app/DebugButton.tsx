import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { WrenchIcon } from 'lucide-react'

export default function DebugButton() {
  return <Link to="/debug" className="fixed left-0 bottom-0 size-8 m-2">
    <Button variant="outline" size="icon">
      <WrenchIcon />
    </Button>
  </Link>
}
