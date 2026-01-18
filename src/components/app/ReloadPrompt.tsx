import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '@/components/ui/button'

export default function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegisteredSW(swScriptUrl: string) {
      console.log(`SW Registered: ${swScriptUrl}`)
    },
    onRegisterError(error: { message: string }) {
      console.error('SW registration error', error)
    }
  })

  const close = () => setNeedRefresh(false)

  // Only show if there is an update waiting
  if (!needRefresh) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg md:max-w-[300px]">
      <div className="text-sm font-medium">
        New version available
      </div>
      <div className="text-xs text-muted-foreground">
        Click reload to update the app.
      </div>
      <div className="flex gap-2 pt-2">
        <Button size="sm" onClick={() => updateServiceWorker()}>
          Reload
        </Button>
        <Button size="sm" variant="outline" onClick={close}>
          Dismiss
        </Button>
      </div>
    </div>
  )
}
