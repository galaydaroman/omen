import { useState, useMemo, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router'
import { useFetchEventsQuery } from './services/eventApi'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FieldError } from '@/components/ui/field'
import { PlusIcon } from 'lucide-react'
import {
  Field,
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
import type { Event, EventLog } from '@/types'
import { useAddEventLogMutation } from '@/services/eventApi'

function NewLogForm({ event }: { event: Event }) {
  const navigate = useNavigate()
  const [addEventLog, { isLoading, error: apiError }] = useAddEventLogMutation()
  const [open, setOpen] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [newTags, setNewTags] = useState<string[]>([])
  const [showNote, setShowNote] = useState(false)
  const errorMessage = (apiError as { data?: string })?.data

  const [eventLog, setEventLog] = useState<Partial<EventLog>>({
    eventId: event.id,
    tags: []
  })

  const selectableTags = useMemo(() => {
    return [...new Set([...newTags, ...event.tags])]
  }, [newTags, event.tags])

  const onSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()

    if (newTag && !selectableTags.includes(newTag)) {
      setNewTags([newTag, ...newTags])
      setNewTag('')
      setOpen(false)
    }
  }, [newTag, newTags, selectableTags])

  const changeNewTag = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewTag(e.target.value)
  }, [])

  const toggleTag = useCallback((tag: string) => () => {
    if (eventLog.tags?.includes(tag)) {
      setEventLog(prev => ({
        ...prev,
        tags: prev.tags?.filter(t => t !== tag)
      }))
    } else {
      setEventLog(prev => ({
        ...prev,
        tags: [tag, ...(prev.tags || [])]
      }))
    }
  }, [eventLog.tags])

  const updateEventLogNote = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEventLog(prev => ({
      ...prev,
      note: e.target.value
    }))
  }, [])

  const handleShowNote = useCallback(() => {
    setShowNote(true)
  }, [])

  const handleCancel = useCallback(() => {
    navigate(-1)
  }, [navigate])

  const handleCreate = useCallback(() => {
    addEventLog(eventLog)
      .unwrap()
      .then(() => navigate('/'))
  }, [addEventLog, eventLog, navigate])

  return (
    <div className="flex justify-center p-4">
      <div className="flex w-full max-w-md flex-col gap-4 p-2">
        <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight text-center">
          <span className="text-primary">{event.name}</span>
        </h3>
        <p className="text-muted-foreground text-center">
          Pick descriptive tags below or add more:
        </p>
        <div className="flex w-full flex-wrap gap-2">
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full">
                <PlusIcon />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="mx-auto w-full max-w-sm p-10 pt-0">
                <DrawerHeader>
                  <DrawerTitle>New tag</DrawerTitle>
                  <DrawerDescription></DrawerDescription>
                </DrawerHeader>
                <form onSubmit={onSubmit}>
                  <FieldGroup className="pb-10">
                    <Field>
                      <FieldLabel htmlFor="tag-name">
                        Tag name*
                      </FieldLabel>
                      <Input
                        id="tag-name"
                        placeholder="Awesome"
                        required
                        value={newTag}
                        onChange={changeNewTag}
                      />
                    </Field>
                  </FieldGroup>
                  <DrawerFooter>
                    <Button type="submit" autoFocus>
                      Create
                    </Button>
                  </DrawerFooter>
                </form>
              </div>
            </DrawerContent>
          </Drawer>
          {
            selectableTags.map(tag => (
              <Badge
                key={tag}
                className="dark:text-foreground cursor-pointer"
                size="lg"
                variant={eventLog.tags?.includes(tag) ? "default" : "secondary"}
                onClick={toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))
          }
        </div>
        <div className="flex w-full justify-center">
          {
            showNote
              ? <Textarea value={eventLog.note || ''} onChange={updateEventLogNote} placeholder="Add notes..." />
              : <Button className="underline" variant="link" onClick={handleShowNote}>Add note</Button>
          }
        </div>
        <div className="flex flex-col w-full text-center">
          <FieldError className="w-full">{errorMessage}</FieldError>
          <div className="flex flex-col gap-2 items-center">
            <Button variant="default" className="w-48" onClick={handleCreate} disabled={isLoading}>Create</Button>
            <Button variant="outline" className="w-48" onClick={handleCancel}>Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NewLogPage() {
  const [searchParams] = useSearchParams()
  const { data: events, isLoading } = useFetchEventsQuery()

  const eventId = useMemo(() => {
    return searchParams.get('e')
  }, [searchParams])

  const event = useMemo(() => {
    return events?.find(event => event.id === eventId)
  }, [events, eventId])

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="p-8 text-center">
        Event not found.
      </div>
    )
  }

  return <NewLogForm event={event} key={event.id} />
}
