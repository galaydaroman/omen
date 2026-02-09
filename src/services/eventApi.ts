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

interface FetchEventLogsByDateFilter {
  eventId: string,
  tags?: string[],
  dateRange: [string, string]
}

export const eventsStorage = new EventsStorageAdapter()
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
        getNextPageParam: (currentPage, _allPages, currentPageParam, _allPageParams, queryArg) => {
          return !queryArg.limit || currentPage.length < queryArg.limit ? undefined : currentPageParam + 1
        }
      },
      providesTags: () => [{ type: 'EventLog', id: 'LIST' }]
    }),
    fetchEventLogsByDate: builder.query<EventLogs, FetchEventLogsByDateFilter>({
      queryFn: ({ eventId, tags, dateRange }) => {
        return eventsStorage.fetchEventLogs({
          filters: {
            eventId,
            tags,
            dateRange
          }
        })
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
  useFetchEventLogsByDateQuery,
  useFetchEventLogsInfiniteQuery,
  useAddEventLogMutation,
  useUpdateEventLogMutation
} = eventApi
