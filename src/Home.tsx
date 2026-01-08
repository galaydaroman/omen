import { useState } from 'react'
import './Home.css'

export default function Home() {
  const [events] = useState(['Cooking', 'Sleeping', 'Pooping'])

  return <div className="events-container">
    <div className="event">
      <a href="/new_event" className="event-button">+</a>
    </div>
    {
      events.map(event => (
        <div className="event">
          <a href={`/new?name=${event}`} className="event-button">{event}</a>
        </div>
      ))
    }
  </div>
}
