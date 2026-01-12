import EventsLocalStorage from './eventsLocalStorage'
import type { Event, Events, EventLog, EventLogs, StorageDataApi } from '../types'

type StorageDataConstructor = new () => StorageDataApi

interface StorageApiError {
  status: string,
  error: string,
  data: { message: string }
}

interface StorageApiResponse<ReturnType> {
  data: ReturnType
}

type ResponseValue<ReturnType> = Promise<StorageApiResponse<ReturnType> | StorageApiError>

const storageTypes: Record<string, StorageDataConstructor> = {
  localStorage: EventsLocalStorage
}

export default class EventsStorageAdapter implements StorageDataApi {
  private readonly StorageClass: StorageDataConstructor
  private readonly storage: StorageDataApi

  constructor(storageTypeName: string) {
    const FoundClass = storageTypes[storageTypeName]

    if (!FoundClass) {
      throw new Error(`Storage type ${storageTypeName} not found`)
    }

    this.StorageClass = FoundClass
    this.storage = new this.StorageClass()
  }

  async formatResponse<ReturnType>(errorMessage: string, handler: () => Promise<ReturnType>): ResponseValue<ReturnType> {
    try {
      const result = await handler()
      return { data: result }
    } catch (error) {
      return {
        error: {
          status: 'CUSTOM_ERROR',
          error: errorMessage,
          data: error?.message
        }
      }
    }
  }

  fetchEvents(): Promise<Events> {
    return this.formatResponse<Events>(
      'Faied to fetch events',
      () => this.storage.fetchEvents()
    )
  }

  addEvent(event: Partial<Event>): Promise<void> {
    return this.formatResponse<void>(
      'Failed to add event',
      () => this.storage.addEvent(event)
    )
  }

  fetchEventLogs(limit: number = 30): Promise<EventLogs> {
    return this.formatResponse<EventLogs>(
      'Failed to fetch event logs',
      () => this.storage.fetchEventLogs(limit)
    )
  }

  addEventLog(eventLog: Partial<EventLog>): Promise<void> {
    return this.formatResponse<void>(
      'Failed to add event log',
      () => this.storage.addEventLog(eventLog)
    )
  }

  updateEventLog(eventLog: EventLog): Promise<void> {
    return this.formatResponse<void>(
      'Failed to update event log',
      () => this.storage.updateEventLog(eventLog)
    )
  }
}
