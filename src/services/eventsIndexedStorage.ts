import { nanoid } from 'nanoid'
import { openDB, deleteDB } from 'idb'
import { currentStorageDatabaseName } from '@/services/environmentStorageManager'
import type { DBSchema, IDBPDatabase } from 'idb'

import type {
  Event,
  Events,
  EventLog,
  EventLogs,
  StorageRecord,
  StorageDataApi,
  FetchEventLogsParams
} from '@/types'

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

  // Implementations
  // 1. By all events with tags
  // 1. By one event with tags
  // 1. By one event with tags and by date range
  // 1. By multiple events with tags
  // 1. By multiple events with tags and by date range
  async fetchEventLogs(params: FetchEventLogsParams): Promise<EventLogs> {
    const result = []
    const { filters = {}, pagination } = params
    const { eventId, dateRange, tags } = filters
    const limit = pagination?.limit || 20000000
    const toBeSkipped = Math.max(0, pagination?.offset || 0)

    await this.fetchEvents()
    const eventsMap = this.eventsMapCache as Record<string, Event>

    const db = await this.database()
    const txn = db.transaction('EventLogs', 'readonly')
    const index = txn.store.index(eventId ? 'eventId_date' : 'by_createdAt')

    let range: IDBKeyRange | null = null

    if (eventId) {
      range = IDBKeyRange.bound(
        [eventId, dateRange ? dateRange[0] : ''],
        [eventId, dateRange ? dateRange[1] : '\uffff']
      )
    } else if (!eventId && dateRange) {
      range = IDBKeyRange.bound(...dateRange)
    }

    let cursor = await index.openCursor(range, 'prev')
    let skippedMatchingRecords = 0

    if (!tags?.length && toBeSkipped > 0 && cursor) {
      skippedMatchingRecords = toBeSkipped
      cursor = await cursor.advance(skippedMatchingRecords)
    }

    while (cursor && result.length < limit) {
      const eventLog = cursor.value
      const isTagsMatching = !tags?.length || eventLog.tags.some(tag => tags.includes(tag))

      if (isTagsMatching) {
        if (skippedMatchingRecords < toBeSkipped) {
          skippedMatchingRecords++;
        } else {
          eventLog.name = (eventsMap[eventLog.eventId])?.name
          result.push(eventLog)
        }
      }

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

  async exportData(): Promise<ReadableStream<string | Uint8Array>> {
    const db = await this.database()
    const encoder = new TextEncoder()

    return new ReadableStream({
      async start(controller) {
        try {
          const txn = db.transaction(['EventLogs', 'Events'], 'readonly')
          const storeEvents = txn.objectStore('Events')

          for await (const cursor of storeEvents) {
            const serializedObject = JSON.stringify({
              ...cursor.value,
              '__type': 'Event'
            })

            controller.enqueue(encoder.encode(serializedObject + '\n'))
          }

          const storeEventLogs = txn.objectStore('EventLogs')
          const indexByDate = storeEventLogs.index('by_createdAt')

          for await (const cursor of indexByDate.iterate(null, 'prev')) {
            const serializedObject = JSON.stringify({
              ...cursor.value,
              '__type': 'EventLog'
            })

            controller.enqueue(encoder.encode(serializedObject + '\n'))
          }

          controller.close()
        } catch (error) {
          console.error('Export failed:', error)
          controller.error(error)
        }
      }
    })
  }

  async importData(items: StorageRecord[]): Promise<void> {
    const db = await this.database()

    const events: Event[] = []
    const eventLogs: EventLog[] = []

    items.forEach(item => {
      const { __type, ...object } = item

      if (__type === 'Event') {
        events.push(object as Event)
      } else if (__type === 'EventLog') {
        eventLogs.push(object as EventLog)
      } else {
        throw new Error('Import data process cannot recognize record type.')
      }
    })

    const txn = db.transaction(['EventLogs', 'Events'], 'readwrite')
    const storeEvents = txn.objectStore('Events')
    const storeEventLogs = txn.objectStore('EventLogs')

    const eventsPromises = events.map(event => storeEvents.add(event))
    const eventLogsPromises = eventLogs.map(eventLog => storeEventLogs.add(eventLog))

    await Promise.all([
      ...eventsPromises,
      ...eventLogsPromises,
      txn.done
    ])

    this.clearCache()
  }
}
