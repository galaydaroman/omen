export interface Event {
  id: string,
  name: string,
  tags: string[],
  order?: number
}

export interface EventLog {
  id: string,
  eventId: string,
  createdAt: string,
  updatedAt: string,
  tags: string[],
  note?: string
}

export type Events = Event[]
export type EventLogs = EventLog[]

export interface StorageDataApi {
  fetchEvents: () => Promise<Events>,
  addEvent: (event: Partial<Event>) => Promise<void>,
  fetchEventLogs: (limit: number) => Promise<EventLogs>,
  addEventLog: (eventLog: Partial<EventLog>) => Promise<void>,
  updateEventLog: (eventLog: EventLog) => Promise<void>
}
