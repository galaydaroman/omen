import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { BrushCleaningIcon, FlaskConicalIcon } from 'lucide-react'

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
} from '@/components/ui/alert-dialog'

import {
  Item,
  ItemMedia,
  ItemTitle,
  ItemGroup,
  ItemActions,
  ItemContent,
  ItemDescription
} from '@/components/ui/item'

import EventsStorageAdapter from '@/services/eventsStorageAdapter'

import {
  isTestStorageDatabase,
  resetToStorageDatabase
} from '@/services/environmentStorageManager'

export default function DebugPage() {
  const [isTestStorage, setIsTestStorage] = useState<boolean>(isTestStorageDatabase())

  const onTestStorageCheckedChange = useCallback((checked: boolean) => {
    resetToStorageDatabase(checked)
    setIsTestStorage(checked)
    window.location.reload()
  }, [])

  const resetData = async () => {
    const storageAdapter = new EventsStorageAdapter()
    await storageAdapter.resetStorage()
    window.location.reload()
  }

  return <div className="flex justify-center">
    <div className="flex flex-col gap-4 w-md max-w-md">
      <ItemGroup className="flex w-full flex-col gap-4 p-2">
        <Item variant="outline">
          <ItemMedia variant="icon">
            <FlaskConicalIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Enable test storage</ItemTitle>
            <ItemDescription>Switch to test storage</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Switch id="test-storage-switcher"
              checked={isTestStorage}
              onCheckedChange={onTestStorageCheckedChange}
            />
          </ItemActions>
        </Item>

        <Item variant="outline">
          <ItemMedia variant="icon">
            <BrushCleaningIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Reset storage</ItemTitle>
            <ItemDescription>⚠️ Remove all data from current storage. Destructive action.</ItemDescription>
          </ItemContent>
          <ItemActions>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button>Reset</Button>
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
          </ItemActions>
        </Item>
      </ItemGroup>
    </div>
  </div>
}
