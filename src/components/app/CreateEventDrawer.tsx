import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel
} from '@/components/ui/field'
import {
  Drawer,
  DrawerDescription,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from '@/components/ui/drawer'
import { CirclePlusIcon } from 'lucide-react'
import { useAddEventMutation } from '@/services/eventApi'
import type { Event } from '@/types'

export default function CreateEventDrawer() {
  const [open, _setOpen] = useState(false)
  const [event, setEvent] = useState<Partial<Event>>({ name: '' })
  const [addEvent, { isLoading, error: apiError, reset }] = useAddEventMutation()

  const errorMessage = (apiError as { data?: string })?.data

  const changeEventName = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEvent(prev => ({
      ...prev,
      name: e.target.value
    }))
  }, [])

  const setOpen = useCallback((value: boolean) => {
    if (value) {
      reset()
      setEvent({ name: '' })
    }
    _setOpen(value)
  }, [reset])

  const handleAddEvent = useCallback(() => {
    addEvent(event)
      .unwrap()
      .then(() => setOpen(false))
      .catch(() => {})
  }, [addEvent, event, setOpen])

  const onSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    handleAddEvent()
  }, [handleAddEvent])

  const openDrawer = useCallback(() => {
    setOpen(true)
  }, [setOpen])

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button onClick={openDrawer}>
          <CirclePlusIcon />
          <span className="hidden sm:block">New Event</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm p-10 pt-0">
          <DrawerHeader>
            <DrawerTitle>New event</DrawerTitle>
            <DrawerDescription></DrawerDescription>
          </DrawerHeader>
          <form onSubmit={onSubmit}>
            <FieldGroup className="pb-10">
              <Field>
                <FieldLabel htmlFor="event-name">
                  Event name*
                </FieldLabel>
                <Input
                  id="event-name"
                  placeholder="Biking..."
                  required
                  value={event.name}
                  onChange={changeEventName}
                />
                <FieldError errors={errorMessage ? [{ message: errorMessage }] : undefined} />
              </Field>
            </FieldGroup>
            <DrawerFooter>
              <Button
                type="submit"
                autoFocus
                disabled={isLoading}
              >
                {
                  isLoading && <Spinner />
                }
                Create
              </Button>
            </DrawerFooter>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
