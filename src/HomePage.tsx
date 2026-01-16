import { useFetchEventsQuery } from './services/eventApi'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
} from '@/components/ui/item'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent
} from '@/components/ui/empty'
import { ChevronRightIcon, BirdIcon } from 'lucide-react'
import CreateEventDrawer from '@/components/app/CreateEventDrawer'
import './HomePage.css'

export default function HomePage() {
  const { data: events, isLoading } = useFetchEventsQuery()

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner />
      </div>
    )
  }

  if (!events?.length) {
    return (
      <div className="flex justify-center">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BirdIcon />
            </EmptyMedia>
            <EmptyTitle>No Events Yet</EmptyTitle>
            <EmptyDescription>
              You haven&apos;t created any events yet. Get started by creating
              your first event.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="flex gap-2">
              <CreateEventDrawer />
            </div>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <ItemGroup className="flex w-full max-w-md flex-col gap-4 p-2">
        {events.map(event => (
          <Item key={event.id} variant="outline" asChild>
            <Link to={`/new?e=${event.id}`}>
              <ItemContent className="text-lg">
                {event.name}
              </ItemContent>
              <ItemActions>
                <Button variant="outline" size="sm" onClick={e => e.preventDefault()}>
                  Edit
                </Button>
                <ChevronRightIcon className="size-4" />
              </ItemActions>
            </Link>
          </Item>
        ))}
      </ItemGroup>
    </div>
  )
}
