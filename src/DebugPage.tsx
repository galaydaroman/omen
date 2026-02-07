import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/spinner'
import { BrushCleaningIcon, FlaskConicalIcon, DownloadIcon } from 'lucide-react'

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

import { eventsStorage } from '@/services/eventApi'

import {
  isTestStorageDatabase,
  resetToStorageDatabase
} from '@/services/environmentStorageManager'

const resetData = async () => {
  await eventsStorage.resetStorage()
  window.location.reload()
}

export default function DebugPage() {
  const [isTestStorage, setIsTestStorage] = useState<boolean>(isTestStorageDatabase())
  const [downloadWait, setDownloadWait] = useState<boolean>(false)

  const onTestStorageCheckedChange = useCallback((checked: boolean) => {
    resetToStorageDatabase(checked)
    setIsTestStorage(checked)
    window.location.reload()
  }, [])

  const exportData = async () => {
    setDownloadWait(true)
    const stream = await eventsStorage.exportData()
    const response = new Response(stream)
    const blob = await response.blob()
    setDownloadWait(false)

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backup_events_${new Date().toISOString()}.ndjson`
    a.click()
    URL.revokeObjectURL(url)
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
            <DownloadIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Export data</ItemTitle>
            <ItemDescription>Download your data in NDJson format</ItemDescription>
          </ItemContent>
          <ItemActions>
            {
              downloadWait
                ? <Spinner />
                : <Button onClick={exportData}>Download</Button>
            }
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
