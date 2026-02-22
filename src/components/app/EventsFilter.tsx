import { useState, useMemo, useCallback } from 'react'
import { useFetchEventsQuery } from '@/services/eventApi'

import type { Event, EventFilter } from '@/types'

import { ChevronsUpDownIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'

import {
  Card,
  CardAction,
  CardHeader,
  CardContent,
  CardDescription
} from '@/components/ui/card'

import {
  NativeSelect,
  NativeSelectOption
} from '@/components/ui/native-select'

import {
  Field,
  FieldGroup
} from '@/components/ui/field'

export interface EventsFilterItem extends EventFilter {
  event: Event
}

interface EventsFilterParams {
  initialFilter?: EventsFilterItem[],
  onFilterChange: (events: EventsFilterItem[]) => void
}

export default function EventsFilter({ initialFilter = [], onFilterChange }: EventsFilterParams) {
  const [data, setData] = useState<EventsFilterItem[]>(initialFilter)
  const { data: events, isLoading: isEventsLoading } = useFetchEventsQuery()

  const selectableEvents = useMemo(() => {
    const selectedEventIds = data.map(f => f.eventId)
    return (events ?? []).filter(event => !selectedEventIds.includes(event.id))
  }, [events, data])

  const addEventFilter = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const eventId = e.target.value
    const event = events?.find(event => event.id === eventId)

    if (event) {
      const newData = [...data, {
        eventId: event.id,
        event: event as Event,
        tags: []
      }]

      setData(newData)
      onFilterChange(newData)
    }
  }, [data, events, onFilterChange])

  const changeEventFilter = useCallback((currentEventId: string) => (eventId: string, tags: string[]) => {
    let newData: EventsFilterItem[];

    if (eventId) {
      newData = data.map(item => {
        if (item.eventId !== currentEventId) {
          return item
        }

        if (currentEventId === eventId) {
          return { ...item, tags }
        } else {
          const event = events?.find(event => event.id === eventId)
          return event ? { event, eventId, tags: [] } : item
        }
      })
    } else {
      newData = data.filter(item => item.eventId !== currentEventId)
    }

    setData(newData)
    onFilterChange(newData)
  }, [data, events, onFilterChange])

  return (
    <Collapsible>
      <Card className="my-4 py-2">
        <CardHeader>
            <CollapsibleTrigger asChild>
              <CardDescription className="pt-2">
                Filter history
              </CardDescription>
            </CollapsibleTrigger>
          <CardAction>
            <CollapsibleTrigger asChild>
              <Button variant="secondary" size="icon-sm">
                <ChevronsUpDownIcon />
              </Button>
            </CollapsibleTrigger>
          </CardAction>
        </CardHeader>
        <CollapsibleContent asChild>
          <CardContent className="pb-2">
            {
              data.map(item => (
                <EventFilterComponent
                  key={item.event.id}
                  event={item.event}
                  selectableEvents={selectableEvents}
                  onEventChange={changeEventFilter(item.event.id)}
                />
              ))
            }
            {
              !!selectableEvents.length && (
                <FieldGroup className="mt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <div className="flex items-center w-full relative">
                        <NativeSelect id="selected-event" className="w-full" onChange={addEventFilter} value="">
                          <NativeSelectOption value="">None</NativeSelectOption>
                          {
                            selectableEvents.map(event => (
                              <NativeSelectOption key={event.id} value={event.id}>
                                {event.name}
                              </NativeSelectOption>
                            ))
                          }
                        </NativeSelect>
                        {
                          isEventsLoading && <Spinner className="ml-2" />
                        }
                      </div>
                    </Field>
                  </div>
                </FieldGroup>
              )
            }
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

interface EventFilterComponentParams {
  event: Event,
  selectableEvents: Event[],
  onEventChange: (eventId: string, tags: string[]) => void
}

function EventFilterComponent({ event, selectableEvents, onEventChange }: EventFilterComponentParams) {
  const [tags, setTags] = useState<string[]>([])

  const changeSelectedEvent = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const eventId = e.target.value
    onEventChange(eventId, [])
  }, [onEventChange])

  const toggleTag = useCallback((tag: string) => () => {
    let newTags: string[];

    if (tags.includes(tag)) {
      newTags = tags.filter(t => t !== tag)
    } else {
      newTags = [...tags, tag]
    }

    setTags(newTags)
    onEventChange(event.id, newTags)
  }, [tags, event, onEventChange])

  return (
    <FieldGroup className="mt-2">
      <div className="grid grid-cols-2 gap-4">
        <Field>
          <div className="flex items-center w-full relative">
            <NativeSelect id="selected-event" className="w-full" onChange={changeSelectedEvent} value={event.id}>
              <NativeSelectOption value="">None</NativeSelectOption>
              {
                [event, ...selectableEvents].map(event => (
                  <NativeSelectOption key={event.id} value={event.id}>
                    {event.name}
                  </NativeSelectOption>
                ))
              }
            </NativeSelect>
          </div>
        </Field>
        <Field>
          <div className="flex flex-wrap gap-2">
            {
              event.tags.map(tag => (
                <Badge
                  key={tag}
                  className="dark:text-foreground cursor-pointer"
                  size="lg"
                  variant={tags.includes(tag) ? "default" : "secondary"}
                  onClick={toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))
            }
          </div>
        </Field>
      </div>
    </FieldGroup>
  )
}
