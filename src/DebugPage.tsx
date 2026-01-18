import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { ChevronLeftIcon, BrushCleaningIcon } from 'lucide-react'
import { LOCAL_STORAGE_KEY } from '@/services/eventsLocalStorage'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button>
              <BrushCleaningIcon /> Reset data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently
                remove your data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={resetData}>
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  </div>
}
