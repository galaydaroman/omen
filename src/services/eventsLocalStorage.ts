import { nanoid } from 'nanoid'
import type { Event, Events, EventLog, EventLogs, StorageDataApi } from '../types'

const LOCAL_STORAGE_KEY = 'omen-events'

interface StorageData {
  events: Events,
  eventLogs: EventLogs
}

export default class EventsLocalStorage implements StorageDataApi {
  private readonly storage: Storage
  private _cache: StorageData | null
  private eventsMapCache: Record<string, Event> | null

  constructor() {
    this.storage = localStorage
    this._cache = null
    this.eventsMapCache = null
  }

  initiateData(): StorageData {
    return {
      events: [],
      eventLogs: []
    } as StorageData
  }

  isStorageDataCorrect(object: unknown): object is StorageData {
    return (
      object &&
      typeof object === 'object' &&
      'events' in object &&
      'eventLogs' in object &&
      Array.isArray((object as StorageData).events) &&
      Array.isArray((object as StorageData).eventLogs)
    )
  }

  getRawData(): string | null {
    return this.storage.getItem(LOCAL_STORAGE_KEY)
  }

  getData(): StorageData {
    const raw = this.getRawData()

    if (!raw) {
      return this.initiateData()
    }

    try {
      const parsed: unknown = JSON.parse(this.getRawData())

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
    })
  }

  saveData(data: StorageData): void {
    this.storage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data))
    this.cache = null
  }

  async fetchEvents(): Promise<Events> {
    const data = this.getCachedData()
    return data.events
  }

  fetchEventById(eventId: string): Event | null {
    const eventMap = this.getEventsMap()
    return eventMap[eventId]
  }

  validateAndPrepareEvent(event: Partial<Event>): Event {
    if (!event.name || typeof event.name !== 'string') {
      throw new Error('[EventsLocalStorage] Event name is missing')
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

  async fetchEventLogs(limit: number = 30): Promise<EventLogs> {
    const data = this.getCachedData()
    return data.eventLogs.slice(-limit).reverse()
  }

  validateAndPrepareEventLog(eventLog: Partial<EventLog>): EventLog {
    if (!eventLog.eventId) {
      throw new Error("[EventsLocalStorage] EventLog's reference to eventId is missing")
    }

    const event = this.fetchEventById(event.eventId)
    if (!event) {
      throw new Error('[EventsLocalStorage] EventLog references to not existing event')
    }

    const timestamp = new Date().toISOString()
    return {
      id: nanoid(6),
      eventId: eventLog.eventId,
      tags: eventLog.tags || [],
      note: eventLog.note,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  }

  async addEventLog(eventLog: Partial<EventLog>): Promise<void> {
    // add new eventLog
    const newEventLog = this.validateAndPrepareEventLog(eventLog)
    const data = this.getCachedData()
    const newEventLogs = data.eventLogs.concat(newEventLog)

    // update event with new tags and recent use tags
    let updatedEvents = data.events
    if (newEventLog.tags.length) {
      const event = this.fetchEventById(eventId)
      const updatedTags = [...new Set([...newEventLog.tags, ...event.tags])]
      const updatedEvent = {
        ...event,
        tags: updatedTags
      }

      updatedEvents = data.events.map(event => {
        return event.id === eventId ? updatedEvent : event
      })
    }


    const newData = {
      ...data,
      events: updatedEvents,
      eventLogs: newEventLogs
    }

    this.saveData(newData)
  }

  async updateEventLog(eventLog: EventLog): Promise<void> {
    console.log(eventLog)
    // TBD
  }
}
