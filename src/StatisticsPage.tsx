import { useState, useMemo, useCallback } from 'react'
import { useFetchEventLogsByDateQuery } from '@/services/eventApi'
import EventsFilter, { type EventsFilterItem } from '@/components/app/EventsFilter'

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
import { Button } from '@/components/ui/button'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import {
  type ChartConfig,
  ChartLegend,
  ChartLegendContent,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart'

import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription
} from '@/components/ui/card'

import {
  NativeSelect,
  NativeSelectOption
} from '@/components/ui/native-select'

type Period = 'week' | 'month'

function formatDateKey(date: Date) {
  return format(date, 'MMM d, yyyy')
}

export default function StatisticsPage() {
  const [today] = useState<Date>(startOfDay(new Date()))
  const [filter, setFilter] = useState<EventsFilterItem[]>([])
  const [period, setPeriod] = useState<Period>('week')
  const [currentPage, setCurrentPage] = useState<number>(1)

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
    events: filter,
    dateRange: [
      dateRange[0].toISOString(),
      dateRange[1].toISOString()
    ]
  }, { skip: !filter.length })

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

  const chartData = useMemo(() => {
    const [startDate, endDate] = dateRange
    const dataHash: Record<string, Record<string, number>> = {}

    const zeroDataItem = filter.reduce((result, item) => {
      result[item.eventId] = 0
      return result
    }, {} as Record<string, number>)

    let currentDate = startDate
    while (currentDate < endDate) {
      const key = formatDateKey(currentDate)
      dataHash[key] = { ...zeroDataItem }
      currentDate = addDays(currentDate, 1)
    }

    if (!isEventLogsLoading) {
      eventLogs?.forEach(eventLog => {
        const createdAt = new Date(eventLog.createdAt)
        const key = formatDateKey(createdAt)

        if (dataHash[key] !== undefined) {
          if (dataHash[key][eventLog.eventId] !== undefined) {
            dataHash[key][eventLog.eventId] += 1
          } else {
            console.log('[StatisticsPage] event log is out of event list')
          }
        } else {
          console.log('[StatisticsPage] event log is out of range')
        }
      })
    }

    return Object.entries(dataHash).map(([date, data]) => ({ date, ...data }))
  }, [eventLogs, filter, dateRange, isEventLogsLoading])

  const chartConfig = useMemo(() => {
    return filter.reduce<ChartConfig>((result, value, index) => {
      result[value.eventId] = {
        label: value.event.name,
        color: `var(--chart-${(index % 5) + 1})`
        // theme: 'dark'
      }

      return result
    }, {})
  }, [filter])

  if (isEventLogsError) {
    console.log(error)
  }

  return (
    <div className="flex justify-center">
      <div className="flex flex-col w-full max-w-md">
        <EventsFilter onFilterChange={setFilter} />

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
                  "Select event"
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
            <ChartContainer config={chartConfig} className="h-[300px] min-h-[300px] w-full">
              <BarChart data={chartData} className="h-[300px] min-h-[300px] w-full">
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
                  tickLine={false}
                  tickMargin={0}
                  axisLine={false}
                  allowDecimals={false}
                  width={20}
                />
                <ChartLegend content={<ChartLegendContent />} />
                {
                  filter.map((item, index) => (
                    <Bar
                      key={item.eventId}
                      stackId={"a"}
                      dataKey={item.eventId}
                      fill={`var(--chart-${(index % 5) + 1})`}
                    />
                  ))
                }
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
