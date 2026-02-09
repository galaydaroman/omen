import { useState, useMemo, useCallback } from 'react'
import { useFetchEventLogsByDateQuery, useFetchEventsQuery } from '@/services/eventApi'
import type { Event } from '@/types'
import { ChevronsUpDownIcon } from 'lucide-react'

import {
  format,
  getYear,
  addDays,
  addWeeks,
  addMonths,
  startOfDay,
  startOfWeek,
  startOfMonth,
  subMilliseconds
} from 'date-fns'

import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { type ChartConfig } from '@/components/ui/chart'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'

import {
  Card,
  CardTitle,
  CardAction,
  CardHeader,
  CardContent,
  CardDescription
} from '@/components/ui/card'

import {
  NativeSelect,
  NativeSelectOption
} from '@/components/ui/native-select'

import {
  Field,
  FieldGroup
} from '@/components/ui/field'

type Period = 'week' | 'month'

function formatDateKey(date: Date) {
  return format(date, 'MMM d, yyyy')
}

export default function StatisticsPage() {
  const [today] = useState<Date>(startOfDay(new Date()))
  const [event, setEvent] = useState<Event | null>()
  const [tags, setTags] = useState<string[]>([])
  const [period, setPeriod] = useState<Period>('week')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const { data: events, isLoading: isEventsLoading } = useFetchEventsQuery()

  const dateRange = useMemo(() => {
    const initialPeriodStartDate = period === 'week'
      ? startOfWeek(today, { weekStartsOn: 1 })
      : startOfMonth(today)

    const startDate = period === 'week'
      ? addWeeks(initialPeriodStartDate, 1 - currentPage)
      : addMonths(initialPeriodStartDate, 1 - currentPage)

    const endDate = subMilliseconds(
      period === 'week'
        ? addWeeks(startDate, 1)
        : addMonths(startDate, 1),
      1
    )

    return [startDate, endDate]
  }, [today, period, currentPage])

  const {
    data: eventLogs,
    isFetching: isEventLogsLoading,
    isError: isEventLogsError,
    error
  } = useFetchEventLogsByDateQuery({
    eventId: event?.id ?? '',
    tags,
    dateRange: [
      dateRange[0].toISOString(),
      dateRange[1].toISOString()
    ]
  }, { skip: !event })

  const nextPage = useCallback(() => {
    setCurrentPage(currentPage => currentPage + 1)
  }, [])

  const previousPage = useCallback(() => {
    setCurrentPage(currentPage => Math.max(1, currentPage - 1))
  }, [])

  const changePeriod = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setPeriod(e.target.value as Period)
    setCurrentPage(1)
  }, [])

  const changeSelectedEvent = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const eventId = e.target.value
    const selectedEvent = events?.find(event => event.id === eventId)
    setEvent(selectedEvent)
    setTags([])
  }, [events])

  const toggleTag = useCallback((tag: string) => () => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag))
    } else {
      setTags([...tags, tag])
    }
  }, [tags])

  const chartData = useMemo(() => {
    const [startDate, endDate] = dateRange
    const dataHash: Record<string, number> = {}

    let currentDate = startDate
    while (currentDate < endDate) {
      const key = formatDateKey(currentDate)
      dataHash[key] = 0
      currentDate = addDays(currentDate, 1)
    }

    if (!isEventLogsLoading) {
      eventLogs?.forEach(eventLog => {
        const createdAt = new Date(eventLog.createdAt)
        const key = formatDateKey(createdAt)

        if (dataHash[key] !== undefined) {
          dataHash[key] += 1
        } else {
          console.log('[StatisticsPage] event log is out of range')
        }
      })
    }

    return Object.entries(dataHash).map(([key, value]) => ({
      date: key,
      count: value
    }))
  }, [eventLogs, dateRange, isEventLogsLoading])

  const chartConfig = useMemo(() => ({
    count: {
      label: event?.name,
      // color: '#2563eb',
      // theme: 'dark'
    }
  } satisfies ChartConfig), [event])

  if (isEventLogsError) {
    console.log(error)
  }

  return (
    <div className="flex justify-center">
      <div className="flex flex-col w-full max-w-md">
        <Collapsible>
          <Card className="my-4 py-2">
            <CardHeader>
                <CollapsibleTrigger asChild>
                  <CardDescription className="pt-2">
                    Filter history
                  </CardDescription>
                </CollapsibleTrigger>
              <CardAction>
                <CollapsibleTrigger asChild>
                  <Button variant="secondary" size="icon-sm">
                    <ChevronsUpDownIcon />
                  </Button>
                </CollapsibleTrigger>
              </CardAction>
            </CardHeader>
            <CollapsibleContent asChild>
              <CardContent className="pb-2">
                <FieldGroup>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <div className="flex items-center w-full relative">
                        <NativeSelect id="selected-event" className="w-full" onChange={changeSelectedEvent} value={event?.id ?? ''}>
                          <NativeSelectOption value="">All events</NativeSelectOption>
                          {
                            events?.map(event => (
                              <NativeSelectOption key={event.id} value={event.id}>
                                {event.name}
                              </NativeSelectOption>
                            ))
                          }
                        </NativeSelect>
                        {
                          isEventsLoading && <Spinner className="ml-2" />
                        }
                      </div>
                    </Field>
                    <Field>
                      <div className="flex flex-wrap gap-2">
                        {
                          event?.tags.map(tag => (
                            <Badge
                              key={tag}
                              className="dark:text-foreground cursor-pointer"
                              size="lg"
                              variant={tags.includes(tag) ? "default" : "secondary"}
                              onClick={toggleTag(tag)}
                            >
                              {tag}
                            </Badge>
                          ))
                        }
                      </div>
                    </Field>
                  </div>
                </FieldGroup>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <Card className="pt-0">
          <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
            <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-0">

              <CardTitle>
                <div className="flex flex-row">
                  <span>Statistics chart</span>
                  {isEventLogsLoading && <Spinner className="ml-2" />}
                </div>
              </CardTitle>
              <CardDescription>
                {
                  !event ? "Select event" : `Showing data for "${event.name}" event`
                }
              </CardDescription>
            </div>
            <div className="flex">
              <div className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6">
                <span className="text-muted-foreground text-xs">
                  Period
                </span>
                <div className="text-lg leading-none font-bold sm:text-3xl">
                  <NativeSelect id="selected-period" onChange={changePeriod} value={period}>
                    <NativeSelectOption value="week">By week</NativeSelectOption>
                    <NativeSelectOption value="month">By month</NativeSelectOption>
                  </NativeSelect>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
              <BarChart data={chartData}>
                <ChartTooltip content={<ChartTooltipContent />} />
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value: string) => {
                    const [day, year] = value.split(', ')

                    if (period === 'week') {
                      return year === getYear(today).toString() ? day : value
                    } else {
                      return day.split(' ')[1]
                    }
                  }}
                />
                <YAxis
                  dataKey="count"
                  tickLine={false}
                  tickMargin={0}
                  axisLine={false}
                  allowDecimals={false}
                  width={20}
                />
                <Bar dataKey="count" fill="var(--color-chart-1)" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <div className="flex flex-row p-2 text-muted-foreground text-sm">
          <div className="flex justify-center">
            <Button variant="ghost" onClick={nextPage}>&lt; Previous</Button>
          </div>
          <div className="flex flex-1 justify-center items-center text-foreground">
            {
              period === 'week'
                ? dateRange.map(date => formatDateKey(date)).join(' - ')
                : format(dateRange[0], 'MMMM yyyy')
            }
          </div>
          <div className="flex justify-center">
            <Button variant="ghost" onClick={previousPage}>Next &gt;</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
