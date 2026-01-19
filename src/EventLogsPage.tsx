import { Fragment } from 'react'
import { useFetchEventLogsQuery } from '@/services/eventApi'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { BirdIcon } from 'lucide-react'
import { format } from 'date-fns'

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
  const { data: eventLogs, isLoading } = useFetchEventLogsQuery()

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner />
      </div>
    )
  }

  if (!eventLogs?.length) {
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
      <ItemGroup className="flex w-full max-w-md flex-col">
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
                <ItemDescription>
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
    </div>
  )
}
