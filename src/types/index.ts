export interface Event {
  __type?: 'Event',
  id: string,
  name: string,
  tags: string[],
  order?: number
}

export interface EventLog {
  __type?: 'EventLog',
  id: string,
  eventId: string,
  name?: string,
  createdAt: string,
  updatedAt: string,
  tags: string[],
  note?: string
}

export type Events = Event[]
export type EventLogs = EventLog[]
export type StorageRecord = Event | EventLog

interface EventLogFilter {
  eventId?: string,
  dateRange?: [string, string],
  tags?: string[]
}

interface Pagination {
  offset?: number,
  limit?: number
}

export interface FetchEventLogsParams {
  filters?: EventLogFilter,
  pagination?: Pagination
}

export interface StorageDataApi {
  fetchEvents: () => Promise<Events>,
  addEvent: (event: Partial<Event>) => Promise<void>,
  fetchEventLogs: (params: FetchEventLogsParams) => Promise<EventLogs>,
  addEventLog: (eventLog: Partial<EventLog>) => Promise<void>,
  updateEventLog: (eventLog: EventLog) => Promise<void>,
  clearDatabase: () => Promise<void>,
  exportData: () => Promise<ReadableStream<string | Uint8Array>>,
  importData: (items: StorageRecord[]) => Promise<void>
}
