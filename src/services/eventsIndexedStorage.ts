import { nanoid } from 'nanoid'
import { openDB, deleteDB } from 'idb'
import { currentStorageDatabaseName } from '@/services/environmentStorageManager'
import type { DBSchema, IDBPDatabase } from 'idb'
import type { Event, Events, EventLog, EventLogs, StorageDataApi } from '@/types'

const DB_VERSION = 1;

interface EventsDBSchema extends DBSchema {
  Events: {
    key: string,
    value: Event,
    indexes: {
      by_order: number
    }
  },
  EventLogs: {
    key: string,
    value: EventLog,
    indexes: {
      by_createdAt: string,
      eventId_date: [string, string]
    }
  }
}

let dbPromise: Promise<IDBPDatabase<EventsDBSchema>> | null | undefined;

export default class EventsIndexedStorage implements StorageDataApi {
  private eventsMapCache: Record<string, Event> | null

  constructor() {
    this.eventsMapCache = null
    this.database()
    this.checkPersisted()
  }

  async checkPersisted(): Promise<void> {
    const isPersisted = await navigator.storage.persisted()

    if (!isPersisted) {
      const result = await navigator.storage.persist()

      if (!result) {
        console.log('[EventsIndexedStorage] Failed to mark storage as persisted')
      }
    }
  }

  database() {
    return dbPromise ??= openDB<EventsDBSchema>(currentStorageDatabaseName(), DB_VERSION, {
      /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
      upgrade(db, oldVersion, _newVersion, _transaction) {
        if (oldVersion < 1) {
          // 1. Events Store (Small table, ~20-50 records)
          if (!db.objectStoreNames.contains('Events')) {
            const eventStore = db.createObjectStore('Events', { keyPath: 'id' })

            eventStore.createIndex('by_order', 'order')
          }

          // 2. EventLogs Store (Large table, 100k+ records)
          if (!db.objectStoreNames.contains('EventLogs')) {
            const logStore = db.createObjectStore('EventLogs', { keyPath: 'id' })

            logStore.createIndex('by_createdAt', 'createdAt')
            logStore.createIndex('eventId_date', ['eventId', 'createdAt'])
          }
        }
      },
      blocked() {
        // Fired if an older version is still open in another tab
        alert("A new version of the app is available. Please close other tabs to update.");
      },
      blocking() {
        // Fired in the OLD tab if a NEW version is trying to open
        // This is your signal to close the connection so the other tab can finish
        dbPromise?.then(db => db.close())
        alert("App is updating in another tab. This tab will now close.")
        window.location.reload()
      },
      terminated() {
        // Fired if the browser kills the process (rare, but good for logging)
        dbPromise = null
      }
    })
  }

  async clearDatabase(): Promise<void> {
    await this.closeDatabase()
    await deleteDB(currentStorageDatabaseName())
  }

  clearCache(): void {
    this.eventsMapCache = null
  }

  async closeDatabase() {
    this.clearCache()

    if (dbPromise) {
      const db = await dbPromise
      db.close()
      dbPromise = null
    }
  }

  async fetchEventById(id: string): Promise<Event> {
    if (!this.eventsMapCache) {
      await this.fetchEvents()
    }

    return (this.eventsMapCache as Record<string, Event>)[id]
  }

  async fetchEvents(): Promise<Events> {
    if (this.eventsMapCache) {
      return Object.values(this.eventsMapCache)
    } else {
      const db = await this.database()
      const events = await db.getAllFromIndex('Events', 'by_order')

      this.eventsMapCache = events.reduce((result: Record<string, Event>, event: Event) => {
        result[event.id] = event
        return result
      }, {})

      return events
    }
  }

  async validateAndPrepareEvent(event: Partial<Event>): Promise<Event> {
    if (!event.name || typeof event.name !== 'string') {
      throw new Error('Event name is missing')
    }

    const events = await this.fetchEvents()
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
    const newEvent = await this.validateAndPrepareEvent(event)
    const db = await this.database()
    await db.add('Events', newEvent)
    this.clearCache()
  }

  async fetchEventLogs(limit: number = 100): Promise<EventLogs> {
    await this.fetchEvents()
    const eventsMap = this.eventsMapCache as Record<string, Event>

    const db = await this.database()
    const txn = db.transaction('EventLogs', 'readonly')
    const index = txn.store.index('by_createdAt')
    const result = []

    let cursor = await index.openCursor(null, 'prev')

    while (cursor && result.length < limit) {
      const eventLog = cursor.value
      eventLog.name = (eventsMap[eventLog.eventId])?.name
      result.push(eventLog)
      cursor = await cursor.continue()
    }

    return result
  }

  async validateAndPrepareEventLog(eventLog: Partial<EventLog>): Promise<EventLog> {
    if (!eventLog.eventId) {
      throw new Error("EventLog's reference to eventId is missing")
    }

    const event = await this.fetchEventById(eventLog.eventId)

    if (!event) {
      throw new Error('EventLog references a non-existent event')
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

  async updatedEventFromEventLogChange(eventLog: EventLog): Promise<Event | undefined> {
    if (eventLog.tags.length) {
      const event = await this.fetchEventById(eventLog.eventId)

      if (event) {
        const updatedTags = [...new Set([...eventLog.tags, ...event.tags])]

        return {
          ...event,
          tags: updatedTags,
          order: (event.order ?? 0) - 1
        }
      }
    }
  }

  async addEventLog(eventLog: Partial<EventLog>): Promise<void> {
    const newEventLog = await this.validateAndPrepareEventLog(eventLog)
    const updatedEvent = await this.updatedEventFromEventLogChange(newEventLog)

    const db = await this.database()
    const txn = db.transaction(['EventLogs', 'Events'], 'readwrite')
    const storeEvents = txn.objectStore('Events')
    const storeEventLogs = txn.objectStore('EventLogs')

    await Promise.all([
      storeEventLogs.add(newEventLog),
      updatedEvent && storeEvents.put(updatedEvent),
      txn.done
    ])

    if (updatedEvent) {
      this.clearCache()
    }
  }

  async updateEventLog(eventLog: EventLog): Promise<void> {
    const updatedEventLog = {
      ...eventLog,
      updatedAt: new Date().toISOString()
    }

    const updatedEvent = await this.updatedEventFromEventLogChange(updatedEventLog)

    const db = await this.database()
    const txn = db.transaction(['EventLogs', 'Events'], 'readwrite')
    const storeEvents = txn.objectStore('Events')
    const storeEventLogs = txn.objectStore('EventLogs')

    await Promise.all([
      storeEventLogs.put(updatedEventLog),
      updatedEvent && storeEvents.put(updatedEvent),
      txn.done
    ])

    if (updatedEvent) {
      this.clearCache()
    }
  }
}
