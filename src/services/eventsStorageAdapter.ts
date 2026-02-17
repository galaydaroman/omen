import EventsLocalStorage from './eventsLocalStorage'
import EventsIndexedStorage from './eventsIndexedStorage'

import type {
  Event,
  Events,
  EventLog,
  EventLogs,
  StorageRecord,
  StorageDataApi,
  FetchEventLogsParams
} from '../types'

type StorageDataConstructor = new () => StorageDataApi

interface StorageApiError {
  error: {
    status: string,
    error: string,
    data?: string
  }
}

interface StorageApiResponse<ReturnType> {
  data: ReturnType
}

type ResponseValue<ReturnType> = Promise<StorageApiResponse<ReturnType> | StorageApiError>

interface StandardError {
  message?: string
}

const storageTypes: Record<string, StorageDataConstructor> = {
  localStorage: EventsLocalStorage,
  indexedStorage: EventsIndexedStorage
}

export default class EventsStorageAdapter {
  private readonly StorageClass: StorageDataConstructor
  private readonly storage: StorageDataApi

  constructor(storageTypeName: string = 'indexedStorage') {
    const FoundClass = storageTypes[storageTypeName]

    if (!FoundClass) {
      throw new Error(`Storage type ${storageTypeName} not found`)
    }

    this.StorageClass = FoundClass
    this.storage = new this.StorageClass()
  }

  async resetStorage(): Promise<void> {
    await this.storage.clearDatabase()
  }

  exportData(): Promise<ReadableStream<string | Uint8Array>> {
    return this.storage.exportData()
  }

  importData(items: StorageRecord[]): Promise<void> {
    return this.storage.importData(items)
  }

  async formatResponse<ReturnType>(errorMessage: string, handler: () => Promise<ReturnType>): ResponseValue<ReturnType> {
    try {
      const result = await handler()
      return { data: result }
    } catch (error) {
      console.error(error)

      return {
        error: {
          status: 'CUSTOM_ERROR',
          error: errorMessage,
          data: (error as StandardError)?.message
        }
      }
    }
  }

  fetchEvents(): ResponseValue<Events> {
    return this.formatResponse<Events>(
      'Failed to fetch events',
      () => this.storage.fetchEvents()
    )
  }

  addEvent(event: Partial<Event>): ResponseValue<void> {
    return this.formatResponse<void>(
      'Failed to add event',
      () => this.storage.addEvent(event)
    )
  }

  fetchEventLogs(params: FetchEventLogsParams): ResponseValue<EventLogs> {
    return this.formatResponse<EventLogs>(
      'Failed to fetch event logs',
      () => this.storage.fetchEventLogs(params)
    )
  }

  addEventLog(eventLog: Partial<EventLog>): ResponseValue<void> {
    return this.formatResponse<void>(
      'Failed to add event log',
      () => this.storage.addEventLog(eventLog)
    )
  }

  updateEventLog(eventLog: EventLog): ResponseValue<void> {
    return this.formatResponse<void>(
      'Failed to update event log',
      () => this.storage.updateEventLog(eventLog)
    )
  }
}
