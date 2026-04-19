import { Fragment, useState, useMemo } from 'react'
import { useFetchEventLogsInfiniteQuery } from '@/services/eventApi'
import EventsFilter from '@/components/app/EventsFilter'
import type { EventLogs, EventFilter } from '@/types'
import { format, isSameDay } from 'date-fns'

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

function parseAndFormatDateForItem(date: string): string {
  return format(new Date(date), 'HH:mm')
}

function parseAndFormatDateForSeparator(date: string): string {
  return format(new Date(date), 'iii, LLLL d yyyy')
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
      {eventLogs.map((eventLog, index: number) => {
        const isFirst = index === 0
        const isLast = index === eventLogs.length - 1
        const nextEventLog = eventLogs[index + 1]
        const isNewDay = nextEventLog && !isSameDay(eventLog.createdAt, nextEventLog.createdAt)

        return (
          <Fragment key={eventLog.id}>
            {
              isFirst && <DayHeaderSeparator datetime={eventLog.createdAt} />
            }
            <Item>
              <ItemContent className="gap-1">
                <ItemTitle className="flex justify-between w-full">
                  <div className="text-primary">{eventLog.name}</div>
                  <div className="text-muted-foreground font-extralight text-xs">
                    {parseAndFormatDateForItem(eventLog.createdAt)}
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
                  eventLog.note && <ItemDescription>{eventLog.note}</ItemDescription>
                }
              </ItemContent>
            </Item>
            {
              !isLast && (
                isNewDay
                  ? <DayHeaderSeparator datetime={nextEventLog.createdAt} />
                  : <ItemSeparator />
              )
            }
          </Fragment>
        )
      })}
    </ItemGroup>
  )
}

function DayHeaderSeparator({ datetime } : { datetime: string }) {
  return (
    <div className="relative">
      <ItemSeparator />
      <ItemSeparator className="pt-1" />
      <div className="w-full text-center absolute top-[-12px]">
        <div className="inline-flex bg-background font-extralight text-sm pl-3 pr-3">
          {parseAndFormatDateForSeparator(datetime)}
        </div>
      </div>
    </div>
  )
}
