import { Fragment, useState, useMemo } from 'react'
import { useFetchEventLogsInfiniteQuery } from '@/services/eventApi'
import EventsFilter from '@/components/app/EventsFilter'
import type { EventLogs, EventFilter } from '@/types'
import { format } from 'date-fns'

import { BirdIcon } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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

export default function EventLogsPage() {
  const [filter, setFilter] = useState<EventFilter[]>([])

  const {
    data,
    isFetching,
    fetchNextPage,
    hasNextPage,
    error,
    isError
  } = useFetchEventLogsInfiniteQuery({ events: filter, limit: 100 })

  const eventLogs = useMemo(() => data?.pages.flat() ?? [], [data?.pages])

  if (isError) {
    console.log(error)
  }

  if (!filter.length && !isFetching && !eventLogs.length) {
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
        <EventsFilter onFilterChange={setFilter} />
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
