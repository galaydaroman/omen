import { createBrowserRouter } from 'react-router'

import HomeLayout from './HomeLayout'
import HomePage from './HomePage'
import NewLogPage from './NewLogPage'
import EditEventPage from './EditEventPage'
import EventLogsPage from './EventLogsPage'
import DebugPage from './DebugPage'
import StatisticsPage from './StatisticsPage'

const router = createBrowserRouter(
  [
    {
      Component: HomeLayout,
      children: [
        {
          index: true,
          Component: HomePage
        },
        {
          path: 'new',
          Component: NewLogPage
        },
        {
          path: 'edit-event',
          Component: EditEventPage
        },
        {
          path: 'history',
          Component: EventLogsPage
        },
        {
          path: 'statistics',
          Component: StatisticsPage
        },
        {
          path: 'debug',
          Component: DebugPage
        }
      ]
    },
    {
      path: '/ping',
      index: true,
      element: <div>Pong!</div>
    }
  ],
  {
    basename: import.meta.env.BASE_URL
  }
)

export default router
