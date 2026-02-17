import { useState, useCallback, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/spinner'
import { Progress } from '@/components/ui/progress'
import { FieldError } from '@/components/ui/field'

import {
  BrushCleaningIcon,
  FlaskConicalIcon,
  DownloadIcon,
  UploadIcon
} from 'lucide-react'

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
import importEvents from '@/services/importEvents'

import {
  isTestStorageDatabase,
  resetToStorageDatabase
} from '@/services/environmentStorageManager'

export default function DebugPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isTestStorage, setIsTestStorage] = useState<boolean>(isTestStorageDatabase())
  const [downloadWait, setDownloadWait] = useState<boolean>(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [uploadInProgress, setUploadInProgress] = useState<boolean>(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [resetDataError, setResetDataError] = useState<string | null>(null)

  const onTestStorageCheckedChange = useCallback((checked: boolean) => {
    resetToStorageDatabase(checked)
    setIsTestStorage(checked)
    window.location.reload()
  }, [])

  const resetData = useCallback(async () => {
    setResetDataError(null)

    await eventsStorage.resetStorage().catch(error => {
      setResetDataError(error?.message)
    })

    window.location.reload()
  }, [])

  const exportData = async () => {
    setDownloadError(null)
    setDownloadWait(true)

    const stream = await eventsStorage.exportData().catch(error => {
      setDownloadError(error?.message)
    })

    if (stream) {
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
  }

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const uploadFile = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0]

    if (!file) return;

    setUploadError(null)
    setUploadInProgress(true)

    await importEvents(file, setUploadProgress).catch(error => {
      setUploadError(error?.message)
    })

    setUploadInProgress(false)
    setUploadProgress(0)

    event.target.value = ''
  }, [])

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
            <ItemDescription>Download your data in NDJSON format</ItemDescription>
            {downloadError && <FieldError>{downloadError}</FieldError>}
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
            <UploadIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Import data</ItemTitle>
            <ItemDescription>Import your data from NDJSON file</ItemDescription>
            {uploadInProgress && <Progress value={uploadProgress} />}
            {uploadError && <FieldError>{uploadError}</FieldError>}
          </ItemContent>
          <ItemActions>
            <input type="file" className="hidden" ref={fileInputRef} onChange={uploadFile} />
            <Button onClick={openFileDialog} disabled={uploadInProgress}>Upload</Button>
          </ItemActions>
        </Item>

        <Item variant="outline">
          <ItemMedia variant="icon">
            <BrushCleaningIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Reset storage</ItemTitle>
            <ItemDescription>⚠️ Remove all data from current storage. Destructive action.</ItemDescription>
            {resetDataError && <FieldError>{resetDataError}</FieldError>}
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
