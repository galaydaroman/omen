import { useFetchEventsQuery } from './services/eventApi'
import { Link } from 'react-router-dom'
import './Home.css'

export default function Home() {
  const { data: events, isLoading } = useFetchEventsQuery()

  return <div className="events-container">
    <div className="event">
      <Link to="/new_event" className="event-button">+</Link>
    </div>
    {
      isLoading
        ? '...'
        : events?.map(event => (
        <div className="event" key={event.id}>
          <Link to={`/new?name=${event.name}`} className="event-button">{event.name}</Link>
        </div>
      ))
    }
  </div>
}
