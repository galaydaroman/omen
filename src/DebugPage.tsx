import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { ChevronLeftIcon, BrushCleaningIcon } from 'lucide-react'
import { LOCAL_STORAGE_KEY } from '@/services/eventsLocalStorage'

export default function DebugPage() {
  const resetData = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, '{}')
    window.location.reload()
  }

  return <div className="flex justify-center p-10">
    <div className="w-md max-w-md flex flex-col gap-2">
      <div>
        <Link to="/">
          <Button>
            <ChevronLeftIcon /> Back
          </Button>
        </Link>
      </div>
      <div>
        <Button onClick={resetData}>
          <BrushCleaningIcon /> Reset data
        </Button>
      </div>
    </div>
  </div>
}
