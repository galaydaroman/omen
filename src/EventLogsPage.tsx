import { Fragment, useState, useMemo, useCallback } from 'react'
import { useFetchEventLogsInfiniteQuery, useFetchEventsQuery } from '@/services/eventApi'
import type { Event, EventLogs } from '@/types'
import { format } from 'date-fns'
import { BirdIcon, ChevronsUpDownIcon } from 'lucide-react'

import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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

import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemSeparator,
  ItemTitle
} from '@/components/ui/item'

import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription
} from '@/components/ui/empty'

function parseAndFormatDate(date: string): string {
  return format(new Date(date), 'MM/dd/yyyy HH:mm:ss')
}

function EventLogList({ eventLogs, isFetching }: { eventLogs: EventLogs, isFetching: boolean }) {
  if (!eventLogs.length && !isFetching) {
    return (
      <div className="flex justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BirdIcon />
            </EmptyMedia>
            <EmptyTitle>Empty</EmptyTitle>
            <EmptyDescription>
              Nothing was found for selected filter
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  return (
    <ItemGroup className="flex flex-col">
      {eventLogs.map((eventLog, index: number) => (
        <Fragment key={eventLog.id}>
          <Item>
            <ItemContent className="gap-1">
              <ItemTitle className="flex justify-between w-full">
                <div className="text-primary">{eventLog.name}</div>
                <div className="text-muted-foreground font-extralight text-xs">
                  {parseAndFormatDate(eventLog.createdAt)}
                </div>
              </ItemTitle>
              <ItemDescription className="min-h-[22px]">
                {
                  eventLog.tags.map(tag => (
                    <Badge key={tag} className="mr-1" variant="secondary">
                      {tag}
                    </Badge>
                  ))
                }
              </ItemDescription>
              {
                eventLog.note && (
                  <ItemDescription>
                    {eventLog.note}
                  </ItemDescription>
                )
              }
            </ItemContent>
          </Item>
          {
            index !== eventLogs.length - 1 && <ItemSeparator />
          }
        </Fragment>
      ))}
    </ItemGroup>
  )
}

export default function EventLogsPage() {
  const [event, setEvent] = useState<Event | null>()
  const [tags, setTags] = useState<string[]>([])
  const { data: events, isLoading: isEventsLoading } = useFetchEventsQuery()

  const {
    data,
    isFetching,
    fetchNextPage,
    hasNextPage,
    error,
    isError
  } = useFetchEventLogsInfiniteQuery({ eventId: event?.id, tags, limit: 100 })

  const changeSelectedEvent = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const eventId = e.target.value
    const selectedEvent = events?.find(event => event.id === eventId)
    setEvent(selectedEvent)
    setTags([])
  }, [events])

  const toggleTag = useCallback((tag: string) => () => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag))
    } else {
      setTags([...tags, tag])
    }
  }, [tags])

  const eventLogs = useMemo(() => data?.pages.flat() ?? [], [data?.pages])

  if (isError) {
    console.log(error)
  }

  if (!event && !tags.length && !isFetching && !eventLogs.length) {
    return (
      <div className="flex justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BirdIcon />
            </EmptyMedia>
            <EmptyTitle>No History Yet</EmptyTitle>
            <EmptyDescription>
              You haven&apos;t created any event logs yet. Get started by creating
              your first event log.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <div className="flex flex-col w-full max-w-md">
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
                <FieldGroup>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <div className="flex items-center w-full relative">
                        <NativeSelect id="selected-event" className="w-full" onChange={changeSelectedEvent} value={event?.id ?? ''}>
                          <NativeSelectOption value="">All events</NativeSelectOption>
                          {
                            events?.map(event => (
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
                    <Field>
                      <div className="flex flex-wrap gap-2">
                        {
                          event?.tags.map(tag => (
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
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
        <EventLogList eventLogs={eventLogs} isFetching={isFetching} />
        {
          isFetching && (
            <div className="flex justify-center p-8">
              <Spinner />
            </div>
          )
        }
        {
          hasNextPage && (
            <div className="flex justify-center pb-10">
              <Button variant="outline" onClick={fetchNextPage}>More...</Button>
            </div>
          )
        }
      </div>
    </div>
  )
}
