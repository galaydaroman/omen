import EventsLocalStorage from './eventsLocalStorage'

describe('EventsLocalStorage', () => {
  let service: EventsLocalStorage

  beforeEach(() => {
    localStorage.clear()
    // Reset singleton-like behavior if necessary or just create new instance
    service = new EventsLocalStorage()
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should return empty data when storage is empty', async () => {
      const events = await service.fetchEvents()
      const logs = await service.fetchEventLogs()
      expect(events).toEqual([])
      expect(logs).toEqual([])
    })

    it('should handle corrupted JSON in localStorage', () => {
      localStorage.setItem('omen-events', '{invalid:json}')
      const data = service.getData()
      expect(data.events).toEqual([])
      expect(data.eventLogs).toEqual([])
    })
  })

  describe('Events Management', () => {
    it('should add a new event and retrieve it', async () => {
      await service.addEvent({ name: 'Workout', tags: ['health'] })
      const events = await service.fetchEvents()

      expect(events).toHaveLength(1)
      expect(events[0].name).toBe('Workout')
      expect(events[0].tags).toContain('health')
      expect(events[0].id).toHaveLength(4)
    })

    it('should find an event by id', async () => {
      await service.addEvent({ name: 'Test' })
      const events = await service.fetchEvents()
      const id = events[0].id

      const found = service.fetchEventById(id)
      expect(found).toEqual(events[0])
    })

    it('should throw error when adding event without name', async () => {
      await expect(service.addEvent({})).rejects.toThrow('[EventsLocalStorage] Event name is missing')
    })
  })

  describe('Event Logs Management', () => {
    let eventId: string

    beforeEach(async () => {
      await service.addEvent({ name: 'Coding', tags: ['work'] })
      const events = await service.fetchEvents()
      eventId = events[0].id
    })

    it('should add an event log and retrieve it', async () => {
      await service.addEventLog({ eventId, note: 'Finished feature' })
      const logs = await service.fetchEventLogs()

      expect(logs).toHaveLength(1)
      expect(logs[0].eventId).toBe(eventId)
      expect(logs[0].note).toBe('Finished feature')
      expect(logs[0].createdAt).toBeDefined()
    })

    it('should update event tags when log has new tags', async () => {
      await service.addEventLog({ eventId, tags: ['urgent', 'bug'] })

      const event = service.fetchEventById(eventId)
      expect(event?.tags).toContain('work')
      expect(event?.tags).toContain('urgent')
      expect(event?.tags).toContain('bug')
    })

    it('should return logs in reverse chronological order', async () => {
      await service.addEventLog({ eventId, note: 'First' })
      // Small delay to ensure different timestamps if needed, though they are pushed sequentially
      await service.addEventLog({ eventId, note: 'Second' })

      const logs = await service.fetchEventLogs()
      expect(logs[0].note).toBe('Second')
      expect(logs[1].note).toBe('First')
    })

    it('should respect the limit parameter', async () => {
      for (let i = 0; i < 5; i++) {
        await service.addEventLog({ eventId, note: `Log ${i}` })
      }

      const logs = await service.fetchEventLogs(2)
      expect(logs).toHaveLength(2)
      expect(logs[0].note).toBe('Log 4')
    })

    it('should throw if eventId is missing', async () => {
      await expect(service.addEventLog({})).rejects.toThrow("[EventsLocalStorage] EventLog's reference to eventId is missing")
    })

    it('should throw if eventId does not exist', async () => {
      await expect(service.addEventLog({ eventId: 'non-existent' })).rejects.toThrow('[EventsLocalStorage] EventLog references to not existing event')
    })
  })

  describe('Caching', () => {
    it('should use cache to avoid redundant localStorage reads', async () => {
      const getItemSpy = vi.spyOn(localStorage, 'getItem')

      await service.fetchEvents() // 1st read
      await service.fetchEvents() // should be cached

      expect(getItemSpy).toHaveBeenCalledTimes(1)
    })

    it('should invalidate cache when saving data', async () => {
      await service.fetchEvents() // Fill cache
      await service.addEvent({ name: 'New Event' }) // Saves data, should clear cache

      const getItemSpy = vi.spyOn(localStorage, 'getItem')
      await service.fetchEvents() // Should read from storage again

      expect(getItemSpy).toHaveBeenCalled()
    })
  })
})
