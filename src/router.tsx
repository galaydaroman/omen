import { createBrowserRouter } from 'react-router'

import HomeLayout from './HomeLayout'
import HomePage from './HomePage'
import NewLogPage from './NewLogPage'
import EditEventPage from './EditEventPage'
import DebugPage from './DebugPage'

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
          path: 'edit_event',
          Component: EditEventPage
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
