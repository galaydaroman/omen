import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react'
import type { Event, Events, EventLog, EventLogs } from '../types'
import EventsStorageAdapter from './eventsStorageAdapter'

declare global {
  interface Window {
    eventsStorage: EventsStorageAdapter
  }
}

interface FetchEventLogsFilter {
  eventId?: string,
  tags?: string[],
  limit: number
}

const eventsStorage = new EventsStorageAdapter()
// window.eventsStorage = eventsStorage

export const eventApi = createApi({
  reducerPath: 'eventApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Event', 'EventLog'],
  endpoints: builder => ({
    fetchEvents: builder.query<Events, void>({
      queryFn: () => eventsStorage.fetchEvents(),
      providesTags: () => [{ type: 'Event', id: 'LIST' }]
    }),
    addEvent: builder.mutation<void, Partial<Event>>({
      queryFn: (event) => eventsStorage.addEvent(event),
      invalidatesTags: [{ type: 'Event', id: 'LIST' }]
    }),
    fetchEventLogs: builder.infiniteQuery<EventLogs, FetchEventLogsFilter, number>({
      queryFn: ({ queryArg, pageParam }) => {
        const offset = queryArg.limit * (pageParam - 1)

        return eventsStorage.fetchEventLogs({
          filters: {
            eventId: queryArg.eventId,
            tags: queryArg.tags,
          },
          pagination: {
            offset,
            limit: queryArg.limit
          }
        })
      },
      infiniteQueryOptions: {
        initialPageParam: 1,
        getNextPageParam: (lastPage, _allPages, lastPageParam, _allPageParams, queryArg) => {
          return !queryArg.limit || lastPage.length < queryArg.limit ? undefined : lastPageParam + 1
        }
      },
      providesTags: () => [{ type: 'EventLog', id: 'LIST' }]
    }),
    addEventLog: builder.mutation<void, Partial<EventLog>>({
      queryFn: (eventLog) => eventsStorage.addEventLog(eventLog),
      invalidatesTags: [
        { type: 'EventLog', id: 'LIST' },
        { type: 'Event', id: 'LIST' }
      ]
    }),
    updateEventLog: builder.mutation<void, EventLog>({
      queryFn: (eventLog) => eventsStorage.updateEventLog(eventLog),
      invalidatesTags: [{ type: 'EventLog', id: 'LIST' }]
    })
  })
})

export const {
  useFetchEventsQuery,
  useAddEventMutation,
  useFetchEventLogsInfiniteQuery,
  useAddEventLogMutation,
  useUpdateEventLogMutation
} = eventApi
