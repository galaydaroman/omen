import EventsIndexedStorage from './eventsIndexedStorage'
import { openDB } from 'idb'
import type { Event, EventLog } from '@/types'
import type { Mock } from 'vitest'

interface MockDB {
  getAllFromIndex: Mock
  add: Mock
  put: Mock
  close: Mock
  transaction: Mock
  objectStoreNames: {
    contains: Mock
  }
  createObjectStore: Mock
}

// Mock idb
vi.mock('idb', () => ({
  openDB: vi.fn(),
  deleteDB: vi.fn(),
}))

// Mock nanoid
vi.mock('nanoid', () => ({
  nanoid: (size?: number) => 'test-id-' + size,
}))

describe('EventsIndexedStorage', () => {
  let service: EventsIndexedStorage
  let mockDb: MockDB

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup basic DB mock
    mockDb = {
      getAllFromIndex: vi.fn().mockResolvedValue([]),
      add: vi.fn().mockResolvedValue('key'),
      put: vi.fn().mockResolvedValue('key'),
      close: vi.fn(),
      transaction: vi.fn(),
      objectStoreNames: {
        contains: vi.fn().mockReturnValue(true)
      },
      createObjectStore: vi.fn().mockReturnValue({
        createIndex: vi.fn()
      })
    }

    ;(openDB as Mock).mockResolvedValue(mockDb)

    // Mock navigator.storage
    Object.defineProperty(navigator, 'storage', {
      value: {
        persisted: vi.fn().mockResolvedValue(true),
        persist: vi.fn().mockResolvedValue(true),
      },
      writable: true,
    })

    service = new EventsIndexedStorage()
  })

  afterEach(async () => {
    await service.closeDatabase()
  })

  describe('Initialization', () => {
    it('should check for persistence on init', async () => {
      expect(openDB).toHaveBeenCalled()
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(navigator.storage.persisted).toHaveBeenCalled()
    })

    it('should request persistence if not persisted', async () => {
      (navigator.storage.persisted as Mock).mockResolvedValue(false)

      // We need a new instance to trigger the constructor logic again,
      // but the mock for persisted needs to be set before that.
      // Since beforeEach already created 'service', we create a new one here.
      const localService = new EventsIndexedStorage()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(navigator.storage.persist).toHaveBeenCalled()
      await localService.closeDatabase()
    })
  })

  describe('Events', () => {
    it('should fetch events from DB', async () => {
      const mockEvents = [{ id: '1', name: 'Event 1', order: 1 }]
      mockDb.getAllFromIndex.mockResolvedValue(mockEvents)

      const events = await service.fetchEvents()

      expect(mockDb.getAllFromIndex).toHaveBeenCalledWith('Events', 'by_order')
      expect(events).toEqual(mockEvents)
    })

    it('should cache events after fetch', async () => {
      const mockEvents = [{ id: '1', name: 'Event 1' }]
      mockDb.getAllFromIndex.mockResolvedValue(mockEvents)

      await service.fetchEvents()
      await service.fetchEvents()

      expect(mockDb.getAllFromIndex).toHaveBeenCalledTimes(1)
    })

    it('should add event and clear cache', async () => {
      const newEvent = { name: 'New Event' }
      mockDb.getAllFromIndex.mockResolvedValue([])

      await service.addEvent(newEvent)

      expect(mockDb.add).toHaveBeenCalledWith('Events', expect.objectContaining({
        id: 'test-id-4',
        name: 'New Event',
        tags: [],
        order: 0
      }))

      // Verify cache is cleared by checking if next fetch calls DB
      // Reset the mock call count to verify the NEW call
      mockDb.getAllFromIndex.mockClear()
      mockDb.getAllFromIndex.mockResolvedValue([{
        id: 'test-id-4',
        name: 'New Event',
        tags: []
      }])

      await service.fetchEvents()
      expect(mockDb.getAllFromIndex).toHaveBeenCalled()
    })

    it('should validate event name uniqueness', async () => {
      mockDb.getAllFromIndex.mockResolvedValue([{ id: '1', name: 'Existing' }])

      await expect(service.addEvent({ name: 'Existing' })).rejects.toThrow('Event name is already in use')
    })

    it('should validate event name presence', async () => {
      await expect(service.addEvent({})).rejects.toThrow('Event name is missing')
    })
  })

  describe('EventLogs', () => {
    it('should fetch event logs using cursor', async () => {
      const mockEvents = [{ id: 'e1', name: 'Event 1' }]
      const mockLogs = [
        { id: 'l1', eventId: 'e1', note: 'Log 1' },
        { id: 'l2', eventId: 'e1', note: 'Log 2' }
      ]

      mockDb.getAllFromIndex.mockResolvedValue(mockEvents)

      // Setup cursor
      const cursorMock: { value: Partial<EventLog> | null, continue: Mock } = {
        value: null,
        continue: vi.fn(),
      }

      let cursorIndex = 0
      const openCursorMock = vi.fn().mockImplementation(async () => {
         cursorIndex = 0
         cursorMock.value = mockLogs[0]
         return cursorMock
      })

      cursorMock.continue.mockImplementation(async () => {
        cursorIndex++
        if (cursorIndex < mockLogs.length) {
          cursorMock.value = mockLogs[cursorIndex]
          return cursorMock
        }
        return null
      })

      // Setup transaction structure
      const indexMock = { openCursor: openCursorMock }
      const storeMock = { index: vi.fn().mockReturnValue(indexMock) }
      const txnMock = { store: storeMock }
      mockDb.transaction.mockReturnValue(txnMock)

      const logs = await service.fetchEventLogs({ pagination: { limit: 30 } })

      expect(logs).toHaveLength(2)

      expect(logs[0]).toEqual({
        id: 'l1',
        eventId: 'e1',
        name: 'Event 1',
        note: 'Log 1'
      })

      expect(logs[1]).toEqual({
        id: 'l2',
        eventId: 'e1',
        name: 'Event 1',
        note: 'Log 2'
      })

      expect(mockDb.transaction).toHaveBeenCalledWith('EventLogs', 'readonly')
      expect(storeMock.index).toHaveBeenCalledWith('by_createdAt')
    })

    it('should add event log and update event tags', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-25T12:00:00Z'))

      const mockEvent = { id: 'e1', name: 'Event 1', tags: ['old'] }
      mockDb.getAllFromIndex.mockResolvedValue([mockEvent])

      const txnMock = {
        objectStore: vi.fn().mockReturnValue({
          add: vi.fn(),
          put: vi.fn()
        }),
        done: Promise.resolve()
      }
      mockDb.transaction.mockReturnValue(txnMock)

      await service.addEventLog({ eventId: 'e1', tags: ['new'] })

      // Expect transaction on both stores
      expect(mockDb.transaction).toHaveBeenCalledWith(['EventLogs', 'Events'], 'readwrite')

      // Since objectStore is called twice, we verify calls
      expect(txnMock.objectStore).toHaveBeenCalledWith('EventLogs')
      expect(txnMock.objectStore).toHaveBeenCalledWith('Events')

      expect(txnMock.objectStore().add).toHaveBeenCalledWith({
        id: 'test-id-6',
        eventId: 'e1',
        tags: ['new'],
        note: '',
        createdAt: '2026-01-25T12:00:00.000Z',
        updatedAt: '2026-01-25T12:00:00.000Z'
      })

      expect(txnMock.objectStore().put).toHaveBeenCalledWith({
        id: 'e1',
        name: 'Event 1',
        tags: ['new', 'old'],
        order: -1
      })

      vi.useRealTimers()
    })

    it('should update event log and update event tags', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-25T12:00:00Z'))

      const mockEvent = { id: 'e1', name: 'Event 1', tags: ['old'] }
      mockDb.getAllFromIndex.mockResolvedValue([mockEvent])
      await service.fetchEvents()

      const txnMock = {
        objectStore: vi.fn().mockReturnValue({
          put: vi.fn(),
        }),
        done: Promise.resolve()
      }
      mockDb.transaction.mockReturnValue(txnMock)

      const logToUpdate = { id: 'l1', eventId: 'e1', note: 'Updated', tags: ['new-tag'], createdAt: 'date' } as EventLog
      await service.updateEventLog(logToUpdate)

      expect(mockDb.transaction).toHaveBeenCalledWith(['EventLogs', 'Events'], 'readwrite')
      expect(txnMock.objectStore).toHaveBeenCalledWith('EventLogs')
      expect(txnMock.objectStore).toHaveBeenCalledWith('Events')

      // Verify puts
      // 1. Log update
      // 2. Event update (tags merged)
      const putCalls = txnMock.objectStore().put.mock.calls

      // Check for event update
      const updatedEventCall = putCalls.find((args: Event[]) => args[0].id === 'e1')

      expect(updatedEventCall).toBeDefined()
      expect(updatedEventCall[0]).toEqual({
        id: 'e1',
        name: 'Event 1',
        tags: ['new-tag', 'old'],
        order: -1
      })

      const updatedEventLogCall = putCalls.find((args: EventLog[]) => args[0].id === 'l1')

      expect(updatedEventLogCall).toBeDefined()
      expect(updatedEventLogCall[0]).toEqual({
        id: 'l1',
        eventId: 'e1',
        note: 'Updated',
        tags: ['new-tag'],
        createdAt: 'date',
        updatedAt: '2026-01-25T12:00:00.000Z'
      })

      vi.useRealTimers()
    })
  })

  describe('Database Management', () => {
    it('should clear database', async () => {
      const { deleteDB } = await import('idb')

      await service.clearDatabase()

      expect(mockDb.close).toHaveBeenCalled()
      expect(deleteDB).toHaveBeenCalled()
    })
  })
})
