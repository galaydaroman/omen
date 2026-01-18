import { useState, useCallback } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ChevronLeftIcon, BrushCleaningIcon } from 'lucide-react'

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

import {
  readCurrentStorageKey,
  isTestCurrentStorageKey,
  resetCurrentStorageKey
} from '@/services/eventsLocalStorage'

export default function DebugPage() {
  const [isTestStorage, setIsTestStorage] = useState<boolean>(isTestCurrentStorageKey())

  const onTestStorageCheckedChange = useCallback((checked: boolean) => {
    resetCurrentStorageKey(checked)
    setIsTestStorage(checked)
    window.location.reload()
  }, [])

  const resetData = () => {
    localStorage.setItem(readCurrentStorageKey(), '{}')
    window.location.reload()
  }

  return <div className="flex justify-center p-10">
    <div className="w-md max-w-md flex flex-col gap-4">
      <div>
        <Link to="/">
          <Button>
            <ChevronLeftIcon /> Back
          </Button>
        </Link>
      </div>
      <div className="flex items-center space-x-2 py-8">
        <Label htmlFor="test-storage-switcher">Use TEST storage</Label>
        <Switch id="test-storage-switcher"
          checked={isTestStorage}
          onCheckedChange={onTestStorageCheckedChange}
        />
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
