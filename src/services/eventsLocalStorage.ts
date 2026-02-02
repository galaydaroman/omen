import { nanoid } from 'nanoid'
import { currentStorageDatabaseName } from '@/services/environmentStorageManager'

import type {
  Event,
  Events,
  EventLog,
  EventLogs,
  StorageDataApi,
  FetchEventLogsParams
} from '../types'

interface StorageData {
  events: Events,
  eventLogs: EventLogs
}

export default class EventsLocalStorage implements StorageDataApi {
  private readonly storage: Storage
  private _cache: StorageData | null
  private eventsMapCache: Record<string, Event> | null
  private storageKey: string

  constructor() {
    this.storage = localStorage
    this._cache = null
    this.eventsMapCache = null
    this.storageKey = currentStorageDatabaseName()
  }

  initiateData(): StorageData {
    return {
      events: [],
      eventLogs: []
    } as StorageData
  }

  async clearDatabase(): Promise<void> {
    this.storage.setItem(currentStorageDatabaseName(), '{}')
  }

  isStorageDataCorrect(object: unknown): object is StorageData {
    return (
      !!object &&
      typeof object === 'object' &&
      'events' in object &&
      'eventLogs' in object &&
      Array.isArray((object as StorageData).events) &&
      Array.isArray((object as StorageData).eventLogs)
    )
  }

  getRawData(): string | null {
    return this.storage.getItem(this.storageKey)
  }

  getData(): StorageData {
    const raw = this.getRawData()

    if (!raw) {
      return this.initiateData()
    }

    try {
      const parsed: unknown = JSON.parse(raw)

      if (this.isStorageDataCorrect(parsed)) {
        return parsed
      }
    } catch (e) {
      console.error('[EventsLocalStorage] Parse error:', e)
    }

    console.log('[EventsLocalStorage] Data corrupted. Reinitializing.')
    return this.initiateData()
  }

  get cache(): StorageData | null {
    return this._cache
  }

  set cache(data: StorageData | null) {
    this._cache = data
    this.eventsMapCache = null
  }

  getCachedData(): StorageData {
    return this.cache ??= this.getData()
  }

  getEventsMap(): Record<string, Event> {
    return this.eventsMapCache ??= this.getCachedData().events.reduce((cache, event) => {
      cache[event.id] = event
      return cache
    }, {} as Record<string, Event>)
  }

  saveData(data: StorageData): void {
    this.storage.setItem(this.storageKey, JSON.stringify(data))
    this.cache = null
  }

  async fetchEvents(): Promise<Events> {
    const data = this.getCachedData()
    return data.events
  }

  fetchEventById(eventId: string): Event | null {
    const eventMap = this.getEventsMap()
    return eventMap[eventId] || null
  }

  validateAndPrepareEvent(event: Partial<Event>): Event {
    if (!event.name || typeof event.name !== 'string') {
      throw new Error('Event name is missing')
    }

    const { events } = this.getCachedData()
    const eventNames = events.map(event => event.name.toLocaleLowerCase())
    if (eventNames.includes(event.name.toLocaleLowerCase())) {
      throw new Error('Event name is already in use')
    }

    return {
      id: nanoid(4),
      name: event.name,
      tags: event.tags || [],
      order: 0
    }
  }

  async addEvent(event: Partial<Event>): Promise<void> {
    const newEvent = this.validateAndPrepareEvent(event)
    const data = this.getCachedData()
    const newEvents = data.events.concat(newEvent)
    const newData = {
      ...data,
      events: newEvents
    }

    this.saveData(newData)
  }

  async fetchEventLogs(params: FetchEventLogsParams): Promise<EventLogs> {
    const limit = params.pagination?.limit || 30
    const data = this.getCachedData()
    const events = this.getEventsMap()

    return data.eventLogs.slice(-limit).reverse().map(eventLog => ({
      ...eventLog,
      name: events[eventLog.eventId]?.name
    }))
  }

  validateAndPrepareEventLog(eventLog: Partial<EventLog>): EventLog {
    if (!eventLog.eventId) {
      throw new Error("EventLog's reference to eventId is missing")
    }

    const event = this.fetchEventById(eventLog.eventId)
    if (!event) {
      throw new Error('EventLog references to not existing event')
    }

    const timestamp = new Date().toISOString()
    return {
      id: nanoid(6),
      eventId: eventLog.eventId,
      tags: eventLog.tags || [],
      note: eventLog.note || '',
      createdAt: timestamp,
      updatedAt: timestamp
    }
  }

  async addEventLog(eventLog: Partial<EventLog>): Promise<void> {
    const newEventLog = this.validateAndPrepareEventLog(eventLog)
    const data = this.getCachedData()
    const newEventLogs = data.eventLogs.concat(newEventLog)

    let updatedEvents = data.events
    if (newEventLog.tags.length) {
      const event = this.fetchEventById(newEventLog.eventId)
      if (event) {
        const updatedTags = [...new Set([...newEventLog.tags, ...event.tags])]
        const updatedEvent = {
          ...event,
          tags: updatedTags
        }

        updatedEvents = data.events.map(e => {
          return e.id === newEventLog.eventId ? updatedEvent : e
        })
      }
    }

    const newData = {
      ...data,
      events: updatedEvents,
      eventLogs: newEventLogs
    }

    this.saveData(newData)
  }

  async updateEventLog(eventLog: EventLog): Promise<void> {
    const data = this.getCachedData()
    const updatedLogs = data.eventLogs.map(log =>
      log.id === eventLog.id ? { ...eventLog, updatedAt: new Date().toISOString() } : log
    )

    this.saveData({
      ...data,
      eventLogs: updatedLogs
    })
  }
}
